/**
 * TC-03 — StaleBadge/PositionTable com is_stale=true: renderiza indicador âmbar.
 * Cobre REQ-03, AC-03.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StaleBadge } from '@/components/portfolio/StaleBadge';
import { PositionTable } from '@/components/portfolio/PositionTable';
import type { PositionSummaryDto } from '@/types/api';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}));

describe('StaleBadge', () => {
  it('renderiza com aria-label "Cotação desatualizada"', () => {
    render(<StaleBadge />);
    const badge = screen.getByTestId('stale-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('aria-label', 'Cotação desatualizada');
  });

  it('tem classes de cor âmbar (stale)', () => {
    render(<StaleBadge />);
    const badge = screen.getByTestId('stale-badge');
    expect(badge.className).toMatch(/stale/);
  });
});

describe('PositionTable com is_stale', () => {
  const stalePosition: PositionSummaryDto = {
    asset_id: 'asset-stale',
    ticker: 'XYZW11',
    current_quantity: '10',
    average_price: '100.00',
    invested_value: '1000.00',
    valor_atual_brl: '900.00',
    lucro_prejuizo_brl: '-100.00',
    lucro_prejuizo_pct: '-10.00',
    alocacao_pct: '60.00',
    is_stale: true,
    current_price_brl: '90.00',
    total_dividends_brl: '0.00',
    total_return_brl: '-100.00',
    total_return_pct: '-10.00',
    yield_on_cost_pct: '0.00',
  };

  it('exibe o StaleBadge para posição com is_stale=true', () => {
    render(<PositionTable positions={[stalePosition]} />);
    expect(screen.getByTestId('stale-badge')).toBeInTheDocument();
  });

  it('NÃO exibe StaleBadge para posição com is_stale=false', () => {
    const fresh: PositionSummaryDto = { ...stalePosition, is_stale: false };
    render(<PositionTable positions={[fresh]} />);
    expect(screen.queryByTestId('stale-badge')).not.toBeInTheDocument();
  });

  it('a linha com stale continua exibindo os valores (total não quebra — AC-03)', () => {
    render(<PositionTable positions={[stalePosition]} />);
    // Ticker presente → a linha inteira foi renderizada
    expect(screen.getByRole('link', { name: 'XYZW11' })).toBeInTheDocument();
    // Valor atual está presente
    expect(screen.getByText(/900/)).toBeInTheDocument();
  });
});
