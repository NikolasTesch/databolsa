import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AssetMiniCard } from '@/components/market/AssetMiniCard';

describe('AssetMiniCard (TC-09)', () => {
  const baseProps = {
    ticker: 'PETR4',
    name: 'Petrobras PN',
    price: 'R$ 38.50',
    changePercent: '1.23',
    assetClass: 'STOCK_BR' as const,
  };

  it('renderiza ticker em fonte mono', () => {
    render(<AssetMiniCard {...baseProps} />);
    const ticker = screen.getByText('PETR4');
    expect(ticker.className).toContain('font-mono');
  });

  it('exibe o nome da empresa', () => {
    render(<AssetMiniCard {...baseProps} />);
    expect(screen.getByText('Petrobras PN')).toBeInTheDocument();
  });

  it('exibe o preço', () => {
    render(<AssetMiniCard {...baseProps} />);
    expect(screen.getByText('R$ 38.50')).toBeInTheDocument();
  });

  it('link aponta para /ativos/PETR4?class=STOCK_BR', () => {
    const { container } = render(<AssetMiniCard {...baseProps} />);
    const link = container.querySelector('a');
    expect(link?.getAttribute('href')).toBe('/ativos/PETR4?class=STOCK_BR');
  });

  it('exibe StaleBadge quando stale=true', () => {
    render(<AssetMiniCard {...baseProps} stale={true} />);
    expect(screen.getByTestId('stale-badge')).toBeInTheDocument();
  });

  it('não exibe StaleBadge quando stale=false', () => {
    render(<AssetMiniCard {...baseProps} stale={false} />);
    expect(screen.queryByTestId('stale-badge')).toBeNull();
  });
});
