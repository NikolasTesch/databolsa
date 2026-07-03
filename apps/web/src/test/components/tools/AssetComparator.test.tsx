import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import AssetComparator from '@/components/tools/AssetComparator';
import type { NormalizedFundamentals } from '@/lib/fundamentals/fundamentals-adapter.interface';

const MOCK_PETR4_FUNDAMENTALS: NormalizedFundamentals = {
  pe: '4.0',
  pb: '1.2',
  evEbitda: '3.0',
  dy: '12.0',
  roe: '30.0',
  netMargin: '25.0',
  eps: '10.0',
  debtToEquity: '0.8',
  marketCap: '500000000000',
  revenue: null,
  vacancyRate: null,
  lastDividend: null,
  netWorth: null,
  totalShares: null,
  dailyLiquidity: null,
  adminFee: null,
  change52w: '15.0',
  volume24h: null,
  circulatingSupply: null,
  maxSupply: null,
  change7d: null,
  change30d: null,
};

const MOCK_VALE3_FUNDAMENTALS: NormalizedFundamentals = {
  pe: '6.0',
  pb: '1.0',
  evEbitda: '4.0',
  dy: '8.0',
  roe: '18.0',
  netMargin: '15.0',
  eps: '12.0',
  debtToEquity: '0.5',
  marketCap: '300000000000',
  revenue: null,
  vacancyRate: null,
  lastDividend: null,
  netWorth: null,
  totalShares: null,
  dailyLiquidity: null,
  adminFee: null,
  change52w: '-5.0',
  volume24h: null,
  circulatingSupply: null,
  maxSupply: null,
  change7d: null,
  change30d: null,
};

describe('AssetComparator Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('PETR4')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ticker: 'PETR4', indicators: MOCK_PETR4_FUNDAMENTALS }),
        });
      }
      if (url.includes('VALE3')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ticker: 'VALE3', indicators: MOCK_VALE3_FUNDAMENTALS }),
        });
      }
      return Promise.resolve({
        ok: false,
        json: async () => ({ message: 'Não encontrado' }),
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders correctly in initial state', () => {
    render(<AssetComparator />);
    expect(screen.getByText('Comparador de Ativos')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Comparar Ativos/i })).toBeDisabled();
  });

  it('performs comparison between two assets and displays results', async () => {
    render(<AssetComparator />);
    
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'PETR4' } });
    fireEvent.change(inputs[1], { target: { value: 'VALE3' } });

    const compareBtn = screen.getByRole('button', { name: /Comparar Ativos/i });
    expect(compareBtn).toBeEnabled();
    fireEvent.click(compareBtn);

    // Wait for data load
    await waitFor(() => {
      expect(screen.getByText('Desempenho Geral')).toBeInTheDocument();
    });

    // Verify indicators categories shown
    expect(screen.getByText('Valuation')).toBeInTheDocument();
    expect(screen.getByText('Rentabilidade')).toBeInTheDocument();
    expect(screen.getByText('Porte & Estrutura')).toBeInTheDocument();

    // Verify indicators specific to FIIs/Crypto are hidden since they are null for both stocks
    expect(screen.queryByText('Fundos Imobiliários (FIIs)')).not.toBeInTheDocument();
    expect(screen.queryByText('Criptoativos')).not.toBeInTheDocument();

    // Verify scores calculated:
    // PETR4 should win pe (4.0 vs 6.0), evEbitda (3.0 vs 4.0), dy (12.0% vs 8.0%), roe (30.0% vs 18.0%), netMargin (25.0% vs 15.0%), marketCap (500Bi vs 300Bi), change52w (15% vs -5%). Total wins: 7.
    // VALE3 should win pb (1.0 vs 1.2), eps (12.0 vs 10.0), debtToEquity (0.5 vs 0.8). Total wins: 3.
    expect(screen.getAllByText('PETR4').length).toBeGreaterThan(0);
    expect(screen.getAllByText('VALE3').length).toBeGreaterThan(0);
    
    // Total scores rendering
    expect(screen.getByText('7')).toBeInTheDocument(); // PETR4 score
    expect(screen.getByText('3')).toBeInTheDocument(); // VALE3 score

    // PETR4 is strict winner
    expect(screen.getByText('LÍDER')).toBeInTheDocument();
  });

  it('allows clearing inputs and resetting state', async () => {
    render(<AssetComparator />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'PETR4' } });
    fireEvent.change(inputs[1], { target: { value: 'VALE3' } });

    const compareBtn = screen.getByRole('button', { name: /Comparar Ativos/i });
    fireEvent.click(compareBtn);

    await waitFor(() => {
      expect(screen.getByText('Desempenho Geral')).toBeInTheDocument();
    });

    const clearBtn = screen.getByRole('button', { name: /Limpar/i });
    fireEvent.click(clearBtn);

    // Inputs cleared
    expect(inputs[0]).toHaveValue('');
    expect(inputs[1]).toHaveValue('');

    // Results container hidden
    expect(screen.queryByText('Desempenho Geral')).not.toBeInTheDocument();
    expect(screen.queryByText('Valuation')).not.toBeInTheDocument();
  });
});
