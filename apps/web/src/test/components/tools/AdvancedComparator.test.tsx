import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import AdvancedComparator from '@/components/tools/AdvancedComparator';

beforeAll(() => {
  class ResizeObserverMock {
    private callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }
    observe() {
      this.callback([{ contentRect: { width: 800, height: 400 } } as ResizeObserverEntry], this);
    }
    unobserve() { /* noop */ }
    disconnect() { /* noop */ }
  }
  window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
});

const MOCK_COMPARE_RESPONSE = {
  items: [
    {
      ticker: 'PETR4',
      name: 'PETR4',
      assetClass: 'STOCK_BR',
      sector: 'Energia',
      industry: null,
      asOf: '2026-07-02T12:00:00.000Z',
      stale: false,
      fundamentals: {
        pe: '8',
        pb: '1.2',
        evEbitda: null,
        debtToEquity: '0.5',
        dy: '12',
        roe: '25',
        netMargin: '18',
        eps: null,
        marketCap: '500000000000',
        revenue: null,
        vacancyRate: null,
        lastDividend: '1.50',
        netWorth: null,
        totalShares: null,
        dailyLiquidity: '50000000',
        adminFee: null,
        change52w: '15',
        volume24h: null,
        circulatingSupply: null,
        maxSupply: null,
        change7d: null,
        change30d: null,
      },
      totalScore: '82',
      scoreLevel: 'positive',
      breakdown: [],
      alerts: [],
      peers: [],
    },
    {
      ticker: 'VALE3',
      name: 'VALE3',
      assetClass: 'STOCK_BR',
      sector: 'Mineracao',
      industry: null,
      asOf: '2026-07-02T12:00:00.000Z',
      stale: false,
      fundamentals: {
        pe: '6',
        pb: '1.5',
        evEbitda: null,
        debtToEquity: '0.3',
        dy: '8',
        roe: '20',
        netMargin: '15',
        eps: null,
        marketCap: '300000000000',
        revenue: null,
        vacancyRate: null,
        lastDividend: '2.00',
        netWorth: null,
        totalShares: null,
        dailyLiquidity: '80000000',
        adminFee: null,
        change52w: '10',
        volume24h: null,
        circulatingSupply: null,
        maxSupply: null,
        change7d: null,
        change30d: null,
      },
      totalScore: '75',
      scoreLevel: 'positive',
      breakdown: [],
      alerts: [],
      peers: [],
    },
  ],
  failedTickers: [],
  asOf: '2026-07-02T12:00:00.000Z',
};

const MOCK_PRICE_HISTORY = (ticker: string) => ({
  ticker,
  range: '1y',
  series: [
    { date: '2025-07-01', close: '100.00' },
    { date: '2025-08-01', close: '105.00' },
    { date: '2025-09-01', close: '102.00' },
  ],
});

describe('AdvancedComparator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/market/compare')) {
        return Promise.resolve({
          ok: true,
          json: async () => MOCK_COMPARE_RESPONSE,
        });
      }
      if (url.includes('/api/market/') && url.includes('/history')) {
        const parts = url.split('/');
        const tickerIdx = parts.indexOf('market') + 1;
        const ticker = parts[tickerIdx];
        return Promise.resolve({
          ok: true,
          json: async () => MOCK_PRICE_HISTORY(ticker),
        });
      }
      return Promise.resolve({ ok: false, json: async () => ({ message: 'Not found' }) });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders initial empty state', () => {
    render(<AdvancedComparator />);
    expect(screen.getByText(/Adicionar ativos/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Digite um ticker/i)).toBeInTheDocument();
    expect(screen.getByText(/Comparar/)).toBeInTheDocument();
  });

  it('adds tickers via Enter key and shows chips', async () => {
    const user = userEvent.setup();
    render(<AdvancedComparator />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'PETR4');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('PETR4')).toBeInTheDocument();
    });

    await user.type(input, 'VALE3');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('VALE3')).toBeInTheDocument();
    });

    // Both chips displayed
    expect(screen.getByText('PETR4')).toBeInTheDocument();
    expect(screen.getByText('VALE3')).toBeInTheDocument();
  });

  it('removes a ticker when clicking close button', async () => {
    const user = userEvent.setup();
    render(<AdvancedComparator />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'PETR4');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('PETR4')).toBeInTheDocument();
    });

    const removeBtn = screen.getByLabelText(/Remover PETR4/);
    await user.click(removeBtn);

    await waitFor(() => {
      expect(screen.queryByText('PETR4')).not.toBeInTheDocument();
    });
  });

  it('fetches and displays comparison results', async () => {
    const user = userEvent.setup();
    render(<AdvancedComparator />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'PETR4');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('PETR4')).toBeInTheDocument();
    });

    await user.type(input, 'VALE3');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('VALE3')).toBeInTheDocument();
    });

    const compareBtn = screen.getByRole('button', { name: /Comparar/i });
    await user.click(compareBtn);

    // Wait for results to appear
    await waitFor(() => {
      expect(screen.getByText('Score')).toBeInTheDocument();
    });

    // Verify indicator labels
    expect(screen.getByText('P/L')).toBeInTheDocument();
    expect(screen.getAllByText('DY').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('ROE')).toBeInTheDocument();
    expect(screen.getByText('Margem')).toBeInTheDocument();
    expect(screen.getByText('Dívida/PL')).toBeInTheDocument();

    // Verify scores displayed (format: XX.Y)
    expect(screen.getByText('82.0')).toBeInTheDocument();
    expect(screen.getByText('75.0')).toBeInTheDocument();

    // Verify price chart section
    expect(screen.getByText(/Histórico de Preços Normalizado/)).toBeInTheDocument();
  });

  it('displays error when fetch fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const user = userEvent.setup();
    render(<AdvancedComparator />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'PETR4');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('PETR4')).toBeInTheDocument();
    });

    await user.type(input, 'VALE3');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('VALE3')).toBeInTheDocument();
    });

    const compareBtn = screen.getByRole('button', { name: /Comparar/i });
    await user.click(compareBtn);

    await waitFor(() => {
      expect(screen.getByText(/Erro de conexão/)).toBeInTheDocument();
    });
  });

  it('enforces max 6 tickers', async () => {
    const user = userEvent.setup();
    render(<AdvancedComparator />);

    const input = screen.getByRole('textbox');
    for (const ticker of ['A', 'B', 'C', 'D', 'E', 'F']) {
      await user.type(input, ticker);
      await user.keyboard('{Enter}');
      await waitFor(() => {});
    }

    // After 6, input should show that max is reached
    expect(screen.getByText(/Máximo de 6 ativos/)).toBeInTheDocument();
  });

  it('does not add duplicate tickers', async () => {
    const user = userEvent.setup();
    render(<AdvancedComparator />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'PETR4');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('PETR4')).toBeInTheDocument();
    });

    // Try adding the same ticker
    await user.type(input, 'PETR4');
    await user.keyboard('{Enter}');

    // Wait a bit - should not create duplicate
    await new Promise((r) => setTimeout(r, 100));

    const petr4Elements = screen.getAllByText('PETR4');
    expect(petr4Elements).toHaveLength(1);
  });
});
