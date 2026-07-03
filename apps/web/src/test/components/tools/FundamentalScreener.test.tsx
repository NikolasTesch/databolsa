import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import FundamentalScreener from '@/components/tools/FundamentalScreener';

const MOCK_RESPONSE = {
  items: [
    {
      ticker: 'MXRF11',
      name: 'MXRF11',
      assetClass: 'FII',
      totalScore: '88',
      scoreLevel: 'positive',
      fundamentals: { dy: '11', pe: null, pb: '1.02', roe: null, dailyLiquidity: '5000000' },
      stale: false,
      asOf: '2026-07-02T12:00:00.000Z',
    },
    {
      ticker: 'HGLG11',
      name: 'HGLG11',
      assetClass: 'FII',
      totalScore: '76',
      scoreLevel: 'positive',
      fundamentals: { dy: '8', pe: null, pb: '0.95', roe: null, dailyLiquidity: '3000000' },
      stale: false,
      asOf: '2026-07-02T12:00:00.000Z',
    },
  ],
  total: 2,
  partial: false,
  failedTickers: [],
  asOf: '2026-07-02T12:00:00.000Z',
};

describe('FundamentalScreener', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_RESPONSE,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders class tabs and presets', () => {
    render(<FundamentalScreener />);
    expect(screen.getByText('Ações')).toBeInTheDocument();
    expect(screen.getByText('FIIs')).toBeInTheDocument();
    expect(screen.getByText('Dividendos')).toBeInTheDocument();
    expect(screen.getByText('Graham')).toBeInTheDocument();
  });

  it('renders mock result with score and indicators', async () => {
    render(<FundamentalScreener />);

    await waitFor(() => {
      expect(screen.getByText('MXRF11')).toBeInTheDocument();
    });

    expect(screen.getByText('88')).toBeInTheDocument();
    expect(screen.getByText('76')).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.getByText('1.02')).toBeInTheDocument();
  });

  it('links "Abrir analise" to /ativos/[ticker]?class=...', async () => {
    render(<FundamentalScreener />);

    await waitFor(() => {
      expect(screen.getByText('MXRF11')).toBeInTheDocument();
    });

    const links = screen.getAllByText('Abrir analise');
    expect(links[0]).toHaveAttribute('href', '/ativos/MXRF11?class=FII');
  });
});
