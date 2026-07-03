import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DataQualityBadge } from '@/components/analysis/DataQualityBadge';
import type { DataQualityReport } from '@/lib/analysis/data-quality';

const completeReport: DataQualityReport = {
  coverageScore: '100',
  level: 'complete',
  missingFields: [],
  staleFields: [],
  sourceWarnings: [],
  lastUpdatedAt: '2026-07-03T12:00:00.000Z',
};

const partialReport: DataQualityReport = {
  coverageScore: '55',
  level: 'partial',
  missingFields: ['debtToEquity', 'dailyLiquidity'],
  staleFields: [],
  sourceWarnings: [],
  lastUpdatedAt: '2026-07-03T12:00:00.000Z',
};

const insufficientReport: DataQualityReport = {
  coverageScore: '22',
  level: 'insufficient',
  missingFields: ['pe', 'pb', 'evEbitda', 'roe', 'netMargin', 'dy', 'debtToEquity'],
  staleFields: ['marketCap'],
  sourceWarnings: ['Dados com mais de 24h. Considere atualizar a fonte.'],
  lastUpdatedAt: '2026-07-01T10:00:00.000Z',
};

describe('DataQualityBadge', () => {
  it('renders complete badge with score', () => {
    render(<DataQualityBadge report={completeReport} />);

    expect(screen.getByText('Dados completos')).toBeInTheDocument();
    const completeScores = screen.getAllByText('100%');
    expect(completeScores.length).toBeGreaterThanOrEqual(1);
  });

  it('renders partial badge with score', () => {
    render(<DataQualityBadge report={partialReport} />);

    expect(screen.getByText('Dados parciais')).toBeInTheDocument();
    const partialScores = screen.getAllByText('55%');
    expect(partialScores.length).toBeGreaterThanOrEqual(1);
  });

  it('renders insufficient badge with score', () => {
    render(<DataQualityBadge report={insufficientReport} />);

    expect(screen.getByText('Dados insuficientes')).toBeInTheDocument();
    const insufficientScores = screen.getAllByText('22%');
    expect(insufficientScores.length).toBeGreaterThanOrEqual(1);
  });

  it('shows missing fields in tooltip on hover', () => {
    render(<DataQualityBadge report={partialReport} />);

    // The tooltip text should be in the document but not visible
    expect(screen.getByText('Campos ausentes')).toBeInTheDocument();
    expect(screen.getByText('debtToEquity')).toBeInTheDocument();
    expect(screen.getByText('dailyLiquidity')).toBeInTheDocument();
  });

  it('shows stale fields in tooltip', () => {
    render(<DataQualityBadge report={insufficientReport} />);

    expect(screen.getByText('Campos desatualizados')).toBeInTheDocument();
    expect(screen.getByText('marketCap')).toBeInTheDocument();
  });

  it('shows source warnings in tooltip', () => {
    render(<DataQualityBadge report={insufficientReport} />);

    expect(
      screen.getByText('Dados com mais de 24h. Considere atualizar a fonte.'),
    ).toBeInTheDocument();
  });

  it('shows lastUpdatedAt in tooltip', () => {
    render(<DataQualityBadge report={completeReport} />);

    expect(screen.getByText(/03\/07\/2026/)).toBeInTheDocument();
  });

  it('does not show missing fields section when there are none', () => {
    render(<DataQualityBadge report={completeReport} />);

    expect(screen.queryByText('Campos ausentes')).not.toBeInTheDocument();
  });
});
