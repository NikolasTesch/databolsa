import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PeerComparisonTable } from '@/components/market/PeerComparisonTable';
import type { PeerComparisonItem } from '@/lib/analysis/asset-analysis.types';

const mockPeers: PeerComparisonItem[] = [
  {
    ticker: 'PETR3',
    name: 'PETR3',
    sector: 'Energia',
    industry: 'Petroleo',
    indicators: { pe: '5', pb: '0.9', dy: '8', roe: '15', netMargin: '12', dailyLiquidity: '50000000' },
    totalScore: '85',
    scoreLevel: 'positive',
    stale: false,
    asOf: '2026-07-02T12:00:00.000Z',
  },
  {
    ticker: 'PETR4',
    name: 'PETR4',
    sector: 'Energia',
    industry: 'Petroleo',
    indicators: { pe: '6', pb: '1.1', dy: '7', roe: '18', netMargin: '14', dailyLiquidity: '120000000' },
    totalScore: '72',
    scoreLevel: 'positive',
    stale: false,
    asOf: '2026-07-02T12:00:00.000Z',
  },
  {
    ticker: 'PETR5',
    name: 'PETR5',
    sector: 'Energia',
    industry: 'Petroleo',
    indicators: { pe: null, pb: null, dy: null, roe: null, netMargin: null, dailyLiquidity: null },
    totalScore: '0',
    scoreLevel: 'unknown',
    stale: true,
    asOf: '2026-06-01T12:00:00.000Z',
  },
];

describe('PeerComparisonTable', () => {
  it('renders empty state when peers is empty', () => {
    render(<PeerComparisonTable peers={[]} />);
    expect(screen.getByText('Sem pares comparaveis disponiveis.')).toBeInTheDocument();
  });

  it('renders two peers with indicators', () => {
    render(<PeerComparisonTable peers={mockPeers.slice(0, 2)} />);
    expect(screen.getByText('PETR3')).toBeInTheDocument();
    expect(screen.getByText('PETR4')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('72')).toBeInTheDocument();
  });

  it('renders "-" for null indicators', () => {
    render(<PeerComparisonTable peers={mockPeers.slice(2, 3)} />);
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThanOrEqual(5);
  });

  it('renders stale badge for stale peers', () => {
    render(<PeerComparisonTable peers={mockPeers.slice(2, 3)} />);
    expect(screen.getByText('Desatualizado')).toBeInTheDocument();
  });

  it('links ticker to /ativos/{ticker}', () => {
    render(<PeerComparisonTable peers={mockPeers.slice(0, 1)} />);
    const link = screen.getByRole('link', { name: /PETR3/ });
    expect(link).toHaveAttribute('href', '/ativos/PETR3');
  });
});
