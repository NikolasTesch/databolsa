import { Decimal } from 'decimal.js';
import { DataSource } from '@prisma/client';
import type { AssetClass } from '@/types/api';
import { fetchCachedMarketValue } from './market-cache';
import { CURATED_LISTS, CRYPTO_ID_TO_TICKER, CRYPTO_ID_TO_NAME } from './curated-lists';
import { fetchBrapiQuote, fetchCoinGeckoMulti, fetchFinnhubQuote } from './market-fetchers';

export interface HighlightItem {
  ticker: string;
  name: string;
  assetClass: AssetClass;
  price: string;
  changePercent: string;
  stale: boolean;
}

function formatChangePercent(value: string | null): string {
  if (value === null || value === '0') return '0.00%';
  const num = parseFloat(value);
  if (num > 0) return `+${num.toFixed(2)}%`;
  if (num < 0) return `${num.toFixed(2)}%`;
  return '0.00%';
}

export async function fetchAssetsForB3(
  tickers: string[], assetClass: AssetClass,
): Promise<HighlightItem[]> {
  const results = await Promise.allSettled(
    tickers.map(async (ticker) => {
      const cached = await fetchCachedMarketValue(ticker, DataSource.BRAPI, 5 * 60 * 1000, async () => {
        const r = await fetchBrapiQuote(ticker);
        return { price: r.price, currency: r.currency, name: r.name, changePercent: r.changePercent, changeValue: null };
      });
      return { ticker, name: cached?.name ?? ticker, assetClass, cached, changePercent: cached?.changePercent ?? null };
    }),
  );
  return results
    .filter((r) => r.status === 'fulfilled' && r.value.cached !== null)
    .map((r) => {
      const v = (r as PromiseFulfilledResult<any>).value;
      return { ticker: v.ticker, name: v.name, assetClass: v.assetClass, price: `R$ ${v.cached.price.toFixed(2)}`, changePercent: formatChangePercent(v.changePercent), stale: v.cached.isStale };
    });
}

export async function fetchAssetsForCrypto(coinIds: string[]): Promise<HighlightItem[]> {
  try {
    const liveData = await fetchCoinGeckoMulti(coinIds);
    const items: HighlightItem[] = [];
    for (const coinId of coinIds) {
      const ticker = CRYPTO_ID_TO_TICKER[coinId] ?? coinId.toUpperCase();
      const cached = await fetchCachedMarketValue(ticker, DataSource.COINGECKO, 5 * 60 * 1000, async () => {
        const d = liveData[coinId];
        if (!d) throw new Error(`No CoinGecko data for ${coinId}`);
        return { price: d.price, currency: d.currency, name: CRYPTO_ID_TO_NAME[coinId] ?? ticker, changePercent: d.changePercent, changeValue: null };
      });
      if (cached) items.push({ ticker, name: cached.name, assetClass: 'CRYPTO', price: `R$ ${cached.price.toFixed(2)}`, changePercent: formatChangePercent(cached.changePercent), stale: cached.isStale });
    }
    return items;
  } catch { return []; }
}

export async function fetchAssetsForUS(tickers: string[]): Promise<HighlightItem[]> {
  const results = await Promise.allSettled(
    tickers.map(async (ticker) => {
      const cached = await fetchCachedMarketValue(ticker, DataSource.FINNHUB, 5 * 60 * 1000, async () => {
        const r = await fetchFinnhubQuote(ticker);
        return { price: r.price, currency: r.currency, name: r.name, changePercent: r.changePercent, changeValue: r.changeValue };
      });
      return { ticker, cached, changePercent: cached?.changePercent ?? null, name: cached?.name ?? ticker };
    }),
  );
  return results
    .filter((r) => r.status === 'fulfilled' && r.value.cached !== null)
    .map((r) => {
      const v = (r as PromiseFulfilledResult<any>).value;
      return { ticker: v.ticker, name: v.name, assetClass: 'STOCK_US' as AssetClass, price: `R$ ${v.cached.price.toFixed(2)}`, changePercent: formatChangePercent(v.changePercent), stale: v.cached.isStale };
    });
}

export async function fetchAssetsForClass(assetClass: AssetClass): Promise<HighlightItem[]> {
  const tickers = CURATED_LISTS[assetClass];
  if (assetClass === 'CRYPTO') return fetchAssetsForCrypto(tickers);
  if (assetClass === 'STOCK_US') return fetchAssetsForUS(tickers);
  return fetchAssetsForB3(tickers, assetClass);
}
