import { NextResponse } from 'next/server';
import { Decimal } from 'decimal.js';
import { DataSource } from '@prisma/client';
import { fetchCachedMarketValue } from '@/lib/market/market-cache';

interface IndexData {
  id: string;
  label: string;
  value: string;
  changePercent: string | null;
  stale: boolean;
}

async function fetchBrapiIndex(symbol: string): Promise<{ price: Decimal; changePercent: string | null; currency: string }> {
  const token = process.env.BRAPI_TOKEN;
  const url = `https://brapi.dev/api/quote/${symbol}?token=${token ?? ''}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`brapi returned ${response.status} for ${symbol}`);
  const data = await response.json();
  const quote = data?.results?.[0];
  if (!quote?.regularMarketPrice) throw new Error(`No price for ${symbol}`);
  return {
    price: new Decimal(String(quote.regularMarketPrice)),
    changePercent: quote.regularMarketChangePercent != null
      ? String(quote.regularMarketChangePercent)
      : null,
    currency: 'BRL',
  };
}

async function fetchUsdBrl(): Promise<{ price: Decimal; changePercent: string | null; currency: string }> {
  const url = 'https://economia.awesomeapi.com.br/last/USD-BRL';
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`AwesomeAPI returned ${response.status}`);
  const data = await response.json();
  const rate = data?.USDBRL?.bid;
  const pctChange = data?.USDBRL?.pctChange;
  if (!rate) throw new Error('No USD/BRL rate available');
  return {
    price: new Decimal(String(rate)),
    changePercent: pctChange != null ? String(pctChange) : null,
    currency: 'BRL',
  };
}

async function fetchBtcBrl(): Promise<{ price: Decimal; changePercent: string | null; currency: string }> {
  const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl&include_24hr_change=true';
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`CoinGecko returned ${response.status}`);
  const data = await response.json();
  const price = data?.bitcoin?.brl;
  const change = data?.bitcoin?.brl_24h_change;
  if (!price) throw new Error('No BTC price available');
  return {
    price: new Decimal(String(price)),
    changePercent: change != null ? String(change) : null,
    currency: 'BRL',
  };
}

export async function GET() {
  const now = new Date().toISOString();

  let ibovChangePercent: string | null = null;
  let ifixChangePercent: string | null = null;
  let usdBrlChangePercent: string | null = null;
  let btcChangePercent: string | null = null;

  const [ibovResult, ifixResult, usdBrlResult, btcResult] = await Promise.all([
    fetchCachedMarketValue('IBOVESPA', DataSource.BRAPI, 5 * 60 * 1000, async () => {
      const r = await fetchBrapiIndex('^BVSP');
      ibovChangePercent = r.changePercent;
      return { price: r.price, currency: r.currency };
    }),
    fetchCachedMarketValue('IFIX', DataSource.BRAPI, 5 * 60 * 1000, async () => {
      const r = await fetchBrapiIndex('IFIX');
      ifixChangePercent = r.changePercent;
      return { price: r.price, currency: r.currency };
    }),
    fetchCachedMarketValue('USDBRL', DataSource.BRAPI, 5 * 60 * 1000, async () => {
      const r = await fetchUsdBrl();
      usdBrlChangePercent = r.changePercent;
      return { price: r.price, currency: r.currency };
    }),
    fetchCachedMarketValue('BTC', DataSource.COINGECKO, 5 * 60 * 1000, async () => {
      const r = await fetchBtcBrl();
      btcChangePercent = r.changePercent;
      return { price: r.price, currency: r.currency };
    }),
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
      changePercent: ibovResult?.isStale ? null : ibovChangePercent,
      stale: ibovResult?.isStale ?? false,
    },
    {
      id: 'IFIX',
      label: 'IFIX',
      value: ifixResult ? formatNumber(ifixResult.price.toFixed(0)) : '—',
      changePercent: ifixResult?.isStale ? null : ifixChangePercent,
      stale: ifixResult?.isStale ?? false,
    },
    {
      id: 'USDBRL',
      label: 'USD/BRL',
      value: usdBrlResult ? `R$ ${usdBrlResult.price.toFixed(2)}` : '—',
      changePercent: usdBrlResult?.isStale ? null : usdBrlChangePercent,
      stale: usdBrlResult?.isStale ?? false,
    },
    {
      id: 'BTC',
      label: 'BTC/BRL',
      value: btcResult ? `R$ ${formatNumber(btcResult.price.toFixed(0))}` : '—',
      changePercent: btcResult?.isStale ? null : btcChangePercent,
      stale: btcResult?.isStale ?? false,
    },
    {
      id: 'CDI',
      label: 'CDI a.a.',
      value: '10,65%',
      changePercent: null,
      stale: false,
    },
  ];

  return NextResponse.json({ indices, asOf: now });
}

function formatNumber(value: string): string {
  return Number(value).toLocaleString('pt-BR');
}
