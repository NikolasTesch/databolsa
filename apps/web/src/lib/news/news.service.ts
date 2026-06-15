import { createMemoryCache } from '@/lib/cache/memory-cache';
import { NEWS_FALLBACK } from './news-fallback';

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  imageUrl: string | null;
  publishedAt: string; // ISO 8601
}

/** Finnhub raw article shape */
interface FinnhubArticle {
  id: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image: string;
  datetime: number; // epoch seconds
}

const NEWS_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Singleton in-memory cache — persists across requests within the same process
const newsCache = createMemoryCache<NewsArticle[]>(NEWS_TTL_MS);

function getToken(): string {
  return process.env.FINNHUB_TOKEN ?? process.env.FINNHUB_KEY ?? '';
}

function normalizeArticle(item: FinnhubArticle): NewsArticle {
  return {
    id: String(item.id),
    title: item.headline ?? '',
    summary: item.summary ?? '',
    source: item.source ?? '',
    url: item.url ?? '',
    imageUrl: item.image && item.image.length > 0 ? item.image : null,
    // Finnhub datetime is epoch seconds — multiply by 1000 for ms
    publishedAt: new Date(item.datetime * 1000).toISOString(),
  };
}

/**
 * Fetch general market news from Finnhub.
 * On any error, falls back to the static curated list.
 */
export async function fetchGeneralNews(): Promise<{ articles: NewsArticle[]; cached: boolean }> {
  const cacheKey = 'news:general';

  const hit = newsCache.get(cacheKey);
  if (hit) {
    console.log(`[news.service] cache hit for key=${cacheKey}`);
    return { articles: hit, cached: true };
  }

  console.log(`[news.service] cache miss for key=${cacheKey}`);

  try {
    const token = getToken();
    const url = `https://finnhub.io/api/v1/news?category=general&token=${token}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });

    if (!res.ok) {
      throw new Error(`Finnhub returned ${res.status}`);
    }

    const raw: FinnhubArticle[] = await res.json();
    const articles = (Array.isArray(raw) ? raw : []).map(normalizeArticle);

    if (articles.length > 0) {
      newsCache.set(cacheKey, articles);
    }

    return { articles, cached: false };
  } catch (err) {
    console.error(`[news.service] error fetching from Finnhub: ${String(err)}. Servindo fallback.`);
    return { articles: NEWS_FALLBACK, cached: false };
  }
}

/**
 * Fetch company-specific news from Finnhub for a given ticker.
 * Uses a 7-day window. On error, falls back to the static list.
 */
export async function fetchTickerNews(ticker: string): Promise<{ articles: NewsArticle[]; cached: boolean }> {
  const upperTicker = ticker.toUpperCase();
  const cacheKey = `news:${upperTicker}`;

  const hit = newsCache.get(cacheKey);
  if (hit) {
    console.log(`[news.service] cache hit for key=${cacheKey}`);
    return { articles: hit, cached: true };
  }

  console.log(`[news.service] cache miss for key=${cacheKey}`);

  try {
    const token = getToken();
    const now = new Date();
    const fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    const url = `https://finnhub.io/api/v1/company-news?symbol=${upperTicker}&from=${fmt(fromDate)}&to=${fmt(now)}&token=${token}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });

    if (!res.ok) {
      throw new Error(`Finnhub returned ${res.status}`);
    }

    const raw: FinnhubArticle[] = await res.json();
    const articles = (Array.isArray(raw) ? raw : []).map(normalizeArticle);

    // If Finnhub returns empty for ticker, fallback to general news
    const finalArticles = articles.length > 0 ? articles : NEWS_FALLBACK;

    if (articles.length > 0) {
      newsCache.set(cacheKey, articles);
    }

    return { articles: finalArticles, cached: false };
  } catch (err) {
    console.error(`[news.service] error fetching from Finnhub: ${String(err)}. Servindo fallback.`);
    return { articles: NEWS_FALLBACK, cached: false };
  }
}

/** Expose cache for testing — do not use in production code */
export { newsCache as _newsCache };
