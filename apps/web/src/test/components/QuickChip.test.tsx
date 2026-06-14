import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuickChip } from '@/components/market/QuickChip';

describe('QuickChip', () => {
  it('renderiza o label', () => {
    render(<QuickChip label="PETR4" href="/ativos/PETR4?class=STOCK_BR" />);
    expect(screen.getByText('PETR4')).toBeInTheDocument();
  });

  it('AC-04: link aponta para o href correto com ?class=', () => {
    const { container } = render(<QuickChip label="BTC" href="/ativos/BTC?class=CRYPTO" />);
    const link = container.querySelector('a');
    expect(link?.getAttribute('href')).toBe('/ativos/BTC?class=CRYPTO');
  });

  it('AC-04: chip de AAPL inclui ?class=STOCK_US', () => {
    const { container } = render(<QuickChip label="AAPL" href="/ativos/AAPL?class=STOCK_US" />);
    const link = container.querySelector('a');
    expect(link?.getAttribute('href')).toBe('/ativos/AAPL?class=STOCK_US');
  });

  it('é clicável (é um link)', () => {
    const { container } = render(<QuickChip label="VALE3" href="/ativos/VALE3?class=STOCK_BR" />);
    const link = container.querySelector('a');
    expect(link).not.toBeNull();
  });
});
