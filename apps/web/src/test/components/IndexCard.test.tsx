import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IndexCard } from '@/components/market/IndexCard';
import { IndexBar } from '@/components/market/IndexBar';

describe('IndexCard', () => {
  it('renderiza label e value', () => {
    render(<IndexCard label="IBOV" value="128.450" changePercent={null} />);
    expect(screen.getByText('IBOV')).toBeInTheDocument();
    expect(screen.getByText('128.450')).toBeInTheDocument();
  });

  it('value usa font-mono', () => {
    render(<IndexCard label="IBOV" value="128.450" changePercent={null} />);
    const value = screen.getByText('128.450');
    expect(value.className).toContain('font-mono');
  });

  it('exibe TrendBadge com variação positiva (text-profit)', () => {
    const { container } = render(<IndexCard label="IBOV" value="128.450" changePercent="1.23" />);
    const badge = container.querySelector('span.text-profit');
    expect(badge).not.toBeNull();
  });

  it('exibe TrendBadge com variação negativa (text-loss)', () => {
    const { container } = render(<IndexCard label="USD/BRL" value="R$ 5.27" changePercent="-0.45" />);
    const badge = container.querySelector('span.text-loss');
    expect(badge).not.toBeNull();
  });

  it('exibe — quando changePercent é null (CDI sem variação)', () => {
    render(<IndexCard label="CDI a.a." value="10,65%" changePercent={null} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('exibe ícone de stale quando stale=true (RN-10)', () => {
    render(<IndexCard label="IBOV" value="128.450" changePercent={null} stale={true} />);
    const staleIcon = screen.getByLabelText('Cotação desatualizada');
    expect(staleIcon).toBeInTheDocument();
  });

  it('não exibe ícone de stale quando stale=false', () => {
    render(<IndexCard label="IBOV" value="128.450" changePercent="1.23" stale={false} />);
    expect(screen.queryByLabelText('Cotação desatualizada')).toBeNull();
  });
});

describe('IndexBar', () => {
  const mockIndices = [
    { id: 'IBOV', label: 'IBOV', value: '128.450', changePercent: '1.23', stale: false },
    { id: 'IFIX', label: 'IFIX', value: '3.050', changePercent: '-0.12', stale: false },
    { id: 'USDBRL', label: 'USD/BRL', value: 'R$ 5,27', changePercent: '0.30', stale: false },
    { id: 'BTC', label: 'BTC/BRL', value: 'R$ 98.200', changePercent: '2.10', stale: false },
    { id: 'CDI', label: 'CDI a.a.', value: '10,65%', changePercent: null, stale: false },
  ];

  it('renderiza todos os 5 índices', () => {
    render(<IndexBar indices={mockIndices} />);
    expect(screen.getByText('IBOV')).toBeInTheDocument();
    expect(screen.getByText('IFIX')).toBeInTheDocument();
    expect(screen.getByText('USD/BRL')).toBeInTheDocument();
    expect(screen.getByText('BTC/BRL')).toBeInTheDocument();
    expect(screen.getByText('CDI a.a.')).toBeInTheDocument();
  });

  it('tem overflow-x-auto para scroll horizontal no mobile (REQ-11)', () => {
    const { container } = render(<IndexBar indices={mockIndices} />);
    const scrollDiv = container.querySelector('.overflow-x-auto');
    expect(scrollDiv).not.toBeNull();
  });

  it('CDI mostra — sem ícone de trending', () => {
    render(<IndexBar indices={mockIndices} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renderiza stale badge quando um índice está stale (RN-10)', () => {
    const staleIndices = [
      { id: 'IBOV', label: 'IBOV', value: '128.450', changePercent: null, stale: true },
    ];
    render(<IndexBar indices={staleIndices} />);
    expect(screen.getByLabelText('Cotação desatualizada')).toBeInTheDocument();
  });

  it('lista vazia não quebra (zero items)', () => {
    const { container } = render(<IndexBar indices={[]} />);
    expect(container.querySelector('section')).toBeInTheDocument();
  });
});
