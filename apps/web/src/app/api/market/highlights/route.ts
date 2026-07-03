import { NextRequest, NextResponse } from 'next/server';
import type { AssetClass } from '@/types/api';
import { CURATED_LISTS } from '@/lib/market/curated-lists';
import { fetchAssetsForB3, fetchAssetsForCrypto, fetchAssetsForUS } from '@/lib/market/highlights-data';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const VALID_TYPES = new Set<string>(['STOCK_BR', 'FII', 'ETF', 'BDR', 'CRYPTO', 'STOCK_US']);
const MAX_LIMIT = 50;

interface HighlightItem {
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
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`market:highlights:${ip}`, { limit: 30, windowMs: 60 * 1000 });
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
  const limitParam = parseInt(request.nextUrl.searchParams.get('limit') ?? '6', 10);
  if (Number.isNaN(limitParam) || limitParam < 1) {
    return NextResponse.json({ message: 'limit inválido' }, { status: 400 });
  }
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
    allItems = await fetchAssetsForCrypto(tickers);
  } else if (assetClass === 'STOCK_US') {
    allItems = await fetchAssetsForUS(tickers);
  } else {
    allItems = await fetchAssetsForB3(tickers, assetClass);
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
