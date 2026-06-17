/**
 * SPEC-0017 — TC-04
 * Tests for CurrencyConverter component (fiat/crypto conversion widget)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CurrencyConverter } from '@/components/market/CurrencyConverter';

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TC-04 — CurrencyConverter Component', () => {
  it('renderiza o formulário com campos padrão (fiat: USD → BRL)', () => {
    render(<CurrencyConverter />);
    expect(screen.getByDisplayValue('USD')).toBeInTheDocument();
    expect(screen.getByDisplayValue('BRL')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /converter/i })).toBeInTheDocument();
  });

  it('alterna para modo crypto e exibe BTC como padrão', () => {
    render(<CurrencyConverter />);
    const cryptoBtn = screen.getByRole('button', { name: /cripto/i });
    fireEvent.click(cryptoBtn);
    expect(screen.getByDisplayValue('BTC')).toBeInTheDocument();
    expect(screen.getByDisplayValue('BRL')).toBeInTheDocument();
  });

  it('realiza conversão fiat com sucesso e exibe resultado', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        from: 'USD',
        to: 'BRL',
        amount: '100.00',
        rate: '5.45',
        result: '545.00',
        updatedAt: new Date().toISOString(),
        stale: false,
      }),
    });

    render(<CurrencyConverter />);
    const btn = screen.getByRole('button', { name: /converter/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText(/545[,.]00/)).toBeInTheDocument();
    });
    expect(screen.getByText(/5[,.]45/)).toBeInTheDocument();
  });

  it('exibe mensagem de erro quando conversão falha', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Moeda inválida' }),
    });

    render(<CurrencyConverter />);
    const btn = screen.getByRole('button', { name: /converter/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText('Moeda inválida')).toBeInTheDocument();
    });
  });

  it('exibe mensagem de erro quando fetch lança exceção', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<CurrencyConverter />);
    const btn = screen.getByRole('button', { name: /converter/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText(/falha de conexão/i)).toBeInTheDocument();
    });
  });

  it('limpa resultado e erro ao alternar modo', () => {
    render(<CurrencyConverter />);
    const cryptoBtn = screen.getByRole('button', { name: /cripto/i });
    fireEvent.click(cryptoBtn);
    expect(screen.queryByText(/Taxa/)).not.toBeInTheDocument();
  });
});
