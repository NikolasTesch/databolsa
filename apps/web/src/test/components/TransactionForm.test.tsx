/**
 * TC-04 — TransactionForm: validação client-side e erro 422 com shake (AC-04).
 * Cobre REQ-04, REQ-08.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock do router
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, back: vi.fn() }),
  usePathname: () => '/',
}));

// Mock do framer-motion para simplificar (evitar erros de animação em jsdom)
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    motion: {
      ...actual.motion,
      form: ({ children, ...props }: React.HTMLAttributes<HTMLFormElement>) => (
        <form {...props}>{children}</form>
      ),
    },
  };
});

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const ASSET_ID = 'asset-test-123';
const API_BASE = 'http://localhost:3000';

describe('TransactionForm — validação client-side', () => {
  it('exibe erro quando quantity é zero', async () => {
    render(<TransactionForm assetId={ASSET_ID} />, { wrapper });
    const user = userEvent.setup();

    await user.clear(screen.getByLabelText(/quantidade/i));
    await user.type(screen.getByLabelText(/quantidade/i), '0');
    await user.click(screen.getByRole('button', { name: /registrar transação/i }));

    await waitFor(() => {
      expect(screen.getByText(/quantidade deve ser maior que zero/i)).toBeInTheDocument();
    });
  });

  it('exibe erro quando unit_price é zero', async () => {
    render(<TransactionForm assetId={ASSET_ID} />, { wrapper });
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/quantidade/i), '10');
    await user.clear(screen.getByLabelText(/preço unitário/i));
    await user.type(screen.getByLabelText(/preço unitário/i), '0');
    await user.click(screen.getByRole('button', { name: /registrar transação/i }));

    await waitFor(() => {
      expect(screen.getByText(/preço deve ser maior que zero/i)).toBeInTheDocument();
    });
  });
});

describe('TransactionForm — erro 422 do backend', () => {
  it('exibe mensagem inline quando backend retorna 422 (venda > posição)', async () => {
    // No ambiente jsdom, o client faz fetch para /api/proxy/... (URL relativa).
    // O MSW no Node intercepta via URL completa. Usamos wildcard para cobrir ambas.
    server.use(
      http.post(/assets\/.*\/transactions/, () => {
        return HttpResponse.json(
          {
            statusCode: 422,
            message: 'Quantidade de venda excede a posição atual',
            error: 'Unprocessable Entity',
          },
          { status: 422 },
        );
      }),
    );

    render(<TransactionForm assetId={ASSET_ID} />, { wrapper });
    const user = userEvent.setup();

    // Selecionar SELL
    await user.selectOptions(screen.getByLabelText(/tipo/i), 'SELL');
    await user.type(screen.getByLabelText(/quantidade/i), '999999');
    await user.type(screen.getByLabelText(/preço unitário/i), '50.00');
    await user.click(screen.getByRole('button', { name: /registrar transação/i }));

    await waitFor(() => {
      const errorEl = screen.getByTestId('transaction-error');
      expect(errorEl).toBeInTheDocument();
      expect(errorEl.textContent).toMatch(/venda inválida/i);
    });
  });
});
