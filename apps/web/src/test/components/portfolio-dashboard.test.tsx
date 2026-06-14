/**
 * TC-01: GrowthChart renderiza com data_points mockados e vazio.
 * TC-02: MonthlyActivityCard exibe 4 indicadores formatados.
 * TC-03: DetailedPositionTable exibe diff e '—' quando current_price_brl é null.
 * TC-04: ComposicaoCharts agrupa por asset_class.
 *
 * Cobre: REQ-05, REQ-07, REQ-09, AC-01..AC-05.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { PortfolioHistoryDataPoint, MonthlyActivityDto, PositionSummaryDto, Asset } from '@/types/api';

// Recharts não funciona em jsdom — mock completo
vi.mock('recharts', () => ({
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  Legend: () => null,
}));

// Mock do next/dynamic para retornar o componente diretamente em testes
vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<any>) => {
    // Retorna um componente que chama o loader de forma síncrona usando require
    const Component = (props: any) => {
      const mod = vi.fn();
      return null;
    };
    Component.displayName = 'DynamicComponent';
    return Component;
  },
}));

// Stub de roteamento para Link
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// ------- TC-01: GrowthChart -------

import { GrowthChart } from '@/components/portfolio/GrowthChart';

const mockDataPoints: PortfolioHistoryDataPoint[] = [
  { date: '2026-01-10', cumulative_invested_brl: '1000.00' },
  { date: '2026-02-15', cumulative_invested_brl: '2500.50' },
  { date: '2026-03-20', cumulative_invested_brl: '3200.75' },
];

describe('TC-01: GrowthChart', () => {
  it('exibe mensagem de vazio quando não há data_points', () => {
    render(<GrowthChart dataPoints={[]} />);
    expect(screen.getByText(/nenhuma transação registrada ainda/i)).toBeInTheDocument();
  });

  it('renderiza o AreaChart quando há data_points', () => {
    render(<GrowthChart dataPoints={mockDataPoints} />);
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });
});

// ------- TC-02: MonthlyActivityCard -------

import { MonthlyActivityCard } from '@/components/portfolio/MonthlyActivityCard';

const mockMonthlyData: MonthlyActivityDto = {
  total_bought_brl: '5000.00',
  total_sold_brl: '1000.00',
  total_dividends_brl: '150.25',
  estimated_realized_gain_brl: '0',
  transaction_count: 7,
};

describe('TC-02: MonthlyActivityCard', () => {
  it('exibe os 4 indicadores com labels corretos', () => {
    render(<MonthlyActivityCard data={mockMonthlyData} />);
    expect(screen.getByText('Compras')).toBeInTheDocument();
    expect(screen.getByText('Vendas')).toBeInTheDocument();
    expect(screen.getByText('Proventos')).toBeInTheDocument();
    expect(screen.getByText('Ganho Realizado')).toBeInTheDocument();
  });

  it('exibe contagem de transações corretamente no singular', () => {
    render(<MonthlyActivityCard data={{ ...mockMonthlyData, transaction_count: 1 }} />);
    expect(screen.getByText(/1 transação no período/i)).toBeInTheDocument();
  });

  it('exibe contagem de transações corretamente no plural', () => {
    render(<MonthlyActivityCard data={mockMonthlyData} />);
    expect(screen.getByText(/7 transações no período/i)).toBeInTheDocument();
  });
});

// ------- TC-03: DetailedPositionTable -------

import { DetailedPositionTable } from '@/components/portfolio/DetailedPositionTable';

const makePosition = (overrides: Partial<PositionSummaryDto> = {}): PositionSummaryDto => ({
  asset_id: 'asset-1',
  ticker: 'PETR4',
  current_quantity: '100',
  average_price: '30.00',
  invested_value: '3000.00',
  valor_atual_brl: '3500.00',
  lucro_prejuizo_brl: '500.00',
  lucro_prejuizo_pct: '16.67',
  alocacao_pct: '23.33',
  is_stale: false,
  current_price_brl: '35.00',
  ...overrides,
});

describe('TC-03: DetailedPositionTable', () => {
  it('exibe estado vazio quando não há posições', () => {
    render(<DetailedPositionTable positions={[]} />);
    expect(screen.getByText(/nenhuma posição em aberto/i)).toBeInTheDocument();
  });

  it('exibe ticker como link', () => {
    render(<DetailedPositionTable positions={[makePosition()]} />);
    const link = screen.getByRole('link', { name: 'PETR4' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/assets/asset-1');
  });

  it('exibe preço atual quando current_price_brl está presente (AC-03)', () => {
    render(<DetailedPositionTable positions={[makePosition({ current_price_brl: '35.00' })]} />);
    // Deve haver formatação BRL do preço atual
    const cells = screen.getAllByText(/R\$/);
    expect(cells.length).toBeGreaterThan(0);
  });

  it('exibe "—" quando current_price_brl é null (AC-04)', () => {
    render(
      <DetailedPositionTable
        positions={[makePosition({ current_price_brl: null, valor_atual_brl: null, lucro_prejuizo_brl: null, lucro_prejuizo_pct: null, alocacao_pct: null })]}
      />,
    );
    const dashes = screen.getAllByText('—');
    // current_price_brl null => diff, diff%, preco atual = '—', mais campos null
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });
});

// ------- TC-04: ComposicaoCharts -------

import { ComposicaoCharts } from '@/components/portfolio/ComposicaoCharts';

const mockAssets: Asset[] = [
  {
    id: 'asset-1',
    user_id: 'u1',
    ticker: 'PETR4',
    name: 'Petrobras',
    asset_class: 'STOCK_BR',
    currency: 'BRL',
    data_source: 'BRAPI',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'asset-2',
    user_id: 'u1',
    ticker: 'BTC',
    name: 'Bitcoin',
    asset_class: 'CRYPTO',
    currency: 'USD',
    data_source: 'COINGECKO',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const mockPositions: PositionSummaryDto[] = [
  makePosition({ asset_id: 'asset-1', ticker: 'PETR4', valor_atual_brl: '3500.00', lucro_prejuizo_brl: '500.00' }),
  makePosition({ asset_id: 'asset-2', ticker: 'BTC', valor_atual_brl: '10000.00', lucro_prejuizo_brl: '-200.00', current_price_brl: '100000.00' }),
];

describe('TC-04: ComposicaoCharts', () => {
  it('exibe mensagem de vazio quando não há posições com cotação', () => {
    render(
      <ComposicaoCharts
        positions={[makePosition({ valor_atual_brl: null })]}
        assets={mockAssets}
      />,
    );
    expect(screen.getByText(/nenhuma posição com cotação disponível/i)).toBeInTheDocument();
  });

  it('exibe labels das classes de ativos na tabela (AC-05)', () => {
    render(<ComposicaoCharts positions={mockPositions} assets={mockAssets} />);
    expect(screen.getByText('Ações BR')).toBeInTheDocument();
    expect(screen.getByText('Cripto')).toBeInTheDocument();
  });

  it('exibe seção Por Moeda com Brasil e Exterior', () => {
    render(<ComposicaoCharts positions={mockPositions} assets={mockAssets} />);
    expect(screen.getByText('Brasil (BRL)')).toBeInTheDocument();
    expect(screen.getByText('Exterior (USD)')).toBeInTheDocument();
  });
});
