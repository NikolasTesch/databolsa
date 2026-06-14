/**
 * TC-01, TC-02 (SPEC-0014) — AddToPortfolioButton
 * TC-03 (SPEC-0014) — AssetForm pré-preenchimento via defaultValues
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

import { AddToPortfolioButton } from '@/components/market/AddToPortfolioButton';

describe('AddToPortfolioButton — TC-01, TC-02', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Limpar cookies de documento
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  it('TC-01: usuário logado navega para /assets/new com query params corretos', () => {
    // Simular cookie de acesso
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'access_token=some-jwt-token; path=/',
    });

    render(<AddToPortfolioButton ticker="PETR4" assetClass="STOCK_BR" />);
    const btn = screen.getByTestId('add-to-portfolio-btn');
    fireEvent.click(btn);

    expect(mockPush).toHaveBeenCalledWith('/assets/new?ticker=PETR4&assetClass=STOCK_BR');
  });

  it('TC-02: usuário não logado é redirecionado para /login com next URL-encoded', () => {
    // Sem cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });

    render(<AddToPortfolioButton ticker="PETR4" assetClass="STOCK_BR" />);
    const btn = screen.getByTestId('add-to-portfolio-btn');
    fireEvent.click(btn);

    // next deve ser URL-encoded
    const expectedNext = encodeURIComponent('/assets/new?ticker=PETR4&assetClass=STOCK_BR');
    expect(mockPush).toHaveBeenCalledWith(`/login?next=${expectedNext}`);
  });

  it('TC-02b: o valor decodificado de next resulta em /assets/new?ticker=PETR4&assetClass=STOCK_BR', () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });

    render(<AddToPortfolioButton ticker="PETR4" assetClass="STOCK_BR" />);
    fireEvent.click(screen.getByTestId('add-to-portfolio-btn'));

    const call = mockPush.mock.calls[0][0] as string;
    const url = new URL(call, 'http://localhost');
    const nextParam = url.searchParams.get('next');
    expect(nextParam).toBeDefined();

    // decodificar
    const decoded = decodeURIComponent(nextParam!);
    expect(decoded).toBe('/assets/new?ticker=PETR4&assetClass=STOCK_BR');
  });
});

// TC-03: AssetForm pré-preenchimento
import { AssetForm } from '@/components/assets/AssetForm';

// Mocks necessários para AssetForm
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock('@/lib/api/assets', () => ({
  createAsset: vi.fn(),
}));

describe('AssetForm — TC-03 (SPEC-0014)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-03: campos ticker e assetClass são pré-preenchidos quando props presentes', () => {
    render(<AssetForm defaultTicker="PETR4" defaultAssetClass="STOCK_BR" />);

    const tickerInput = screen.getByLabelText(/Ticker/i) as HTMLInputElement;
    expect(tickerInput.value).toBe('PETR4');

    const categorySelect = screen.getByLabelText(/Categoria/i) as HTMLSelectElement;
    expect(categorySelect.value).toBe('STOCK_BR');
  });

  it('TC-03b: campos permanecem editáveis (não readonly)', () => {
    render(<AssetForm defaultTicker="PETR4" defaultAssetClass="STOCK_BR" />);

    const tickerInput = screen.getByLabelText(/Ticker/i) as HTMLInputElement;
    expect(tickerInput.readOnly).toBe(false);
    expect(tickerInput.disabled).toBe(false);

    // Deve ser possível alterar o valor
    fireEvent.change(tickerInput, { target: { value: 'VALE3' } });
    expect(tickerInput.value).toBe('VALE3');
  });

  it('TC-03c: sem props, campos estão em branco', () => {
    render(<AssetForm />);

    const tickerInput = screen.getByLabelText(/Ticker/i) as HTMLInputElement;
    expect(tickerInput.value).toBe('');
  });
});
