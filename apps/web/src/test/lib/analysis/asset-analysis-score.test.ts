import { describe, expect, it } from 'vitest';
import { calculateAssetAnalysisScore } from '@/lib/analysis/asset-analysis-score';
import { EMPTY_FUNDAMENTALS } from '@/lib/fundamentals/fundamentals-adapter.interface';

describe('calculateAssetAnalysisScore', () => {
  it('scores a profitable dividend stock with positive signals', () => {
    const result = calculateAssetAnalysisScore('STOCK_BR', {
      ...EMPTY_FUNDAMENTALS,
      pe: '8',
      pb: '1.1',
      dy: '7',
      roe: '18',
      netMargin: '15',
      debtToEquity: '0.6',
    });

    expect(Number(result.totalScore)).toBeGreaterThanOrEqual(70);
    expect(result.scoreLevel).toBe('positive');
    expect(result.alerts).toEqual([]);
    expect(result.breakdown.every((item) => item.score !== 'NaN')).toBe(true);
  });

  it('does not create NaN when all indicators are missing', () => {
    const result = calculateAssetAnalysisScore('STOCK_BR', EMPTY_FUNDAMENTALS);

    expect(result.totalScore).toBe('0');
    expect(result.scoreLevel).toBe('unknown');
    expect(result.breakdown.every((item) => item.score !== 'NaN')).toBe(true);
    expect(result.alerts.some((alert) => alert.id === 'missing-fundamentals')).toBe(true);
  });

  it('uses crypto-specific indicators instead of stock valuation', () => {
    const result = calculateAssetAnalysisScore('CRYPTO', {
      ...EMPTY_FUNDAMENTALS,
      marketCap: '1000000000000',
      volume24h: '50000000000',
      change7d: '4',
      change30d: '12',
    });

    expect(result.breakdown.map((item) => item.category)).toContain('momentum');
    expect(result.breakdown.map((item) => item.category)).not.toContain('dividends');
    expect(result.breakdown.map((item) => item.category)).not.toContain('valuation');
  });
});
