import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnalysisSummary } from '@/components/market/AnalysisSummary';
import type { AssetAnalysis } from '@/lib/analysis/asset-analysis.types';
import { EMPTY_FUNDAMENTALS } from '@/lib/fundamentals/fundamentals-adapter.interface';

const baseAnalysis: AssetAnalysis = {
  ticker: 'PETR4',
  name: 'PETR4',
  assetClass: 'STOCK_BR',
  sector: 'Energia',
  industry: 'Petroleo',
  asOf: '2026-07-02T12:00:00.000Z',
  stale: false,
  fundamentals: EMPTY_FUNDAMENTALS,
  totalScore: '82',
  scoreLevel: 'positive',
  breakdown: [
    {
      category: 'valuation',
      score: '90',
      level: 'positive',
      weight: '0.3',
      reasons: ['P/L e P/VP em faixa positiva.'],
      missing: [],
    },
    {
      category: 'data',
      score: '0',
      level: 'unknown',
      weight: '0.1',
      reasons: [],
      missing: ['dailyLiquidity'],
    },
  ],
  alerts: [
    {
      id: 'missing-liquidity',
      level: 'unknown',
      title: 'Liquidez indisponivel',
      description: 'A fonte nao retornou liquidez diaria.',
      category: 'data',
    },
  ],
  peers: [],
};

describe('AnalysisSummary', () => {
  it('renders score, strengths, attention points and missing data', () => {
    render(<AnalysisSummary analysis={baseAnalysis} />);

    expect(screen.getByText('Score 82/100')).toBeInTheDocument();
    expect(screen.getByText('Pontos fortes')).toBeInTheDocument();
    expect(screen.getByText('Pontos de atencao')).toBeInTheDocument();
    expect(screen.getByText('Dados ausentes')).toBeInTheDocument();
    expect(screen.getByText('Liquidez indisponivel')).toBeInTheDocument();
    expect(screen.queryByText(/compr/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/venda/i)).not.toBeInTheDocument();
  });

  it('renders DataQualityBadge when dataQuality is present', () => {
    render(
      <AnalysisSummary
        analysis={{
          ...baseAnalysis,
          dataQuality: {
            coverageScore: '100',
            level: 'complete',
            missingFields: [],
            staleFields: [],
            sourceWarnings: [],
            lastUpdatedAt: '2026-07-03T12:00:00.000Z',
          },
        }}
      />,
    );

    expect(screen.getByText('Dados completos')).toBeInTheDocument();
    const scores = screen.getAllByText('100%');
    expect(scores.length).toBeGreaterThanOrEqual(1);
  });

  it('does not render DataQualityBadge when dataQuality is absent', () => {
    render(<AnalysisSummary analysis={baseAnalysis} />);

    expect(screen.queryByText('Dados completos')).not.toBeInTheDocument();
    expect(screen.queryByText('Dados parciais')).not.toBeInTheDocument();
    expect(screen.queryByText('Dados insuficientes')).not.toBeInTheDocument();
  });

  it('renders insufficient data instead of NaN for unknown score', () => {
    render(
      <AnalysisSummary
        analysis={{
          ...baseAnalysis,
          totalScore: '0',
          scoreLevel: 'unknown',
          breakdown: [],
          alerts: [],
        }}
      />,
    );

    expect(screen.getByText('Dados insuficientes')).toBeInTheDocument();
    expect(screen.queryByText('NaN')).not.toBeInTheDocument();
  });
});
