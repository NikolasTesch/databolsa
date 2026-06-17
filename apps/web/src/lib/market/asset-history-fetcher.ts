/**
 * asset-history-fetcher.ts
 *
 * Busca o histórico diário de preços de um ativo individual para uso na
 * construção da série temporal do portfólio (SPEC-0035).
 *
 * Fontes:
 *   - B3 (STOCK_BR, FII, ETF, BDR): brapi historicalDataPrice
 *   - STOCK_US: Finnhub /stock/candle resolution=D
 *   - CRYPTO: brapi (se suportado) ou fallback array vazio
 *
 * Cache: BenchmarkSeriesCache com series_key = 'portfolio_asset_{ticker}'
 *        TTL de 1h (dados históricos mudam com baixa frequência).
 *
 * Degradação (RN-10): falha de fonte → retornar [] sem lançar exceção.
 */

import { Decimal } from 'decimal.js';
import type { PricePoint } from '@databolsa/core';
import prisma from '@/lib/prisma';

const BRAPI_TOKEN = () => process.env.BRAPI_TOKEN ?? '';
const FINNHUB_TOKEN = () => process.env.FINNHUB_TOKEN ?? process.env.FINNHUB_KEY ?? '';

/** TTL de 1h para cache de histórico de preços de ativos */
const ASSET_HISTORY_TTL_MS = 60 * 60 * 1000;

/** Classes de ativos que usam brapi como fonte */
const BRAPI_ASSET_CLASSES = new Set([
  'STOCK_BR',
  'FII',
  'ETF',
  'BDR',
  'CRYPTO', // brapi suporta alguns cripto via ticker
]);

function dateToStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function seriesKey(ticker: string): string {
  return `portfolio_asset:${ticker}`;
}

/**
 * Lê o cache de histórico de preços para um ativo.
 * Retorna null se não houver cache ou se estiver expirado.
 * Retorna { data, isStale: true } se expirado mas disponível (para degradação).
 */
async function getCachedAssetHistory(
  ticker: string,
): Promise<{ data: PricePoint[]; isStale: boolean } | null> {
  const key = seriesKey(ticker);
  try {
    const cached = await prisma.benchmarkSeriesCache.findUnique({
      where: { series_key_period: { series_key: key, period: 'ALL' } },
    });
    if (!cached) return null;

    const isExpired = Date.now() - cached.fetched_at.getTime() > ASSET_HISTORY_TTL_MS;
    const raw = cached.data as unknown as Array<{ date: string; price: string }>;
    const data: PricePoint[] = raw.map((p) => ({
      date: p.date,
      price: new Decimal(p.price),
    }));
    return { data, isStale: isExpired };
  } catch (err) {
    console.warn(`[asset-history] cache read error for ${ticker}: ${String(err)}`);
    return null;
  }
}

/**
 * Salva o histórico de preços no cache.
 */
async function setCachedAssetHistory(
  ticker: string,
  data: PricePoint[],
): Promise<void> {
  const key = seriesKey(ticker);
  const payload = data.map((p) => ({
    date: p.date,
    price: p.price.toString(),
  })) as unknown as import('@prisma/client').Prisma.InputJsonValue;

  try {
    await prisma.benchmarkSeriesCache.upsert({
      where: { series_key_period: { series_key: key, period: 'ALL' } },
      update: { data: payload, fetched_at: new Date() },
      create: { series_key: key, period: 'ALL', data: payload },
    });
  } catch (err) {
    console.warn(`[asset-history] cache write error for ${ticker}: ${String(err)}`);
  }
}

/**
 * Busca histórico via brapi historicalDataPrice (B3, FII, ETF, BDR, alguns cripto).
 * Retorna até 5 anos de dados diários.
 */
async function fetchBrapiHistory(ticker: string): Promise<PricePoint[]> {
  const token = BRAPI_TOKEN();
  const url = `https://brapi.dev/api/quote/${encodeURIComponent(ticker)}?range=5y&interval=1d${token ? `&token=${token}` : ''}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`brapi history ${ticker} HTTP ${res.status}`);

  const data = await res.json();
  const prices: Array<{ date: number; close: number }> =
    data?.results?.[0]?.historicalDataPrice ?? [];

  return prices
    .filter((p) => p.close != null && p.date != null)
    .map((p) => ({
      date: dateToStr(new Date(p.date * 1000)),
      price: new Decimal(String(p.close)),
    }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/**
 * Busca histórico via Finnhub /stock/candle (STOCK_US).
 * Busca resolução diária (D) dos últimos 5 anos.
 */
async function fetchFinnhubHistory(ticker: string): Promise<PricePoint[]> {
  const token = FINNHUB_TOKEN();
  if (!token) throw new Error('FINNHUB_TOKEN not set');

  const to = Math.floor(Date.now() / 1000);
  const from = to - 5 * 365 * 24 * 3600; // ~5 anos em segundos

  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(ticker)}&resolution=D&from=${from}&to=${to}&token=${token}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Finnhub history ${ticker} HTTP ${res.status}`);

  const data = await res.json();
  if (data.s === 'no_data') return [];

  const timestamps: number[] = data.t ?? [];
  const closes: number[] = data.c ?? [];

  return timestamps
    .map((t, i) => ({
      date: dateToStr(new Date(t * 1000)),
      price: new Decimal(String(closes[i])),
    }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/**
 * Busca o histórico diário de preços de um ativo.
 *
 * @param ticker     Símbolo do ativo (ex: 'PETR4', 'AAPL', 'bitcoin')
 * @param assetClass Classe do ativo ('STOCK_BR' | 'FII' | 'ETF' | 'BDR' | 'CRYPTO' | 'STOCK_US')
 * @returns Array de {date, price} ordenado crescente. Retorna [] em falha (RN-10).
 */
export async function fetchAssetPriceHistory(
  ticker: string,
  assetClass: string,
): Promise<PricePoint[]> {
  // 1. Verificar cache (válido = não expirado)
  const cached = await getCachedAssetHistory(ticker);
  if (cached && !cached.isStale) {
    console.log(`[asset-history] cache HIT: ${ticker}`);
    return cached.data;
  }

  // 2. Buscar da fonte
  try {
    let data: PricePoint[];

    if (assetClass === 'STOCK_US') {
      data = await fetchFinnhubHistory(ticker);
    } else if (BRAPI_ASSET_CLASSES.has(assetClass)) {
      data = await fetchBrapiHistory(ticker);
    } else {
      console.warn(`[asset-history] unknown asset class '${assetClass}' for ${ticker}, skipping`);
      return cached?.data ?? [];
    }

    console.log(`[asset-history] cache MISS (refreshed): ${ticker} (${data.length} pontos)`);
    await setCachedAssetHistory(ticker, data);
    return data;
  } catch (err) {
    // RN-10: degradação — log + retornar cache stale ou []
    console.warn(`[asset-history] fetch failed for ${ticker}: ${String(err)}`);
    if (cached) {
      console.log(`[asset-history] using stale cache for ${ticker}`);
      return cached.data;
    }
    return [];
  }
}
