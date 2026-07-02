import { NextRequest, NextResponse } from 'next/server';
import type { AssetClass } from '@/types/api';
import { fetchAssetsForClass } from '@/lib/market/highlights-data';
import { getFundamentals } from '@/lib/fundamentals/fundamentals.service';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const VALID_TYPES = new Set<string>(['STOCK_BR', 'FII', 'ETF', 'BDR', 'CRYPTO', 'STOCK_US']);
const MAX_LIMIT = 50;

interface FullHighlightItem {
  ticker: string;
  name: string;
  assetClass: AssetClass;
  price: string;
  changePercent: string;
  stale: boolean;
  pl: string | null;
  dy: string | null;
  volume: string | null;
  mktCap: string | null;
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`market:highlights:full:${ip}`, { limit: 30, windowMs: 60 * 1000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: 'Muitas requisições. Tente novamente em instantes.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSec) },
      },
    );
  }

  const typeParam = request.nextUrl.searchParams.get('type') ?? 'STOCK_BR';
  const limitParam = parseInt(request.nextUrl.searchParams.get('limit') ?? '10', 10);
  const limit = Math.min(limitParam, MAX_LIMIT);

  if (!VALID_TYPES.has(typeParam)) {
    return NextResponse.json(
      { message: `Tipo inválido: ${typeParam}. Use STOCK_BR, FII, ETF, BDR, CRYPTO ou STOCK_US` },
      { status: 400 },
    );
  }

  const assetClass = typeParam as AssetClass;
  const now = new Date().toISOString();

  // 1. Fetch highlights (same logic as the base endpoint)
  const allItems = await fetchAssetsForClass(assetClass);

  if (allItems.length === 0) {
    return NextResponse.json(
      { message: 'Nenhum dado disponível no momento. Tente novamente em instantes.' },
      { status: 503 },
    );
  }

  // 2. Enrich each item with fundamentals (P/L, DY, Volume, Market Cap)
  //    getFundamentals is internally cached (AssetFundamentalsCache, 6h TTL)
  //    and never throws (returns null fields on failure)
  const enriched: FullHighlightItem[] = await Promise.all(
    allItems.map(async (item) => {
      try {
        const fundamentals = await getFundamentals(item.ticker, item.assetClass);
        return {
          ticker: item.ticker,
          name: item.name,
          assetClass: item.assetClass,
          price: item.price,
          changePercent: item.changePercent,
          stale: item.stale,
          pl: fundamentals.indicators.pe ?? null,
          dy: fundamentals.indicators.dy ?? null,
          volume: fundamentals.indicators.dailyLiquidity ?? null,
          mktCap: fundamentals.indicators.marketCap ?? null,
        };
      } catch {
        // Graceful fallback — null fields displayed as '—' on the client
        return {
          ticker: item.ticker,
          name: item.name,
          assetClass: item.assetClass,
          price: item.price,
          changePercent: item.changePercent,
          stale: item.stale,
          pl: null,
          dy: null,
          volume: null,
          mktCap: null,
        };
      }
    }),
  );

  // 3. Split into gainers / losers
  const withChange = enriched.filter((i) => i.changePercent !== null);
  const sorted = [...withChange].sort(
    (a, b) => parseFloat(b.changePercent) - parseFloat(a.changePercent),
  );
  const gainers = sorted.filter((i) => parseFloat(i.changePercent) >= 0).slice(0, limit);
  const losers = [...sorted].reverse().filter((i) => parseFloat(i.changePercent) < 0).slice(0, limit);

  return NextResponse.json({ gainers, losers, type: assetClass, asOf: now });
}
