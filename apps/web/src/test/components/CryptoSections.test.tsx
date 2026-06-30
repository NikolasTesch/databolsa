/**
 * T12 — Testes para CryptoSections:
 * - Cards cripto são <a> com href para /ativos/{symbol}
 * - Empty state quando dados vazios
 * - Link "Painel completo" com href correto
 * - Trending sidebar com empty state
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockFetchCryptoNews = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ articles: [] }),
);
const mockGetCryptoOverview = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ assets: [], trending: [] }),
);

vi.mock('@/lib/news/news.service', () => ({
  fetchCryptoNews: mockFetchCryptoNews,
}));

vi.mock('@/lib/market/crypto-overview', () => ({
  getCryptoOverview: mockGetCryptoOverview,
}));

import CryptoSections from '@/components/widgets/CryptoSections';

describe('CryptoSections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCryptoOverview.mockReset().mockResolvedValue({ assets: [], trending: [] });
    mockFetchCryptoNews.mockReset().mockResolvedValue({ articles: [] });
  });

  it('renders crypto cards as links with correct href', async () => {
    mockGetCryptoOverview.mockResolvedValue({
      assets: [
        {
          symbol: 'BTC', name: 'Bitcoin', price: 'R$ 350.000,00',
          changePercent: '+2,50%', volume24h: 'R$ 50,0B', stale: false,
        },
        {
          symbol: 'ETH', name: 'Ethereum', price: 'R$ 15.000,00',
          changePercent: '-1,20%', volume24h: 'R$ 20,0B', stale: false,
        },
      ],
      trending: [
        { symbol: 'BTC', name: 'Bitcoin', price: 'R$ 350.000,00', changePercent: '+2,50%', volume24h: 'R$ 50,0B', stale: false },
      ],
    });

    const Component = await CryptoSections();
    render(Component);

    const btcLink = screen.getByRole('link', { name: /BTC/ });
    expect(btcLink).toHaveAttribute('href', '/ativos/BTC?class=CRYPTO');

    const ethLink = screen.getByRole('link', { name: /ETH/ });
    expect(ethLink).toHaveAttribute('href', '/ativos/ETH?class=CRYPTO');
  });

  it('shows empty state when no crypto assets', async () => {
    const Component = await CryptoSections();
    render(Component);

    expect(screen.getByText('Dados de cripto indisponíveis no momento.')).toBeInTheDocument();
  });

  it('shows empty state for trending when no data', async () => {
    mockGetCryptoOverview.mockResolvedValue({
      assets: [{
        symbol: 'BTC', name: 'Bitcoin', price: 'R$ 350.000,00',
        changePercent: '+2,50%', volume24h: 'R$ 50,0B', stale: false,
      }],
      trending: [],
    });

    const Component = await CryptoSections();
    render(Component);

    expect(screen.getByText('Nenhum dado disponível.')).toBeInTheDocument();
  });

  it('shows empty state for news when no articles', async () => {
    const Component = await CryptoSections();
    render(Component);

    expect(
      screen.getByText('Nenhuma notícia disponível no momento.'),
    ).toBeInTheDocument();
  });

  it('renders "Painel completo" link', async () => {
    const Component = await CryptoSections();
    render(Component);

    const link = screen.getByText('Painel completo');
    expect(link).toHaveAttribute('href', '/mercado/cripto');
  });
});
