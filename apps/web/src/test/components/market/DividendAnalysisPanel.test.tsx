import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DividendAnalysisPanel } from '@/components/market/DividendAnalysisPanel';

const mockDividends = [
  { paymentDate: '2026-07-01', value: '1.50', type: 'DIVIDENDO' },
  { paymentDate: '2026-06-01', value: '1.20', type: 'JCP' },
  { paymentDate: '2026-05-01', value: '1.30', type: 'DIVIDENDO' },
];

describe('DividendAnalysisPanel', () => {
  it('sums dividends correctly as decimal string', () => {
    render(<DividendAnalysisPanel dividends={mockDividends} assetClass="STOCK_BR" />);
    expect(screen.getByText('R$ 4.00')).toBeInTheDocument();
  });

  it('shows average value', () => {
    render(<DividendAnalysisPanel dividends={mockDividends} assetClass="STOCK_BR" />);
    expect(screen.getByText('R$ 1.33')).toBeInTheDocument();
  });

  it('shows last payment correctly', () => {
    render(<DividendAnalysisPanel dividends={mockDividends} assetClass="STOCK_BR" />);
    expect(screen.getByText('R$ 1.50')).toBeInTheDocument();
  });

  it('shows event count', () => {
    render(<DividendAnalysisPanel dividends={mockDividends} assetClass="STOCK_BR" />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders empty state when no dividends', () => {
    render(<DividendAnalysisPanel dividends={[]} assetClass="FII" />);
    expect(screen.getByText('Nenhum provento registrado no periodo.')).toBeInTheDocument();
  });

  it('returns null for CRYPTO', () => {
    const { container } = render(<DividendAnalysisPanel dividends={mockDividends} assetClass="CRYPTO" />);
    expect(container.innerHTML).toBe('');
  });
});
