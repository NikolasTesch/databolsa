import { NextRequest, NextResponse } from 'next/server';
import { Decimal } from 'decimal.js';
import { DataSource } from '@prisma/client';
import type { AssetClass } from '@/types/api';
import { fetchCachedMarketValue } from '@/lib/market/market-cache';
import { CURATED_LISTS, CRYPTO_ID_TO_TICKER, CRYPTO_ID_TO_NAME } from '@/lib/market/curated-lists';

const VALID_TYPES = new Set<string>(['STOCK_BR', 'FII', 'ETF', 'BDR', 'CRYPTO', 'STOCK_US']);
const MAX_LIMIT = 6;

interface HighlightItem {
  ticker: string;
  name: string;
  assetClass: AssetClass;
  price: string;
  changePercent: string;
  stale: boolean;
}

interface BrapiQuoteResult {
  price: Decimal;
  changePercent: string | null;
  name: string;
  currency: string;
}

async function fetchBrapiQuote(symbol: string): Promise<BrapiQuoteResult> {
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
    name: quote.longName ?? quote.shortName ?? symbol,
    currency: 'BRL',
  };
}

async function fetchCoinGeckoMulti(
  coinIds: string[],
): Promise<Record<string, { price: Decimal; change: string | null; currency: string }>> {
  const ids = coinIds.join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=brl&include_24hr_change=true`;
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`CoinGecko returned ${response.status}`);
  const data = await response.json();
  const result: Record<string, { price: Decimal; change: string | null; currency: string }> = {};
  for (const id of coinIds) {
    if (data[id]?.brl) {
      result[id] = {
        price: new Decimal(String(data[id].brl)),
        change: data[id].brl_24h_change != null ? String(data[id].brl_24h_change) : null,
        currency: 'BRL',
      };
    }
  }
  return result;
}

async function fetchFinnhubQuote(symbol: string): Promise<{ price: Decimal; changePercent: string | null; currency: string }> {
  const token = process.env.FINNHUB_TOKEN;
  const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${token ?? ''}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`Finnhub returned ${response.status} for ${symbol}`);
  const data = await response.json();
  if (!data?.c) throw new Error(`No price for ${symbol}`);
  const change = data.dp != null ? String(data.dp) : null;
  return { price: new Decimal(String(data.c)), changePercent: change, currency: 'USD' };
}

async function getHighlightsForB3(
  tickers: string[],
  assetClass: AssetClass,
): Promise<HighlightItem[]> {
  const results = await Promise.allSettled(
    tickers.map(async (ticker) => {
      const cached = await fetchCachedMarketValue(
        ticker,
        DataSource.BRAPI,
        5 * 60 * 1000,
        async () => {
          const r = await fetchBrapiQuote(ticker);
          return {
            price: r.price,
            currency: r.currency,
            name: r.name,
            changePercent: r.changePercent,
            changeValue: null,
          };
        },
      );
      return { ticker, name: cached?.name ?? ticker, assetClass, cached, changePercent: cached?.changePercent ?? null };
    }),
  );

  return results
    .filter((r) => r.status === 'fulfilled' && r.value.cached !== null)
    .map((r) => {
      const v = (r as PromiseFulfilledResult<{ ticker: string; name: string; assetClass: AssetClass; cached: { price: Decimal; isStale: boolean } | null; changePercent: string | null }>).value;
      return {
        ticker: v.ticker,
        name: v.name,
        assetClass: v.assetClass,
        price: `R$ ${v.cached!.price.toFixed(2)}`,
        changePercent: v.changePercent ?? '0',
        stale: v.cached!.isStale,
      };
    });
}

async function getHighlightsForCrypto(coinIds: string[]): Promise<HighlightItem[]> {
  try {
    const liveData = await fetchCoinGeckoMulti(coinIds);
    const items: HighlightItem[] = [];

    for (const coinId of coinIds) {
      const ticker = CRYPTO_ID_TO_TICKER[coinId] ?? coinId.toUpperCase();

      const cached = await fetchCachedMarketValue(
        ticker,
        DataSource.COINGECKO,
        5 * 60 * 1000,
        async () => {
          const d = liveData[coinId];
          if (!d) throw new Error(`No CoinGecko data for ${coinId}`);
          return {
            price: d.price,
            currency: d.currency,
            name: CRYPTO_ID_TO_NAME[coinId] ?? ticker,
            changePercent: d.change,
            changeValue: null,
          };
        },
      );

      if (cached) {
        items.push({
          ticker,
          name: cached.name,
          assetClass: 'CRYPTO',
          price: `R$ ${cached.price.toFixed(2)}`,
          changePercent: cached.changePercent ?? '0',
          stale: cached.isStale,
        });
      }
    }

    return items;
  } catch (err) {
    console.warn(`[market] CoinGecko highlights error: ${String(err)}`);
    return [];
  }
}

async function getHighlightsForUS(tickers: string[]): Promise<HighlightItem[]> {
  const results = await Promise.allSettled(
    tickers.map(async (ticker) => {
      const cached = await fetchCachedMarketValue(
        ticker,
        DataSource.FINNHUB,
        5 * 60 * 1000,
        async () => {
          const r = await fetchFinnhubQuote(ticker);
          return {
            price: r.price,
            currency: r.currency,
            name: ticker,
            changePercent: r.changePercent,
            changeValue: null,
          };
        },
      );
      return { ticker, cached, changePercent: cached?.changePercent ?? null, name: cached?.name ?? ticker };
    }),
  );

  return results
    .filter((r) => r.status === 'fulfilled' && r.value.cached !== null)
    .map((r) => {
      const v = (r as PromiseFulfilledResult<{ ticker: string; cached: { price: Decimal; isStale: boolean } | null; changePercent: string | null; name: string }>).value;
      return {
        ticker: v.ticker,
        name: v.name,
        assetClass: 'STOCK_US' as AssetClass,
        price: `US$ ${v.cached!.price.toFixed(2)}`,
        changePercent: v.changePercent ?? '0',
        stale: v.cached!.isStale,
      };
    });
}

function splitGainersLosers(items: HighlightItem[], limit: number) {
  const withChange = items.filter((i) => i.changePercent !== null);
  const sorted = [...withChange].sort(
    (a, b) => parseFloat(b.changePercent) - parseFloat(a.changePercent),
  );
  const gainers = sorted.filter((i) => parseFloat(i.changePercent) >= 0).slice(0, limit);
  const losers = [...sorted].reverse().filter((i) => parseFloat(i.changePercent) < 0).slice(0, limit);
  return { gainers, losers };
}

export async function GET(request: NextRequest) {
  const typeParam = request.nextUrl.searchParams.get('type') ?? 'STOCK_BR';
  const limitParam = parseInt(request.nextUrl.searchParams.get('limit') ?? '6', 10);
  const limit = Math.min(limitParam, MAX_LIMIT);

  if (!VALID_TYPES.has(typeParam)) {
    return NextResponse.json(
      { message: `Tipo inválido: ${typeParam}. Use STOCK_BR, FII, ETF, BDR, CRYPTO ou STOCK_US` },
      { status: 400 },
    );
  }

  const assetClass = typeParam as AssetClass;
  const tickers = CURATED_LISTS[assetClass];
  const now = new Date().toISOString();

  let allItems: HighlightItem[];

  if (assetClass === 'CRYPTO') {
    allItems = await getHighlightsForCrypto(tickers);
  } else if (assetClass === 'STOCK_US') {
    allItems = await getHighlightsForUS(tickers);
  } else {
    allItems = await getHighlightsForB3(tickers, assetClass);
  }

  if (allItems.length === 0) {
    return NextResponse.json(
      { message: 'Nenhum dado disponível no momento. Tente novamente em instantes.' },
      { status: 503 },
    );
  }

  const { gainers, losers } = splitGainersLosers(allItems, limit);

  return NextResponse.json({ gainers, losers, type: assetClass, asOf: now });
}
