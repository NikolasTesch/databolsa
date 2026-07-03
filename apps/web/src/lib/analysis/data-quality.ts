import type { AssetClass } from '@/types/api';
import type { NormalizedFundamentals } from '@/lib/fundamentals/fundamentals-adapter.interface';
import { Decimal } from 'decimal.js';

export type DataQualityLevel = 'complete' | 'partial' | 'insufficient';

export interface DataQualityReport {
  coverageScore: string;
  level: DataQualityLevel;
  missingFields: string[];
  staleFields: string[];
  sourceWarnings: string[];
  lastUpdatedAt: string;
}

type IndicatorKey = keyof NormalizedFundamentals;

/**
 * Indicadores esperados por classe de ativo.
 * Mesma lista do IndicatorCategoryGrid.
 */
const EXPECTED_INDICATORS: Record<AssetClass, IndicatorKey[]> = {
  STOCK_BR: ['pe', 'pb', 'evEbitda', 'roe', 'netMargin', 'dy', 'lastDividend', 'debtToEquity', 'dailyLiquidity'],
  STOCK_US: ['pe', 'pb', 'roe', 'eps', 'dy', 'marketCap'],
  BDR: ['pe', 'dy', 'marketCap', 'change52w'],
  FII: ['pb', 'dy', 'lastDividend', 'vacancyRate', 'dailyLiquidity'],
  ETF: ['adminFee', 'netWorth', 'dailyLiquidity'],
  CRYPTO: ['marketCap', 'volume24h', 'change7d', 'change30d', 'circulatingSupply', 'maxSupply'],
};

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 horas

function isFieldPopulated(value: string | null): boolean {
  if (value === null || value === '' || value === 'NaN') return false;
  try {
    const d = new Decimal(value);
    return d.isFinite();
  } catch {
    return false;
  }
}

function computeLevel(coverage: Decimal): DataQualityLevel {
  if (coverage.greaterThanOrEqualTo(80)) return 'complete';
  if (coverage.greaterThanOrEqualTo(40)) return 'partial';
  return 'insufficient';
}

function extractMissingFields(
  fundamentals: NormalizedFundamentals,
  expected: IndicatorKey[],
): string[] {
  return expected.filter((key) => !isFieldPopulated(fundamentals[key]));
}

function extractStaleFields(
  fundamentals: NormalizedFundamentals,
  expected: IndicatorKey[],
  asOf: string,
): string[] {
  const asOfDate = new Date(asOf);
  const ageMs = Date.now() - asOfDate.getTime();

  // Se a última atualização dos fundamentalistas foi há mais de 24h,
  // todos os campos preenchidos são considerados stale
  if (ageMs <= STALE_THRESHOLD_MS) return [];

  return expected.filter((key) => isFieldPopulated(fundamentals[key]));
}

export function calculateDataQualityScore(
  fundamentals: NormalizedFundamentals,
  assetClass: AssetClass,
  fundamentalsAsOf: string,
): DataQualityReport {
  const expected = EXPECTED_INDICATORS[assetClass] ?? EXPECTED_INDICATORS.STOCK_BR;
  const filled = expected.filter((key) => isFieldPopulated(fundamentals[key]));

  const expectedCount = new Decimal(expected.length);
  const filledCount = new Decimal(filled.length);

  const coverageScore = expectedCount.isZero()
    ? new Decimal(0)
    : filledCount.div(expectedCount).times(100);

  const level = computeLevel(coverageScore);
  const missingFields = extractMissingFields(fundamentals, expected);
  const staleFields = extractStaleFields(fundamentals, expected, fundamentalsAsOf);

  const sourceWarnings: string[] = [];
  if (staleFields.length > 0) {
    sourceWarnings.push('Dados com mais de 24h. Considere atualizar a fonte.');
  }

  return {
    coverageScore: coverageScore.toDecimalPlaces(0).toString(),
    level,
    missingFields,
    staleFields,
    sourceWarnings,
    lastUpdatedAt: fundamentalsAsOf,
  };
}
