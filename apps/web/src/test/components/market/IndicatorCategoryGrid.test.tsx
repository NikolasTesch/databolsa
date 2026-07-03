import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IndicatorCategoryGrid } from '@/components/market/IndicatorCategoryGrid';
import { EMPTY_FUNDAMENTALS } from '@/lib/fundamentals/fundamentals-adapter.interface';

describe('IndicatorCategoryGrid', () => {
  it('groups stock indicators by analysis category', () => {
    render(
      <IndicatorCategoryGrid
        assetClass="STOCK_BR"
        indicators={{
          ...EMPTY_FUNDAMENTALS,
          pe: '8',
          pb: '1.1',
          roe: '18',
          dy: '7',
          debtToEquity: '0.6',
        }}
      />,
    );

    expect(screen.getByText('Valuation')).toBeInTheDocument();
    expect(screen.getByText('Rentabilidade')).toBeInTheDocument();
    expect(screen.getByText('Dividendos')).toBeInTheDocument();
    expect(screen.getByText('Risco e liquidez')).toBeInTheDocument();
    expect(screen.getByText('P/L')).toBeInTheDocument();
    expect(screen.getByText('8,00')).toBeInTheDocument();
  });

  it('shows schedule icon for stale fields', () => {
    render(
      <IndicatorCategoryGrid
        assetClass="STOCK_BR"
        indicators={{
          ...EMPTY_FUNDAMENTALS,
          pe: '8',
          pb: '1.1',
          roe: '18',
          dy: '7',
          debtToEquity: '0.6',
        }}
        staleFields={['pe', 'dy']}
      />,
    );

    // The "schedule" icon should appear for stale fields
    const scheduleIcons = document.querySelectorAll('.material-symbols-outlined');
    const scheduleEls = Array.from(scheduleIcons).filter(
      (el) => el.textContent === 'schedule',
    );
    expect(scheduleEls.length).toBe(2);
  });

  it('does not render schedule icon when staleFields is empty', () => {
    render(
      <IndicatorCategoryGrid
        assetClass="STOCK_BR"
        indicators={{
          ...EMPTY_FUNDAMENTALS,
          pe: '8',
          pb: '1.1',
          roe: '18',
          dy: '7',
          debtToEquity: '0.6',
        }}
        staleFields={[]}
      />,
    );

    const scheduleIcons = document.querySelectorAll('.material-symbols-outlined');
    const scheduleEls = Array.from(scheduleIcons).filter(
      (el) => el.textContent === 'schedule',
    );
    expect(scheduleEls.length).toBe(0);
  });

  it('does not render stock valuation categories for crypto', () => {
    render(
      <IndicatorCategoryGrid
        assetClass="CRYPTO"
        indicators={{
          ...EMPTY_FUNDAMENTALS,
          marketCap: '1000000000',
          volume24h: '200000000',
          change7d: '4',
        }}
      />,
    );

    expect(screen.queryByText('Valuation')).not.toBeInTheDocument();
    expect(screen.queryByText('Dividendos')).not.toBeInTheDocument();
    expect(screen.getByText('Mercado')).toBeInTheDocument();
    expect(screen.getByText('Momentum')).toBeInTheDocument();
  });
});
