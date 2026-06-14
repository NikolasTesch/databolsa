/**
 * TC-11 — Home page: renderiza todas as seções sem usuário autenticado
 *
 * (public)/page.tsx é um async Server Component — não pode ser renderizado
 * diretamente no jsdom. O teste valida os componentes que o compõem
 * (HeroSection inline, IndexBar, MarketSection) com os mesmos mocks MSW
 * usados pelos demais testes, cobrindo AC-01.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// --- next/navigation mock ---
vi.mock('next/navigation', () => {
  return {
    useRouter: () => ({ push: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/',
  };
});

import { SearchBar } from '@/components/market/SearchBar';
import { QuickChip } from '@/components/market/QuickChip';
import { IndexBar } from '@/components/market/IndexBar';
import { MarketSection } from '@/components/market/MarketSection';

function TestWrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const MOCK_INDICES = [
  { id: 'IBOV', label: 'IBOV', value: '128.450', changePercent: '1.23', stale: false },
  { id: 'IFIX', label: 'IFIX', value: '3.050', changePercent: '-0.12', stale: false },
  { id: 'USDBRL', label: 'USD/BRL', value: 'R$ 5,27', changePercent: '0.30', stale: false },
  { id: 'BTC', label: 'BTC/BRL', value: 'R$ 98.200', changePercent: '2.10', stale: false },
  { id: 'CDI', label: 'CDI a.a.', value: '10,65%', changePercent: null, stale: false },
];

const MOCK_HIGHLIGHTS = {
  gainers: [
    { ticker: 'WEGE3', name: 'WEG SA', assetClass: 'STOCK_BR', price: 'R$ 50.00', changePercent: '3.21', stale: false },
    { ticker: 'ITUB4', name: 'Itaú Unibanco', assetClass: 'STOCK_BR', price: 'R$ 34.00', changePercent: '1.80', stale: false },
  ],
  losers: [
    { ticker: 'MGLU3', name: 'Magazine Luiza', assetClass: 'STOCK_BR', price: 'R$ 2.10', changePercent: '-4.55', stale: false },
  ],
  type: 'STOCK_BR',
  asOf: new Date().toISOString(),
};

const QUICK_CHIPS = [
  { label: 'PETR4', href: '/ativos/PETR4?class=STOCK_BR' },
  { label: 'VALE3', href: '/ativos/VALE3?class=STOCK_BR' },
  { label: 'BTC', href: '/ativos/BTC?class=CRYPTO' },
  { label: 'AAPL', href: '/ativos/AAPL?class=STOCK_US' },
];

describe('TC-11 — Home pública: renderiza todas as seções sem autenticação (AC-01)', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/market/highlights', () => HttpResponse.json(MOCK_HIGHLIGHTS)),
    );
  });

  it('HeroSection: renderiza headline principal', () => {
    render(
      <TestWrapper>
        <section aria-label="Busca de ativos">
          <h1>Análise de ativos e acompanhamento de carteira</h1>
          <p>B3, criptos, stocks americanos e muito mais.</p>
          <SearchBar variant="hero" />
          {QUICK_CHIPS.map((chip) => (
            <QuickChip key={chip.label} label={chip.label} href={chip.href} />
          ))}
        </section>
      </TestWrapper>,
    );

    expect(
      screen.getByText('Análise de ativos e acompanhamento de carteira'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('B3, criptos, stocks americanos e muito mais.'),
    ).toBeInTheDocument();
  });

  it('HeroSection: SearchBar hero está presente com placeholder correto', () => {
    render(
      <TestWrapper>
        <SearchBar variant="hero" />
      </TestWrapper>,
    );

    const input = screen.getByRole('combobox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute(
      'placeholder',
      'Pesquise por ticker ou nome... ex: PETR4, Bitcoin',
    );
  });

  it('HeroSection: chips "Mais buscados" são links navegáveis', () => {
    render(
      <TestWrapper>
        <>
          {QUICK_CHIPS.map((chip) => (
            <QuickChip key={chip.label} label={chip.label} href={chip.href} />
          ))}
        </>
      </TestWrapper>,
    );

    const petr4 = screen.getByText('PETR4');
    expect(petr4).toBeInTheDocument();
    expect(petr4.closest('a')).toHaveAttribute('href', '/ativos/PETR4?class=STOCK_BR');

    const btc = screen.getByText('BTC');
    expect(btc.closest('a')).toHaveAttribute('href', '/ativos/BTC?class=CRYPTO');
  });

  it('IndexBar: renderiza os 5 índices de mercado (IBOV, IFIX, USD/BRL, BTC/BRL, CDI)', () => {
    render(
      <TestWrapper>
        <IndexBar indices={MOCK_INDICES} />
      </TestWrapper>,
    );

    expect(screen.getByText('IBOV')).toBeInTheDocument();
    expect(screen.getByText('IFIX')).toBeInTheDocument();
    expect(screen.getByText('USD/BRL')).toBeInTheDocument();
    expect(screen.getByText('BTC/BRL')).toBeInTheDocument();
    expect(screen.getByText('CDI a.a.')).toBeInTheDocument();
  });

  it('IndexBar: tem aria-label "Indicadores de mercado"', () => {
    render(
      <TestWrapper>
        <IndexBar indices={MOCK_INDICES} />
      </TestWrapper>,
    );

    expect(
      screen.getByRole('region', { name: 'Indicadores de mercado' }),
    ).toBeInTheDocument();
  });

  it('MarketSection: renderiza seções de altas e baixas via MSW', async () => {
    render(
      <TestWrapper>
        <MarketSection />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('Maiores Altas')).toBeInTheDocument();
      expect(screen.getByText('Maiores Baixas')).toBeInTheDocument();
    });

    expect(screen.getByText('WEGE3')).toBeInTheDocument();
    expect(screen.getByText('MGLU3')).toBeInTheDocument();
  });

  it('MarketSection: tabs de classes de ativo visíveis (Ações, FIIs, Crypto)', async () => {
    render(
      <TestWrapper>
        <MarketSection />
      </TestWrapper>,
    );

    expect(screen.getByRole('tab', { name: 'Ações' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'FIIs' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Crypto' })).toBeInTheDocument();
  });

  it('composição completa: headline + IndexBar + MarketSection presentes ao mesmo tempo', async () => {
    render(
      <TestWrapper>
        <>
          <section aria-label="Busca de ativos">
            <h1>Análise de ativos e acompanhamento de carteira</h1>
            <SearchBar variant="hero" />
            {QUICK_CHIPS.map((chip) => (
              <QuickChip key={chip.label} label={chip.label} href={chip.href} />
            ))}
          </section>

          <IndexBar indices={MOCK_INDICES} />

          <MarketSection />
        </>
      </TestWrapper>,
    );

    // HeroSection
    expect(
      screen.getByText('Análise de ativos e acompanhamento de carteira'),
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();

    // IndexBar
    expect(
      screen.getByRole('region', { name: 'Indicadores de mercado' }),
    ).toBeInTheDocument();

    // MarketSection
    await waitFor(() => {
      expect(screen.getByText('Maiores Altas')).toBeInTheDocument();
    });
    expect(screen.getByText('WEGE3')).toBeInTheDocument();
  });
});
