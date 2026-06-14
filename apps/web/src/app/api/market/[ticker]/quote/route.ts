import { NextRequest, NextResponse } from 'next/server';
import { Decimal } from 'decimal.js';
import { DataSource } from '@prisma/client';
import type { AssetClass } from '@/types/api';
import { fetchCachedMarketValue } from '@/lib/market/market-cache';
import { inferAssetClassForFundamentals } from '@/lib/fundamentals/fundamentals.service';
import { CRYPTO_TICKER_MAP } from '@/lib/quotes/ticker-map';
import { CRYPTO_ID_TO_NAME } from '@/lib/market/curated-lists';

const CRYPTO_TICKER_TO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(CRYPTO_TICKER_MAP).map(([ticker, id]) => [ticker, id]),
);

async function fetchUsdBrlRate(): Promise<Decimal> {
  const response = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL', {
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`AwesomeAPI returned ${response.status}`);
  const data = await response.json();
  const rate = data?.USDBRL?.bid;
  if (!rate) throw new Error('No USD/BRL rate available');
  return new Decimal(String(rate));
}

async function fetchBrapiQuote(symbol: string) {
  const token = process.env.BRAPI_TOKEN;
  const url = `https://brapi.dev/api/quote/${symbol}?token=${token ?? ''}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`brapi returned ${response.status} for ${symbol}`);
  const data = await response.json();
  const q = data?.results?.[0];
  if (!q?.regularMarketPrice) throw new Error(`No price for ${symbol}`);
  return {
    price: new Decimal(String(q.regularMarketPrice)),
    name: (q.longName ?? q.shortName ?? symbol) as string,
    changePercent: q.regularMarketChangePercent != null ? String(q.regularMarketChangePercent) : null,
    changeValue: q.regularMarketChange != null ? String(q.regularMarketChange) : null,
    currency: 'BRL' as const,
  };
}

async function fetchFinnhubQuote(symbol: string) {
  const token = process.env.FINNHUB_TOKEN ?? process.env.FINNHUB_KEY;
  const [quoteRes, profileRes] = await Promise.all([
    fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${token ?? ''}`, {
      signal: AbortSignal.timeout(5000),
    }),
    fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${token ?? ''}`, {
      signal: AbortSignal.timeout(5000),
    }),
  ]);
  if (!quoteRes.ok) throw new Error(`Finnhub returned ${quoteRes.status} for ${symbol}`);
  const qData = await quoteRes.json();
  if (!qData?.c) throw new Error(`No price for ${symbol}`);
  const profileData = profileRes.ok ? await profileRes.json() : {};
  return {
    price: new Decimal(String(qData.c)),
    name: (profileData?.name ?? symbol) as string,
    changePercent: qData.dp != null ? String(qData.dp) : null,
    changeValue: qData.d != null ? String(qData.d) : null,
    currency: 'USD' as const,
  };
}

async function fetchCoinGeckoQuote(symbol: string) {
  const coinId = CRYPTO_TICKER_TO_ID[symbol.toUpperCase()];
  if (!coinId) throw new Error(`Unknown crypto: ${symbol}`);
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=brl&include_24hr_change=true`;
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`CoinGecko returned ${response.status}`);
  const data = await response.json();
  if (!data[coinId]?.brl) throw new Error(`No price for ${symbol}`);
  return {
    price: new Decimal(String(data[coinId].brl)),
    name: (CRYPTO_ID_TO_NAME[coinId] ?? symbol) as string,
    changePercent: data[coinId].brl_24h_change != null ? String(data[coinId].brl_24h_change) : null,
    changeValue: null as string | null,
    currency: 'BRL' as const,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { ticker: string } },
) {
  const ticker = params.ticker.toUpperCase();
  const assetClass = inferAssetClassForFundamentals(ticker);
  const now = new Date().toISOString();

  let name = ticker;
  let changePercent: string | null = null;
  let changeValue: string | null = null;
  let currency: 'BRL' | 'USD' = 'BRL';
  let priceInBrl: string | null = null;

  const getDataSource = (): DataSource => {
    if (assetClass === 'CRYPTO') return DataSource.COINGECKO;
    if (assetClass === 'STOCK_US') return DataSource.FINNHUB;
    return DataSource.BRAPI;
  };

  const source = getDataSource();

  const cached = await fetchCachedMarketValue(
    ticker,
    source,
    5 * 60 * 1000,
    async () => {
      if (assetClass === 'CRYPTO') {
        const r = await fetchCoinGeckoQuote(ticker);
        changePercent = r.changePercent;
        name = r.name;
        currency = r.currency;
        return { price: r.price, currency: r.currency };
      }
      if (assetClass === 'STOCK_US' || assetClass === 'BDR') {
        if (assetClass === 'STOCK_US') {
          const r = await fetchFinnhubQuote(ticker);
          changePercent = r.changePercent;
          changeValue = r.changeValue;
          name = r.name;
          currency = r.currency;
          return { price: r.price, currency: r.currency };
        }
        // BDR usa brapi
        const r = await fetchBrapiQuote(ticker);
        changePercent = r.changePercent;
        changeValue = r.changeValue;
        name = r.name;
        currency = r.currency;
        return { price: r.price, currency: r.currency };
      }
      const r = await fetchBrapiQuote(ticker);
      changePercent = r.changePercent;
      changeValue = r.changeValue;
      name = r.name;
      currency = r.currency;
      return { price: r.price, currency: r.currency };
    },
  );

  if (!cached) {
    return NextResponse.json({ message: `Ativo não encontrado: ${ticker}` }, { status: 404 });
  }

  // Conversão USD -> BRL para STOCK_US
  const currencyStr = currency as string;
  if (currencyStr === 'USD') {
    try {
      const rate = await fetchUsdBrlRate();
      priceInBrl = cached.price.times(rate).toFixed(2);
    } catch {
      priceInBrl = null;
    }
  } else {
    priceInBrl = cached.price.toFixed(2);
  }

  return NextResponse.json({
    ticker,
    name,
    assetClass,
    price: cached.price.toFixed(assetClass === 'CRYPTO' ? 8 : 2),
    currency,
    priceInBrl,
    changePercent,
    changeValue,
    stale: cached.isStale,
    asOf: now,
  });
}
