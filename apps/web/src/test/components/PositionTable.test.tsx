/**
 * TC-01 — PositionTable: P/L colorido+sinal, alocação, estado vazio, campo null exibe '—'.
 * Cobre REQ-02, REQ-05, AC-02, AC-05.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PositionTable } from '@/components/portfolio/PositionTable';
import type { PositionSummaryDto } from '@/types/api';

// Stub de roteamento para Link
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}));

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
  total_dividends_brl: '0.00',
  total_return_brl: '500.00',
  total_return_pct: '16.67',
  yield_on_cost_pct: '0.00',
  ...overrides,
});

describe('PositionTable', () => {
  it('exibe estado vazio quando não há posições', () => {
    render(<PositionTable positions={[]} />);
    expect(screen.getByText(/nenhuma posição ainda/i)).toBeInTheDocument();
  });

  it('exibe ticker com link para detalhe', () => {
    render(<PositionTable positions={[makePosition()]} />);
    const link = screen.getByRole('link', { name: 'PETR4' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/assets/asset-1');
  });

  it('exibe P/L positivo com sinal + e classe de cor de lucro', () => {
    render(<PositionTable positions={[makePosition({ lucro_prejuizo_brl: '500.00' })]} />);
    // Podem existir múltiplas células com "+" (P/L valor e P/L %)
    const plCells = screen.getAllByText(/\+/);
    expect(plCells.length).toBeGreaterThan(0);
    plCells.forEach((cell) => expect(cell).toHaveClass('text-profit'));
  });

  it('exibe P/L negativo com sinal − e classe de cor de perda', () => {
    render(
      <PositionTable
        positions={[
          makePosition({
            lucro_prejuizo_brl: '-200.00',
            lucro_prejuizo_pct: '-5.00',
          }),
        ]}
      />,
    );
    // Busca todas as células com − (sinal de perda)
    const cells = screen.getAllByText(/−/);
    expect(cells.length).toBeGreaterThan(0);
    cells.forEach((cell) => expect(cell).toHaveClass('text-loss'));
  });

  it('exibe "—" para campos null (sem cotação — AC-05)', () => {
    render(
      <PositionTable
        positions={[
          makePosition({
            valor_atual_brl: null,
            lucro_prejuizo_brl: null,
            lucro_prejuizo_pct: null,
            alocacao_pct: null,
          }),
        ]}
      />,
    );
    const dashes = screen.getAllByText('—');
    // Pelo menos 4 campos null → 4 traços
    expect(dashes.length).toBeGreaterThanOrEqual(4);
  });

  it('exibe alocação percentual quando disponível', () => {
    render(<PositionTable positions={[makePosition({ alocacao_pct: '23.33' })]} />);
    expect(screen.getByText('23,3%')).toBeInTheDocument();
  });

  it('exibe múltiplas posições', () => {
    const positions = [
      makePosition({ asset_id: 'a1', ticker: 'PETR4' }),
      makePosition({ asset_id: 'a2', ticker: 'VALE3' }),
      makePosition({ asset_id: 'a3', ticker: 'BTCUSDT' }),
    ];
    render(<PositionTable positions={positions} />);
    expect(screen.getByRole('link', { name: 'PETR4' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'VALE3' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'BTCUSDT' })).toBeInTheDocument();
  });
});
