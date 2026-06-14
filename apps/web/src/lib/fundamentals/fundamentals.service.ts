import type { AssetClass } from '@/types/api';
import type { NormalizedFundamentals } from './fundamentals-adapter.interface';
import { EMPTY_FUNDAMENTALS } from './fundamentals-adapter.interface';
import { BrapiFundamentalsAdapter } from './brapi-fundamentals.adapter';
import { FinnhubFundamentalsAdapter } from './finnhub-fundamentals.adapter';
import { CoinGeckoFundamentalsAdapter } from './coingecko-fundamentals.adapter';
import { BDR_TICKERS, ETF_TICKERS, FII_TICKERS } from '@/lib/market/curated-lists';
import { CRYPTO_TICKER_MAP } from '@/lib/quotes/ticker-map';
import { DataSource, Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

const FUNDAMENTALS_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas

export interface FundamentalsResult {
  indicators: NormalizedFundamentals;
  assetClass: AssetClass;
  stale: boolean;
  asOf: string;
}

/**
 * Infere a classe do ativo pelo ticker usando heurística.
 * Mesmos conjuntos da curated-lists.ts + crypto ticker map.
 */
export function inferAssetClassForFundamentals(ticker: string): AssetClass {
  const upper = ticker.toUpperCase();

  if (BDR_TICKERS.has(upper)) return 'BDR';
  if (ETF_TICKERS.has(upper)) return 'ETF';
  if (FII_TICKERS.has(upper)) return 'FII';

  // Crypto: verifica no CRYPTO_TICKER_MAP (BTC, ETH, etc.)
  if (CRYPTO_TICKER_MAP[upper]) return 'CRYPTO';

  // STOCK_US: apenas letras maiúsculas, comprimento 1-5, sem dígito
  // (tickers B3 sempre terminam em dígito: PETR4, VALE3)
  if (/^[A-Z]{1,5}$/.test(upper)) return 'STOCK_US';

  return 'STOCK_BR';
}

function getDataSourceForClass(assetClass: AssetClass): DataSource {
  if (assetClass === 'CRYPTO') return DataSource.COINGECKO;
  if (assetClass === 'STOCK_US') return DataSource.FINNHUB;
  return DataSource.BRAPI;
}

function getAdapter(assetClass: AssetClass) {
  if (assetClass === 'CRYPTO') return new CoinGeckoFundamentalsAdapter();
  if (assetClass === 'STOCK_US') return new FinnhubFundamentalsAdapter();
  return new BrapiFundamentalsAdapter(assetClass);
}

function isExpired(fetchedAt: Date): boolean {
  return Date.now() - fetchedAt.getTime() > FUNDAMENTALS_CACHE_TTL_MS;
}

export async function getFundamentals(
  ticker: string,
  assetClassHint?: AssetClass,
): Promise<FundamentalsResult> {
  const assetClass = assetClassHint ?? inferAssetClassForFundamentals(ticker);
  const source = getDataSourceForClass(assetClass);
  const symbol = ticker.toUpperCase();

  // 1. Verificar cache
  const cached = await prisma.assetFundamentalsCache.findUnique({
    where: { symbol_source: { symbol, source } },
  });

  if (cached && !isExpired(cached.fetched_at)) {
    console.log(`[fundamentals.service] cache hit ticker=${symbol} source=${source}`);
    return {
      indicators: cached.data as unknown as NormalizedFundamentals,
      assetClass,
      stale: false,
      asOf: cached.fetched_at.toISOString(),
    };
  }

  // 2. Buscar na fonte
  const adapter = getAdapter(assetClass);
  try {
    const fresh = await adapter.fetchFundamentals(symbol);
    const now = new Date();

    await prisma.assetFundamentalsCache.upsert({
      where: { symbol_source: { symbol, source } },
      update: { data: fresh as unknown as Prisma.InputJsonValue, fetched_at: now },
      create: { symbol, source, data: fresh as unknown as Prisma.InputJsonValue, fetched_at: now },
    });

    console.log(`[fundamentals.service] cache miss (refreshed) ticker=${symbol} source=${source}`);
    return {
      indicators: fresh,
      assetClass,
      stale: false,
      asOf: now.toISOString(),
    };
  } catch (err) {
    console.warn(`[fundamentals.service] adapter error ticker=${symbol}: ${String(err)}`);

    // 3. Degradação: retornar cache expirado como stale
    if (cached) {
      console.log(`[fundamentals.service] serving stale cache ticker=${symbol}`);
      return {
        indicators: cached.data as unknown as NormalizedFundamentals,
        assetClass,
        stale: true,
        asOf: cached.fetched_at.toISOString(),
      };
    }

    // 4. Sem cache algum: retornar campos null (nunca lançar exceção)
    return {
      indicators: { ...EMPTY_FUNDAMENTALS },
      assetClass,
      stale: false,
      asOf: new Date().toISOString(),
    };
  }
}
