/**
 * T12 — Testes para HighlightsSection:
 * - AssetCard renderiza como <Link> com href correto
 * - Empty state quando dados vazios ou falha de fetch
 * - Link "Ver todos" com href correto
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import HighlightsSection from '@/components/widgets/HighlightsSection';

const MOCK_HIGHLIGHTS = {
  gainers: [
    { ticker: 'PETR4', name: 'Petrobras', price: 'R$ 25,00', changePercent: '+1.23%' },
  ],
  losers: [
    { ticker: 'VALE3', name: 'Vale', price: 'R$ 60,00', changePercent: '-0.89%' },
  ],
  type: 'STOCK_BR',
};

describe('HighlightsSection', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_HIGHLIGHTS,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders AssetCard as Link with correct href for gainers', async () => {
    render(<HighlightsSection initialData={null} />);

    await waitFor(() => {
      expect(screen.getByText('PETR4')).toBeInTheDocument();
    });

    const link = screen.getByRole('link', { name: /PETR4/ });
    expect(link).toHaveAttribute('href', '/ativos/PETR4?class=STOCK_BR');
  });

  it('renders AssetCard as Link with correct href for losers', async () => {
    render(<HighlightsSection initialData={null} />);

    await waitFor(() => {
      expect(screen.getByText('VALE3')).toBeInTheDocument();
    });

    const link = screen.getByRole('link', { name: /VALE3/ });
    expect(link).toHaveAttribute('href', '/ativos/VALE3?class=STOCK_BR');
  });

  it('shows empty state when gainers and losers are empty', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ gainers: [], losers: [], type: 'STOCK_BR' }),
    });

    render(<HighlightsSection initialData={null} />);

    await waitFor(() => {
      const emptyMessages = screen.getAllByText('Nenhum dado disponível.');
      expect(emptyMessages).toHaveLength(2);
    });
  });

  it('shows empty state on fetch failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    render(<HighlightsSection initialData={null} />);

    await waitFor(() => {
      const emptyMessages = screen.getAllByText('Nenhum dado disponível.');
      expect(emptyMessages).toHaveLength(2);
    });
  });

  it('renders "Ver todos" link for gainers with correct href', async () => {
    render(<HighlightsSection initialData={null} />);

    await waitFor(() => {
      expect(screen.getAllByText('Ver todos').length).toBeGreaterThan(0);
    });

    const verTodosLinks = screen.getAllByText('Ver todos');
    expect(verTodosLinks[0]).toHaveAttribute('href', '/mercados?classe=STOCK_BR');
  });

  it('renders initial server data without fetching the initial tab', () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    render(<HighlightsSection initialData={MOCK_HIGHLIGHTS} />);

    expect(screen.getByText('Maiores Altas')).toBeInTheDocument();
    expect(screen.getByText('PETR4')).toBeInTheDocument();
    expect(screen.getByText('VALE3')).toBeInTheDocument();
    expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('shows loading skeleton initially', () => {
    global.fetch = vi.fn<() => Promise<Response>>(() => new Promise(() => {}));

    const { container } = render(<HighlightsSection initialData={null} />);

    const skeletonElements = container.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });
});
