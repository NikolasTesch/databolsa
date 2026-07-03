import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PortfolioDiagnostics from '@/components/portfolio/PortfolioDiagnostics';
import type { PortfolioSummaryDto, Asset } from '@/types/api';

const mockAssets: Asset[] = [
  { id: '1', user_id: 'u1', ticker: 'PETR4', name: 'Petrobras', asset_class: 'STOCK_BR', currency: 'BRL', data_source: 'BRAPI', sector: null, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: '2', user_id: 'u1', ticker: 'VALE3', name: 'Vale', asset_class: 'STOCK_BR', currency: 'BRL', data_source: 'BRAPI', sector: null, created_at: '2026-01-01', updated_at: '2026-01-01' },
];

const mockSummary: PortfolioSummaryDto = {
  patrimonio_total_brl: '50000',
  positions: [
    {
      ticker: 'PETR4',
      asset_id: '1',
      average_price: '30',
      current_quantity: '500',
      current_price_brl: '40',
      valor_atual_brl: '20000',
      invested_value: '15000',
      lucro_prejuizo_brl: '5000',
      lucro_prejuizo_pct: '33.33',
      alocacao_pct: '40',
      is_stale: false,
      total_dividends_brl: '0',
      total_return_brl: '5000',
      total_return_pct: '33.33',
      yield_on_cost_pct: '0',
    },
    {
      ticker: 'VALE3',
      asset_id: '2',
      average_price: '60',
      current_quantity: '200',
      current_price_brl: '50',
      valor_atual_brl: '10000',
      invested_value: '12000',
      lucro_prejuizo_brl: '-2000',
      lucro_prejuizo_pct: '-16.67',
      alocacao_pct: '20',
      is_stale: true,
      total_dividends_brl: '0',
      total_return_brl: '-2000',
      total_return_pct: '-16.67',
      yield_on_cost_pct: '0',
    },
  ],
};

describe('PortfolioDiagnostics', () => {
  it('shows empty state when no positions', () => {
    render(
      <PortfolioDiagnostics
        summary={{ patrimonio_total_brl: '0', positions: [] }}
        assets={mockAssets}
      />,
    );
    expect(screen.getByText(/Carteira sem posicoes/)).toBeInTheDocument();
  });

  it('flags concentration above 25%', () => {
    render(<PortfolioDiagnostics summary={mockSummary} assets={mockAssets} />);
    expect(screen.getByText(/Alocacao de 40.0%/)).toBeInTheDocument();
  });

  it('flags stale quote', () => {
    render(<PortfolioDiagnostics summary={mockSummary} assets={mockAssets} />);
    expect(screen.getByText(/Cotacao desatualizada/)).toBeInTheDocument();
  });

  it('flags relevant negative P/L', () => {
    render(<PortfolioDiagnostics summary={mockSummary} assets={mockAssets} />);
    expect(screen.getByText(/P\/L negativo relevante/)).toBeInTheDocument();
  });

  it('links to /ativos/[ticker]', () => {
    render(<PortfolioDiagnostics summary={mockSummary} assets={mockAssets} />);
    const links = screen.getAllByRole('link');
    const hasPetr4 = links.some((l) => l.getAttribute('href') === '/ativos/PETR4');
    const hasVale3 = links.some((l) => l.getAttribute('href') === '/ativos/VALE3');
    expect(hasPetr4).toBe(true);
    expect(hasVale3).toBe(true);
  });
});
