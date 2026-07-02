import { NextRequest, NextResponse } from 'next/server';
import { Decimal } from 'decimal.js';
import type { AssetClass } from '@/types/api';
import { getAssetAnalysis } from '@/lib/analysis/asset-analysis.service';
import type { AssetAnalysis } from '@/lib/analysis/asset-analysis.types';
import { jsonError } from '@/lib/http/errors';
import { CURATED_LISTS, CRYPTO_ID_TO_TICKER } from '@/lib/market/curated-lists';

type ScreenerPreset = 'dividends' | 'graham' | 'quality' | 'low-debt' | 'liquidity';
type ScreenerSort = 'score' | 'dy' | 'roe' | 'liquidity' | 'change';

const ASSET_CLASSES: AssetClass[] = ['STOCK_BR', 'FII', 'ETF', 'BDR', 'STOCK_US', 'CRYPTO'];
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 30;

function decimal(value: string | null): Decimal | null {
  if (value === null) return null;
  try {
    const result = new Decimal(value);
    return result.isFinite() ? result : null;
  } catch {
    return null;
  }
}

function numberParam(params: URLSearchParams, key: string): Decimal | null {
  const value = params.get(key);
  if (!value) return null;
  return decimal(value);
}

function parseLimit(params: URLSearchParams): number | null {
  const raw = params.get('limit');
  if (!raw) return DEFAULT_LIMIT;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_LIMIT) return null;
  return parsed;
}

function parseAssetClass(params: URLSearchParams): AssetClass {
  const raw = params.get('class')?.toUpperCase();
  if (raw && ASSET_CLASSES.includes(raw as AssetClass)) return raw as AssetClass;
  return 'STOCK_BR';
}

function candidateTickers(assetClass: AssetClass, limit: number): string[] {
  const list = CURATED_LISTS[assetClass] ?? CURATED_LISTS.STOCK_BR;
  return list.slice(0, limit).map((ticker) => {
    if (assetClass === 'CRYPTO') return CRYPTO_ID_TO_TICKER[ticker] ?? ticker.toUpperCase();
    return ticker.toUpperCase();
  });
}

function passesDecimalMin(value: string | null, min: Decimal | null): boolean {
  if (!min) return true;
  const parsed = decimal(value);
  return parsed !== null && parsed.greaterThanOrEqualTo(min);
}

function passesDecimalMax(value: string | null, max: Decimal | null): boolean {
  if (!max) return true;
  const parsed = decimal(value);
  return parsed !== null && parsed.lessThanOrEqualTo(max);
}

function applyPreset(items: AssetAnalysis[], preset: ScreenerPreset | null): AssetAnalysis[] {
  if (!preset) return items;

  return items.filter((item) => {
    const f = item.fundamentals;
    if (preset === 'dividends') return passesDecimalMin(f.dy, new Decimal(item.assetClass === 'FII' ? 6 : 3));
    if (preset === 'graham') return passesDecimalMax(f.pe, new Decimal(12)) && passesDecimalMax(f.pb, new Decimal('1.5'));
    if (preset === 'quality') return passesDecimalMin(f.roe, new Decimal(12));
    if (preset === 'low-debt') return passesDecimalMax(f.debtToEquity, new Decimal(1));
    if (preset === 'liquidity') return passesDecimalMin(f.dailyLiquidity, new Decimal(1000000));
    return true;
  });
}

function applyFilters(items: AssetAnalysis[], params: URLSearchParams): AssetAnalysis[] {
  const sector = params.get('sector');
  const minDy = numberParam(params, 'minDy');
  const maxPe = numberParam(params, 'maxPe');
  const maxPb = numberParam(params, 'maxPb');
  const minRoe = numberParam(params, 'minRoe');
  const minLiquidity = numberParam(params, 'minLiquidity');
  const preset = params.get('preset') as ScreenerPreset | null;

  return applyPreset(items, preset).filter((item) => {
    const f = item.fundamentals;
    return (
      (!sector || item.sector === sector) &&
      passesDecimalMin(f.dy, minDy) &&
      passesDecimalMax(f.pe, maxPe) &&
      passesDecimalMax(f.pb, maxPb) &&
      passesDecimalMin(f.roe, minRoe) &&
      passesDecimalMin(f.dailyLiquidity, minLiquidity)
    );
  });
}

function sortItems(items: AssetAnalysis[], sort: ScreenerSort): AssetAnalysis[] {
  const valueFor = (item: AssetAnalysis): Decimal => {
    if (sort === 'dy') return decimal(item.fundamentals.dy) ?? new Decimal(-1);
    if (sort === 'roe') return decimal(item.fundamentals.roe) ?? new Decimal(-1);
    if (sort === 'liquidity') return decimal(item.fundamentals.dailyLiquidity) ?? new Decimal(-1);
    return decimal(item.totalScore) ?? new Decimal(-1);
  };

  return [...items].sort((a, b) => valueFor(b).comparedTo(valueFor(a)));
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const limit = parseLimit(params);

  if (limit === null) {
    return jsonError('INVALID_INPUT', 'Limite invalido para o screener.', 400);
  }

  const assetClass = parseAssetClass(params);
  const sort = (params.get('sort') as ScreenerSort | null) ?? 'score';
  const tickers = candidateTickers(assetClass, limit);

  const settled = await Promise.allSettled(
    tickers.map((ticker) => getAssetAnalysis(ticker, assetClass)),
  );

  const items = settled.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : [],
  );
  const failedTickers = settled.flatMap((result, index) =>
    result.status === 'rejected' ? [tickers[index]] : [],
  );

  const filtered = sortItems(applyFilters(items, params), sort).slice(0, limit);

  return NextResponse.json({
    items: filtered,
    total: filtered.length,
    partial: failedTickers.length > 0,
    failedTickers,
    asOf: new Date().toISOString(),
  });
}
