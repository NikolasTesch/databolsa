import { NextRequest, NextResponse } from 'next/server';
import { Decimal } from 'decimal.js';
import { DataSource } from '@prisma/client';
import { fetchCachedMarketValue } from '@/lib/market/market-cache';
import { fetchBrapiQuote, fetchCoinGeckoMulti, fetchUsdBrlRate } from '@/lib/market/market-fetchers';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

interface IndexData {
  id: string;
  label: string;
  value: string;
  changePercent: string | null;
  stale: boolean;
}

async function fetchCdiRate(): Promise<string> {
  try {
    const cached = await fetchCachedMarketValue(
      'CDI',
      DataSource.BRAPI,
      24 * 60 * 60 * 1000,
      async () => {
        const response = await fetch(
          'https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json',
          { signal: AbortSignal.timeout(5000) },
        );
        if (!response.ok) throw new Error(`BCB returned ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error('Empty BCB response');
        const daily = new Decimal(String(data[0].valor));
        const annual = daily.div(100).plus(1).pow(252).minus(1).times(100);
        const formatted = annual.toFixed(2).replace('.', ',') + '%';
        return {
          price: annual,
          currency: 'BRL',
          name: formatted,
          changePercent: null,
          changeValue: null,
        };
      },
    );
    if (cached?.name && cached.name !== 'CDI') return cached.name;
    return '10,65%';
  } catch {
    return '10,65%';
  }
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`market:indices:${ip}`, { limit: 30, windowMs: 60 * 1000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: 'Muitas requisições. Tente novamente em instantes.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSec) },
      },
    );
  }

  const now = new Date().toISOString();

  const [ibovResult, ifixResult, usdBrlResult, btcResult, cdiValue] = await Promise.all([
    fetchCachedMarketValue('IBOVESPA', DataSource.BRAPI, 5 * 60 * 1000, async () => {
      const r = await fetchBrapiQuote('^BVSP');
      return {
        price: r.price,
        currency: r.currency,
        name: 'IBOVESPA',
        changePercent: r.changePercent,
        changeValue: null,
      };
    }),
    fetchCachedMarketValue('IFIX', DataSource.BRAPI, 5 * 60 * 1000, async () => {
      const r = await fetchBrapiQuote('IFIX');
      return {
        price: r.price,
        currency: r.currency,
        name: 'IFIX',
        changePercent: r.changePercent,
        changeValue: null,
      };
    }),
    fetchCachedMarketValue('USDBRL', DataSource.BRAPI, 5 * 60 * 1000, async () => {
      const r = await fetchUsdBrlRate();
      return {
        price: r.price,
        currency: 'BRL' as const,
        name: 'USD/BRL',
        changePercent: r.changePercent,
        changeValue: null,
      };
    }),
    fetchCachedMarketValue('BTC', DataSource.COINGECKO, 5 * 60 * 1000, async () => {
      const results = await fetchCoinGeckoMulti(['bitcoin']);
      const r = results['bitcoin'];
      if (!r) throw new Error('No BTC data from CoinGecko');
      return {
        price: r.price,
        currency: r.currency,
        name: 'Bitcoin',
        changePercent: r.changePercent,
        changeValue: null,
      };
    }),
    fetchCdiRate(),
  ]);

  if (!ibovResult && !ifixResult && !usdBrlResult && !btcResult) {
    return NextResponse.json(
      { message: 'Nenhuma fonte de índice disponível no momento' },
      { status: 503 },
    );
  }

  const indices: IndexData[] = [
    {
      id: 'IBOV',
      label: 'IBOV',
      value: ibovResult ? formatNumber(ibovResult.price.toFixed(0)) : '—',
      changePercent: ibovResult?.isStale ? null : (ibovResult?.changePercent ?? null),
      stale: ibovResult?.isStale ?? false,
    },
    {
      id: 'IFIX',
      label: 'IFIX',
      value: ifixResult ? formatNumber(ifixResult.price.toFixed(0)) : '—',
      changePercent: ifixResult?.isStale ? null : (ifixResult?.changePercent ?? null),
      stale: ifixResult?.isStale ?? false,
    },
    {
      id: 'USDBRL',
      label: 'USD/BRL',
      value: usdBrlResult ? `R$ ${usdBrlResult.price.toFixed(2)}` : '—',
      changePercent: usdBrlResult?.isStale ? null : (usdBrlResult?.changePercent ?? null),
      stale: usdBrlResult?.isStale ?? false,
    },
    {
      id: 'BTC',
      label: 'BTC/BRL',
      value: btcResult ? `R$ ${formatNumber(btcResult.price.toFixed(0))}` : '—',
      changePercent: btcResult?.isStale ? null : (btcResult?.changePercent ?? null),
      stale: btcResult?.isStale ?? false,
    },
    {
      id: 'CDI',
      label: 'CDI a.a.',
      value: cdiValue,
      changePercent: null,
      stale: false,
    },
  ];

  return NextResponse.json({ indices, asOf: now });
}

function formatNumber(value: string): string {
  return Number(value).toLocaleString('pt-BR');
}
