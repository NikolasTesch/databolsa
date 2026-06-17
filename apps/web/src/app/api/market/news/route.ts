import { NextRequest, NextResponse } from 'next/server';
import { fetchGeneralNews, fetchTickerNews } from '@/lib/news/news.service';
import { isValidTicker } from '@/lib/market/ticker-validation';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 30;

/**
 * GET /api/market/news
 *
 * Query params:
 *  - q (optional): ticker or search term. If provided, fetches company news.
 *  - limit (optional, default 10, max 30): maximum number of articles returned.
 *
 * Returns:
 *  { news: NewsArticle[], q?: string, cached: boolean }
 *
 * Always returns 200. On Finnhub failure, serves the static fallback (RN-10).
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`market:news:${ip}`, { limit: 30, windowMs: 60 * 1000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: 'Muitas requisições. Tente novamente em instantes.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSec) },
      },
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q') ?? undefined;
  const limitRaw = searchParams.get('limit');

  if (limitRaw !== null) {
    const parsed = parseInt(limitRaw, 10);
    if (Number.isNaN(parsed) || parsed <= 0 || parsed > MAX_LIMIT) {
      return NextResponse.json(
        { message: `Parâmetro 'limit' inválido. Use um número entre 1 e ${MAX_LIMIT}.` },
        { status: 400 },
      );
    }
  }

  if (q && q.trim().length > 0 && !isValidTicker(q.trim())) {
    return NextResponse.json(
      { message: `Parâmetro 'q' inválido. Use um ticker válido (ex: PETR4, AAPL, BTC).` },
      { status: 400 },
    );
  }

  const limit = limitRaw !== null ? Math.min(parseInt(limitRaw, 10), MAX_LIMIT) : DEFAULT_LIMIT;

  const { articles, cached } =
    q && q.trim().length > 0
      ? await fetchTickerNews(q.trim())
      : await fetchGeneralNews();

  return NextResponse.json({
    news: articles.slice(0, limit),
    ...(q ? { q } : {}),
    cached,
  });
}
