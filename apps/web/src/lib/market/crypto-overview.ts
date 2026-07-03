import { Decimal } from 'decimal.js';
import { DataSource } from '@prisma/client';
import { fetchCachedMarketValue } from './market-cache';
import { fetchCoinGeckoMulti } from './market-fetchers';
import { CURATED_LISTS, CRYPTO_ID_TO_TICKER, CRYPTO_ID_TO_NAME } from './curated-lists';

export interface CryptoOverviewItem {
  symbol: string;
  name: string;
  price: string;
  changePercent: string;
  volume24h: string;
  stale: boolean;
}

export interface CryptoOverviewResult {
  assets: CryptoOverviewItem[];
  trending: CryptoOverviewItem[];
}

function formatChangePercent(value: string | null): string {
  if (value === null || value === '0') return '0.00%';
  const num = parseFloat(value);
  if (num > 0) return `+${num.toFixed(2)}%`;
  if (num < 0) return `${num.toFixed(2)}%`;
  return '0.00%';
}

export async function getCryptoOverview(): Promise<CryptoOverviewResult> {
  const coinIds = CURATED_LISTS.CRYPTO;

  try {
    const liveData = await fetchCoinGeckoMulti(coinIds);
    const items: CryptoOverviewItem[] = [];

    for (const coinId of coinIds) {
      const ticker = CRYPTO_ID_TO_TICKER[coinId] ?? coinId.toUpperCase();
      const d = liveData[coinId];

      const cached = await fetchCachedMarketValue(
        ticker,
        DataSource.COINGECKO,
        5 * 60 * 1000,
        async () => {
          if (!d) throw new Error(`No CoinGecko data for ${coinId}`);
          return {
            price: d.price,
            currency: d.currency,
            name: CRYPTO_ID_TO_NAME[coinId] ?? ticker,
            changePercent: d.changePercent,
            changeValue: null,
          };
        },
      );

      if (cached) {
        items.push({
          symbol: ticker,
          name: cached.name ?? ticker,
          price: `R$ ${cached.price.toFixed(2)}`,
          changePercent: formatChangePercent(cached.changePercent),
          volume24h: d?.volume24h
            ? `R$ ${(d.volume24h.toNumber() / 1_000_000_000).toFixed(1).replace('.', ',')}B`
            : '—',
          stale: cached.isStale,
        });
      }
    }

    const trending = [...items]
      .sort(
        (a, b) =>
          Math.abs(parseFloat(b.changePercent)) -
          Math.abs(parseFloat(a.changePercent)),
      )
      .slice(0, 3);

    return { assets: items, trending };
  } catch (err) {
    console.warn(`[crypto-overview] fetch failed: ${err instanceof Error ? err.message : String(err)}`);
    return { assets: [], trending: [] };
  }
}
