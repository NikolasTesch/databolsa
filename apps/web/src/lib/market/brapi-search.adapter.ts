import type { AssetClass } from '@/types/api';
import { inferAssetClass } from './curated-lists';

interface BrapiAvailableItem {
  stock: string;
  name: string;
  close?: number;
  change?: number;
  volume?: number;
  market_cap?: number;
  logo?: string;
  sector?: string;
}

interface SearchResult {
  ticker: string;
  name: string;
  assetClass: AssetClass;
}

const CACHE_TTL_MS = 60 * 60 * 1000;

let cachedList: BrapiAvailableItem[] | null = null;
let cacheTimestamp = 0;

async function fetchAvailableList(): Promise<BrapiAvailableItem[]> {
  const now = Date.now();
  if (cachedList && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedList;
  }

  const token = process.env.BRAPI_TOKEN;
  const url = `https://brapi.dev/api/available?token=${token ?? ''}`;

  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) {
    throw new Error(`brapi /available returned ${response.status}`);
  }

  const data = await response.json();
  const stocks: string[] = data?.stocks ?? [];
  const mapped: BrapiAvailableItem[] = stocks.map((s: string) => ({ stock: s, name: s }));

  cachedList = mapped;
  cacheTimestamp = now;
  console.log(`[market] brapi /available cached ${mapped.length} tickers`);
  return mapped;
}

export async function searchB3Tickers(query: string, limit = 10): Promise<SearchResult[]> {
  const q = query.toUpperCase().trim();
  if (!q) return [];

  try {
    const list = await fetchAvailableList();
    return list
      .filter((item) => item.stock.startsWith(q))
      .slice(0, limit)
      .map((item) => ({
        ticker: item.stock,
        name: item.name !== item.stock ? item.name : item.stock,
        assetClass: inferAssetClass(item.stock),
      }));
  } catch (err) {
    console.warn(`[market] brapi search error: ${String(err)}`);
    return [];
  }
}
