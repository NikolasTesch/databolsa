/**
 * T12 — Testes para DividendsSection:
 * - Linhas da tabela têm link para /ativos/{ticker}
 * - Empty state quando agenda vazia
 * - Link "Ver agenda completa" com href correto
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Hoisted mocks: controle explícito por teste sem vazamento de estado
const mockFetchDividendsNews = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ articles: [] }),
);
const mockGetDividendsAgenda = vi.hoisted(() =>
  vi.fn().mockResolvedValue([] as Array<Record<string, string>>),
);

vi.mock('@/lib/news/news.service', () => ({
  fetchDividendsNews: mockFetchDividendsNews,
}));

vi.mock('@/lib/market/dividends-agenda', () => ({
  getDividendsAgenda: mockGetDividendsAgenda,
}));

import DividendsSection from '@/components/widgets/DividendsSection';

describe('DividendsSection', () => {
  beforeEach(() => {
    // Reset + restore default empty state para evitar vazamento entre testes
    vi.clearAllMocks();
    mockGetDividendsAgenda.mockReset().mockResolvedValue([]);
    mockFetchDividendsNews.mockReset().mockResolvedValue({ articles: [] });
  });

  it('renders table row links to asset detail with correct href', async () => {
    mockGetDividendsAgenda.mockResolvedValue([
      {
        ticker: 'PETR4',
        assetClass: 'STOCK_BR',
        type: 'Dividendo',
        dateCom: '01/07/2026',
        payment: '15/07/2026',
        value: 'R$ 1,23',
        yieldPct: '0,5%',
      },
      {
        ticker: 'VALE3',
        assetClass: 'STOCK_BR',
        type: 'JCP',
        dateCom: '10/07/2026',
        payment: '25/07/2026',
        value: 'R$ 0,89',
        yieldPct: '0,3%',
      },
    ]);

    const Component = await DividendsSection();
    render(Component);

    const petrLink = screen.getByRole('link', { name: /PETR4/ });
    expect(petrLink).toHaveAttribute('href', '/ativos/PETR4?class=STOCK_BR');

    const valeLink = screen.getByRole('link', { name: /VALE3/ });
    expect(valeLink).toHaveAttribute('href', '/ativos/VALE3?class=STOCK_BR');
  });

  it('shows empty state when agenda is empty', async () => {
    const Component = await DividendsSection();
    render(Component);

    expect(screen.getByText('Nenhum dividendo disponível no momento.')).toBeInTheDocument();
  });

  it('renders "Ver agenda completa" link', async () => {
    const Component = await DividendsSection();
    render(Component);

    const link = screen.getByText('Ver agenda completa');
    expect(link).toHaveAttribute('href', '/dividendos');
  });

  it('renders news section with empty state message when no news', async () => {
    const Component = await DividendsSection();
    render(Component);

    expect(
      screen.getByText('Nenhuma notícia sobre proventos disponível no momento.'),
    ).toBeInTheDocument();
  });
});
