/**
 * Testes para EventsList e CompactEventsList
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { EventsList, CompactEventsList } from '@/components/market/EventsList';

// Mock next/navigation Link
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockEvents = [
  {
    symbol: 'PETR4',
    event_type: 'EARNINGS',
    event_date: '2026-08-25',
    description: 'Resultados 3º Trimestre (estimado)',
    data: null,
  },
  {
    symbol: 'VALE3',
    event_type: 'DIVIDEND_EX',
    event_date: '2026-07-20',
    description: 'Dividendo: R$ 2.5000 (data ex)',
    data: null,
  },
  {
    symbol: 'ITUB4',
    event_type: 'MEETING',
    event_date: '2026-03-15',
    description: 'Assembleia Geral Ordinária (AGO)',
    data: null,
  },
];

describe('EventsList', () => {
  const originalFetch = globalThis.fetch;

  function mockFetch(result: { ok: boolean; json: () => Promise<any> } | Promise<never>) {
    const mockFn = vi.fn().mockResolvedValue(result);
    globalThis.fetch = mockFn as unknown as typeof globalThis.fetch;
    return mockFn;
  }

  function failFetch(err: Error) {
    const mockFn = vi.fn().mockRejectedValue(err);
    globalThis.fetch = mockFn as unknown as typeof globalThis.fetch;
  }

  function pendFetch() {
    globalThis.fetch = vi.fn(() => new Promise<Response>(() => {})) as unknown as typeof globalThis.fetch;
  }

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('exibe estado de loading inicialmente (skeleton)', () => {
    pendFetch();
    const { container } = render(<EventsList ticker="PETR4" limit={5} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('exibe eventos quando fetch é bem-sucedido', async () => {
    const mock = mockFetch({
      ok: true,
      json: () => Promise.resolve({
        data: mockEvents,
        total: 3,
        asOf: new Date().toISOString(),
        stale: false,
      }),
    });

    render(<EventsList ticker="PETR4" limit={5} />);

    await waitFor(() => {
      expect(screen.getByText('Resultados 3º Trimestre (estimado)')).toBeDefined();
    });

    expect(screen.getByText('25/08/2026')).toBeDefined();
    expect(screen.getByText('Resultados')).toBeDefined();
  });

  it('exibe mensagem de erro não-bloqueante quando fetch falha', async () => {
    failFetch(new Error('Network error'));

    render(<EventsList ticker="PETR4" limit={5} />);

    await waitFor(() => {
      expect(screen.getByText('Eventos temporariamente indisponíveis.')).toBeDefined();
    });
  });

  it('exibe empty state quando não há eventos', async () => {
    mockFetch({
      ok: true,
      json: () => Promise.resolve({
        data: [],
        total: 0,
        asOf: new Date().toISOString(),
        stale: false,
      }),
    });

    render(<EventsList ticker="PETR4" limit={5} />);

    await waitFor(() => {
      expect(screen.getByText('Nenhum evento encontrado para os próximos dias.')).toBeDefined();
    });
  });
});

describe('CompactEventsList', () => {
  it('renderiza eventos limitados', () => {
    const { container } = render(
      <CompactEventsList events={mockEvents} max={2} />,
    );

    // Deve ter 2 links (1 por evento)
    const links = container.querySelectorAll('a');
    expect(links.length).toBe(2);
  });

  it('retorna null quando não há eventos', () => {
    const { container } = render(<CompactEventsList events={[]} max={5} />);
    expect(container.innerHTML).toBe('');
  });

  it('não limita quando max é maior que array', () => {
    const { container } = render(
      <CompactEventsList events={mockEvents} max={10} />,
    );
    const links = container.querySelectorAll('a');
    expect(links.length).toBe(3);
  });
});
