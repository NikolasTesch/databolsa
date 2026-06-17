import { Decimal } from 'decimal.js';
import prisma from '@/lib/prisma';

export type BenchmarkId = 'IBOVESPA' | 'CDI' | 'IPCA' | 'SP500';
export type PeriodId = '1M' | '3M' | '6M' | '1Y' | 'ALL';

export interface BenchmarkPoint {
  date: string;
  value: string; // base-100 normalized
}

export interface BenchmarkSeries {
  benchmark: BenchmarkId;
  period: PeriodId;
  return_pct: string;
  series: BenchmarkPoint[];
  is_stale: boolean;
}

// TTL: índices de preço (IBOV/SPY) 15min; macro (CDI/IPCA) 6h
const TTL_PRICE_MS = 15 * 60 * 1000;
const TTL_MACRO_MS = 6 * 60 * 60 * 1000;

function getTtl(benchmark: BenchmarkId): number {
  return benchmark === 'CDI' || benchmark === 'IPCA' ? TTL_MACRO_MS : TTL_PRICE_MS;
}

function seriesKey(benchmark: BenchmarkId): string {
  return `benchmark:${benchmark}`;
}

export async function getCachedSeries(
  benchmark: BenchmarkId,
  period: PeriodId,
): Promise<{ series: BenchmarkPoint[]; return_pct: string; is_stale: boolean } | null> {
  const key = seriesKey(benchmark);
  const cached = await prisma.benchmarkSeriesCache.findUnique({
    where: { series_key_period: { series_key: key, period } },
  });
  if (!cached) return null;

  const ttl = getTtl(benchmark);
  const isExpired = Date.now() - cached.fetched_at.getTime() > ttl;
  const data = cached.data as unknown as { series: BenchmarkPoint[]; return_pct: string };

  return { ...data, is_stale: isExpired };
}

export async function setCachedSeries(
  benchmark: BenchmarkId,
  period: PeriodId,
  series: BenchmarkPoint[],
  return_pct: string,
): Promise<void> {
  const key = seriesKey(benchmark);
  const payload = { series, return_pct } as unknown as import('@prisma/client').Prisma.InputJsonValue;
  await prisma.benchmarkSeriesCache.upsert({
    where: { series_key_period: { series_key: key, period } },
    update: { data: payload, fetched_at: new Date() },
    create: { series_key: key, period, data: payload },
  });
}

export function periodStartDate(period: PeriodId, firstTxDate?: Date): Date {
  const now = new Date();
  switch (period) {
    case '1M': return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case '3M': return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case '6M': return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    case '1Y': return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    case 'ALL': return firstTxDate ?? new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
  }
}

/** Normaliza uma série de {date, price} para base 100 no primeiro ponto */
export function normalizeBase100(points: { date: string; price: Decimal }[]): BenchmarkPoint[] {
  if (points.length === 0) return [];
  const base = points[0].price;
  if (base.isZero()) return points.map((p) => ({ date: p.date, value: '100' }));
  return points.map((p) => ({
    date: p.date,
    value: p.price.div(base).mul(100).toFixed(4),
  }));
}

/** Retorno % do primeiro ao último ponto de uma série base-100 */
export function seriesReturnPct(series: BenchmarkPoint[]): string {
  if (series.length < 2) return '0';
  const first = new Decimal(series[0].value);
  const last = new Decimal(series[series.length - 1].value);
  if (first.isZero()) return '0';
  return last.sub(first).div(first).mul(100).toFixed(4);
}
