import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeAll } from 'vitest';
import ComparatorPriceChart, { type PriceSeries } from '@/components/tools/ComparatorPriceChart';

beforeAll(() => {
  class ResizeObserverMock {
    private callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }
    observe() {
      // Trigger immediately with fake dimensions so Recharts renders the SVG
      this.callback([{ contentRect: { width: 800, height: 400 } } as ResizeObserverEntry], this);
    }
    unobserve() { /* noop */ }
    disconnect() { /* noop */ }
  }
  window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
});

const MOCK_SERIES: PriceSeries[] = [
  {
    ticker: 'PETR4',
    series: [
      { date: '2025-07-01', close: '100.00' },
      { date: '2025-08-01', close: '105.00' },
      { date: '2025-09-01', close: '102.00' },
    ],
  },
  {
    ticker: 'VALE3',
    series: [
      { date: '2025-07-01', close: '80.00' },
      { date: '2025-08-01', close: '82.00' },
      { date: '2025-09-01', close: '85.00' },
    ],
  },
];

describe('ComparatorPriceChart', () => {
  it('renders chart with ticker legend items', () => {
    const { container } = render(<ComparatorPriceChart series={MOCK_SERIES} />);
    // Recharts renders SVG
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // Should have lines - each ticker becomes a Line element
    expect(svg!.querySelectorAll('.recharts-line')).toHaveLength(2);
  });

  it('shows empty state when no series provided', () => {
    render(<ComparatorPriceChart series={[]} />);
    expect(screen.getByText(/Dados de preço não disponíveis/)).toBeInTheDocument();
  });

  it('renders with single series', () => {
    const singleSeries: PriceSeries[] = [
      {
        ticker: 'PETR4',
        series: [
          { date: '2025-07-01', close: '100.00' },
          { date: '2025-08-01', close: '105.00' },
        ],
      },
    ];
    const { container } = render(<ComparatorPriceChart series={singleSeries} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('handles series with empty data array', () => {
    const emptySeries: PriceSeries[] = [
      { ticker: 'PETR4', series: [] },
    ];
    render(<ComparatorPriceChart series={emptySeries} />);
    expect(screen.getByText(/Dados de preço não disponíveis/)).toBeInTheDocument();
  });
});
