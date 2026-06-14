import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

import { SearchBar } from '@/components/market/SearchBar';

const mockSearchResults = [
  { ticker: 'PETR4', name: 'Petrobras PN', assetClass: 'STOCK_BR' },
  { ticker: 'PETR3', name: 'Petrobras ON', assetClass: 'STOCK_BR' },
];

describe('SearchBar (TC-07)', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/market/search', ({ request }) => {
        const q = new URL(request.url).searchParams.get('q') ?? '';
        if (q.toUpperCase().startsWith('PETR')) {
          return HttpResponse.json({ results: mockSearchResults });
        }
        return HttpResponse.json({ results: [] });
      }),
    );
  });

  it('renderiza o input com placeholder hero por padrão', () => {
    render(<SearchBar variant="hero" />);
    expect(
      screen.getByPlaceholderText(/Pesquise por ticker ou nome/i),
    ).toBeInTheDocument();
  });

  it('renderiza placeholder compact para variant=compact', () => {
    render(<SearchBar variant="compact" />);
    expect(screen.getByPlaceholderText(/Buscar ativo/i)).toBeInTheDocument();
  });

  it('TC-07: exibe dropdown com resultados após debounce', async () => {
    const user = userEvent.setup();
    render(<SearchBar variant="hero" />);

    const input = screen.getByRole('combobox');
    await user.type(input, 'PETR');

    await waitFor(
      () => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        expect(screen.getByText('PETR4')).toBeInTheDocument();
        expect(screen.getByText('PETR3')).toBeInTheDocument();
      },
      { timeout: 800 },
    );
  });

  it('TC-07: fecha o dropdown ao pressionar Escape', async () => {
    const user = userEvent.setup();
    render(<SearchBar variant="hero" />);

    const input = screen.getByRole('combobox');
    await user.type(input, 'PETR');

    await waitFor(() => screen.getByRole('listbox'), { timeout: 800 });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBeNull();
    });
  });

  it('TC-07: navega com ↓ e seleciona com Enter', async () => {
    mockPush.mockClear();
    const user = userEvent.setup();
    render(<SearchBar variant="hero" />);

    const input = screen.getByRole('combobox');
    await user.type(input, 'PETR');
    await waitFor(() => screen.getByRole('listbox'), { timeout: 800 });

    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/ativos/PETR4'));
    });
  });

  it('AC-03: href de navegação inclui ?class=STOCK_BR ao selecionar PETR4 com Enter', async () => {
    mockPush.mockClear();
    const user = userEvent.setup();
    render(<SearchBar variant="hero" />);

    const input = screen.getByRole('combobox');
    await user.type(input, 'PETR');
    await waitFor(() => screen.getByRole('listbox'), { timeout: 800 });

    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/ativos/PETR4?class=STOCK_BR');
    });
  });

  it('AC-03: href de navegação inclui ?class= ao clicar no resultado', async () => {
    mockPush.mockClear();
    const user = userEvent.setup();
    render(<SearchBar variant="hero" />);

    const input = screen.getByRole('combobox');
    await user.type(input, 'PETR');

    await waitFor(() => screen.getByRole('listbox'), { timeout: 800 });

    const firstResult = screen.getByText('PETR4');
    await user.click(firstResult);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/ativos/PETR4?class=STOCK_BR');
    });
  });

  it('não exibe dropdown quando query está vazia', () => {
    render(<SearchBar />);
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
