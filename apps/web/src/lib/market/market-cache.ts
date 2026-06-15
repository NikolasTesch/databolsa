import { Decimal } from 'decimal.js';
import { DataSource } from '@prisma/client';
import prisma from '@/lib/prisma';

const MARKET_TTL_MS = 5 * 60 * 1000;

export interface MarketCacheResult {
  price: Decimal;
  currency: string;
  name: string;
  changePercent: string | null;
  changeValue: string | null;
  isStale: boolean;
}

export async function fetchCachedMarketValue(
  symbol: string,
  source: DataSource,
  ttlMs: number = MARKET_TTL_MS,
  fetcher: () => Promise<{
    price: Decimal;
    currency: string;
    name: string;
    changePercent: string | null;
    changeValue: string | null;
  }>,
): Promise<MarketCacheResult | null> {
  const cached = await prisma.quoteCache.findUnique({
    where: { symbol_source: { symbol, source } },
  });

  const isExpired = (fetchedAt: Date) => Date.now() - fetchedAt.getTime() > ttlMs;

  if (cached && !isExpired(cached.fetched_at)) {
    console.log(`[market] cache hit symbol=${symbol} source=${source}`);
    return {
      price: new Decimal(cached.price.toString()),
      currency: cached.currency,
      name: cached.name ?? symbol,
      changePercent: cached.changePercent ? cached.changePercent.toString() : null,
      changeValue: cached.changeValue ? cached.changeValue.toString() : null,
      isStale: false,
    };
  }

  try {
    const result = await fetcher();
    await prisma.quoteCache.upsert({
      where: { symbol_source: { symbol, source } },
      update: {
        price: result.price.toString(),
        currency: result.currency,
        name: result.name,
        changePercent: result.changePercent ? new Decimal(result.changePercent) : null,
        changeValue: result.changeValue ? new Decimal(result.changeValue) : null,
        fetched_at: new Date(),
      },
      create: {
        symbol,
        source,
        price: result.price.toString(),
        currency: result.currency,
        name: result.name,
        changePercent: result.changePercent ? new Decimal(result.changePercent) : null,
        changeValue: result.changeValue ? new Decimal(result.changeValue) : null,
      },
    });
    console.log(`[market] cache miss (refreshed) symbol=${symbol} source=${source}`);
    return {
      price: result.price,
      currency: result.currency,
      name: result.name,
      changePercent: result.changePercent,
      changeValue: result.changeValue,
      isStale: false,
    };
  } catch (err) {
    console.warn(`[market] adapter error symbol=${symbol} source=${source}: ${String(err)}`);
    if (cached) {
      console.log(`[market] cache stale symbol=${symbol} source=${source}`);
      return {
        price: new Decimal(cached.price.toString()),
        currency: cached.currency,
        name: cached.name ?? symbol,
        changePercent: cached.changePercent ? cached.changePercent.toString() : null,
        changeValue: cached.changeValue ? cached.changeValue.toString() : null,
        isStale: true,
      };
    }
    return null;
  }
}
