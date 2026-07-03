import { describe, expect, it, vi, beforeEach } from 'vitest';
import { calculateDataQualityScore } from '@/lib/analysis/data-quality';
import { EMPTY_FUNDAMENTALS } from '@/lib/fundamentals/fundamentals-adapter.interface';

describe('calculateDataQualityScore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const recentAsOf = '2026-07-03T12:00:00.000Z';

  it('returns complete coverage when all expected fields are filled', () => {
    // STOCK_BR expects: pe, pb, evEbitda, roe, netMargin, dy, lastDividend, debtToEquity, dailyLiquidity (9 fields)
    vi.setSystemTime(new Date('2026-07-03T13:00:00.000Z'));

    const result = calculateDataQualityScore(
      {
        ...EMPTY_FUNDAMENTALS,
        pe: '8',
        pb: '1.2',
        evEbitda: '5.5',
        roe: '18',
        netMargin: '12',
        dy: '6',
        lastDividend: '1.50',
        debtToEquity: '0.6',
        dailyLiquidity: '5000000',
      },
      'STOCK_BR',
      recentAsOf,
    );

    expect(result.coverageScore).toBe('100');
    expect(result.level).toBe('complete');
    expect(result.missingFields).toHaveLength(0);
    expect(result.staleFields).toHaveLength(0);
  });

  it('returns partial coverage when some fields are missing', () => {
    vi.setSystemTime(new Date('2026-07-03T13:00:00.000Z'));

    const result = calculateDataQualityScore(
      {
        ...EMPTY_FUNDAMENTALS,
        pe: '8',
        pb: '1.2',
        // 7 of 9 STOCK_BR fields missing
        roe: null,
        netMargin: null,
        evEbitda: null,
        dy: null,
        lastDividend: null,
        debtToEquity: null,
        dailyLiquidity: null,
      },
      'STOCK_BR',
      recentAsOf,
    );

    // 2/9 = 22% → insufficient
    expect(result.coverageScore).toBe('22');
    expect(result.level).toBe('insufficient');
    expect(result.missingFields).toHaveLength(7);
  });

  it('returns insufficient for very low coverage', () => {
    vi.setSystemTime(new Date('2026-07-03T13:00:00.000Z'));

    const result = calculateDataQualityScore(
      { ...EMPTY_FUNDAMENTALS },
      'STOCK_BR',
      recentAsOf,
    );

    expect(result.coverageScore).toBe('0');
    expect(result.level).toBe('insufficient');
    expect(result.missingFields.length).toBeGreaterThan(0);
  });

  it('marks fields as stale when fundamentals are >24h old', () => {
    const oldAsOf = '2026-07-01T10:00:00.000Z'; // ~51h old from test time
    vi.setSystemTime(new Date('2026-07-03T13:00:00.000Z'));

    const result = calculateDataQualityScore(
      {
        ...EMPTY_FUNDAMENTALS,
        pe: '8',
        pb: '1.2',
        evEbitda: '5.5',
        roe: '18',
        netMargin: '12',
        dy: '6',
        lastDividend: '1.50',
        debtToEquity: '0.6',
        dailyLiquidity: '5000000',
      },
      'STOCK_BR',
      oldAsOf,
    );

    expect(result.staleFields.length).toBeGreaterThan(0);
    // All 9 filled fields should be stale
    expect(result.staleFields).toContain('pe');
    expect(result.staleFields).toContain('pb');
    expect(result.level).toBe('complete');
    expect(result.sourceWarnings).toContain('Dados com mais de 24h. Considere atualizar a fonte.');
  });

  it('detects partial coverage when half the fields are filled', () => {
    vi.setSystemTime(new Date('2026-07-03T13:00:00.000Z'));

    // CRYPTO expects 6 fields: marketCap, volume24h, change7d, change30d, circulatingSupply, maxSupply
    // Fill 3 of 6 = 50% → partial
    const result = calculateDataQualityScore(
      {
        ...EMPTY_FUNDAMENTALS,
        marketCap: '500000000',
        volume24h: '10000000',
        change7d: '5',
        // change30d, circulatingSupply, maxSupply are null
      },
      'CRYPTO',
      recentAsOf,
    );

    expect(result.coverageScore).toBe('50');
    expect(result.level).toBe('partial');
    expect(result.missingFields).toHaveLength(3);
    expect(result.missingFields).toContain('change30d');
    expect(result.missingFields).toContain('circulatingSupply');
    expect(result.missingFields).toContain('maxSupply');
  });

  it('handles NaN and empty string values as missing', () => {
    vi.setSystemTime(new Date('2026-07-03T13:00:00.000Z'));

    const result = calculateDataQualityScore(
      {
        ...EMPTY_FUNDAMENTALS,
        pe: 'NaN',
        pb: '',
      },
      'STOCK_BR',
      recentAsOf,
    );

    expect(result.coverageScore).toBe('0');
    expect(result.level).toBe('insufficient');
  });

  it('works for STOCK_US asset class', () => {
    vi.setSystemTime(new Date('2026-07-03T13:00:00.000Z'));

    const result = calculateDataQualityScore(
      {
        ...EMPTY_FUNDAMENTALS,
        pe: '15',
        pb: '3',
        roe: '25',
        eps: '2.50',
        dy: '2',
        marketCap: '50000000000',
      },
      'STOCK_US',
      recentAsOf,
    );

    expect(result.coverageScore).toBe('100');
    expect(result.level).toBe('complete');
    expect(result.missingFields).toHaveLength(0);
  });

  it('includes lastUpdatedAt in the report', () => {
    vi.setSystemTime(new Date('2026-07-03T13:00:00.000Z'));

    const result = calculateDataQualityScore(
      {
        ...EMPTY_FUNDAMENTALS,
        pe: '8',
        pb: '1.2',
      },
      'STOCK_BR',
      recentAsOf,
    );

    expect(result.lastUpdatedAt).toBe(recentAsOf);
  });
});
