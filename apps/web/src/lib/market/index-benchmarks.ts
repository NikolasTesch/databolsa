/**
 * Historical benchmark data for Brazilian market indices.
 * These are curated constants updated manually by the team.
 * Last updated: 2026-06-14
 *
 * Sources:
 *   - IBOV P/E: Bolsa em números B3, ECONOMATICA historicals (avg ~10–12×)
 *   - IFIX DY: B3 Relatório FII monthly (avg ~7–9% a.a.)
 */

export type IndexLabel = 'Barato' | 'Neutro' | 'Caro';

export interface IndexBenchmark {
  /** Historical average P/E or DY */
  historicalAvg: number;
  ranges: {
    /** Upper bound for "Barato" label (below this is cheap) */
    cheap: number;
    /** Lower bound for "Caro" label (above this is expensive) */
    expensive: number;
  };
  description: string;
  metric: 'P/L' | 'DY';
  unit: 'x' | '%';
}

export interface IndexBenchmarks {
  ibov: IndexBenchmark;
  ifix: IndexBenchmark;
  lastUpdated: string;
}

export const INDEX_BENCHMARKS: IndexBenchmarks = {
  ibov: {
    historicalAvg: 11,
    ranges: {
      cheap: 9,
      expensive: 13,
    },
    description: 'P/L histórico médio do Ibovespa (2010–2026)',
    metric: 'P/L',
    unit: 'x',
  },
  ifix: {
    historicalAvg: 8,
    ranges: {
      cheap: 6,
      expensive: 10,
    },
    description: 'Dividend Yield histórico médio do IFIX (2015–2026)',
    metric: 'DY',
    unit: '%',
  },
  lastUpdated: '2026-06-14',
};

/**
 * Given a current value and benchmark config, returns the valuation label.
 *
 * For P/L (P/E ratio): higher = more expensive.
 * For DY: higher = cheaper (more attractive yield).
 */
export function getValuationLabel(
  currentValue: number,
  benchmark: IndexBenchmark,
): IndexLabel {
  if (benchmark.metric === 'DY') {
    // Higher DY = cheaper
    if (currentValue >= benchmark.ranges.expensive) return 'Barato';
    if (currentValue <= benchmark.ranges.cheap) return 'Caro';
    return 'Neutro';
  }

  // P/L: lower = cheaper
  if (currentValue <= benchmark.ranges.cheap) return 'Barato';
  if (currentValue >= benchmark.ranges.expensive) return 'Caro';
  return 'Neutro';
}
