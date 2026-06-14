import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const mockPush = vi.fn();

vi.mock('next/navigation', () => {
  const mockSearchParams = new URLSearchParams();
  return {
    useRouter: () => ({ push: mockPush }),
    useSearchParams: () => mockSearchParams,
    usePathname: () => '/',
  };
});

import { MarketSection } from '@/components/market/MarketSection';

function TestWrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const mockHighlights = {
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

describe('MarketSection (TC-10)', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/market/highlights', ({ request }) => {
        const type = new URL(request.url).searchParams.get('type') ?? 'STOCK_BR';
        return HttpResponse.json({ ...mockHighlights, type });
      }),
    );
  });

  it('renderiza cards de maiores altas e baixas', async () => {
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

  it('TC-10: exibe tabs de classes de ativo', async () => {
    render(
      <TestWrapper>
        <MarketSection />
      </TestWrapper>,
    );

    expect(screen.getByRole('tab', { name: 'Ações' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'FIIs' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Crypto' })).toBeInTheDocument();
  });

  it('TC-10: ao clicar em FIIs atualiza URL com ?type=FII (REQ-12)', async () => {
    mockPush.mockClear();
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <MarketSection />
      </TestWrapper>,
    );

    await waitFor(() => screen.getByText('WEGE3'));

    const fiiTab = screen.getByRole('tab', { name: 'FIIs' });
    await user.click(fiiTab);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('type=FII'),
        expect.any(Object),
      );
    });
  });

  it('TC-10: ao clicar em FIIs dispara fetch com type=FII', async () => {
    const user = userEvent.setup();
    const fiiFetch = vi.fn();

    server.use(
      http.get('/api/market/highlights', ({ request }) => {
        const type = new URL(request.url).searchParams.get('type');
        if (type === 'FII') fiiFetch();
        return HttpResponse.json({ ...mockHighlights, type: type ?? 'STOCK_BR' });
      }),
    );

    render(
      <TestWrapper>
        <MarketSection />
      </TestWrapper>,
    );

    await waitFor(() => screen.getByText('WEGE3'));

    const fiiTab = screen.getByRole('tab', { name: 'FIIs' });
    await user.click(fiiTab);

    await waitFor(() => {
      expect(fiiFetch).toHaveBeenCalled();
    });
  });
});
