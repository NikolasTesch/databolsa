import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AgendaItem } from '@/lib/market/dividends-agenda';

const mockFetchBrapiDividends = vi.hoisted(() => vi.fn());

vi.mock('@/lib/market/market-fetchers', () => ({
  fetchBrapiDividends: mockFetchBrapiDividends,
}));

describe('getDividendsAgenda', () => {
  let getDividendsAgenda: () => Promise<AgendaItem[]>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockFetchBrapiDividends.mockReset();
    // Re-import to get a fresh module state (clear in-memory cache)
    vi.resetModules();
    const mod = await import('@/lib/market/dividends-agenda');
    getDividendsAgenda = mod.getDividendsAgenda;
  });

  it('retorna array de AgendaItem quando fetch funciona', async () => {
    mockFetchBrapiDividends.mockResolvedValue([
      { paymentDate: '2026-07-15', value: '1.50', type: 'Dividendo' },
    ]);

    const result = await getDividendsAgenda();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('ticker');
    expect(result[0]).toHaveProperty('type');
    expect(result[0]).toHaveProperty('value');
  });

  it('mapeia "Juros Sobre Capital Próprio" para "JCP"', async () => {
    mockFetchBrapiDividends.mockResolvedValue([
      { paymentDate: '2026-08-01', value: '0.75', type: 'Juros Sobre Capital Próprio' },
    ]);

    const result = await getDividendsAgenda();
    expect(result[0].type).toBe('JCP');
  });

  it('mapeia "Dividendo" corretamente', async () => {
    mockFetchBrapiDividends.mockResolvedValue([
      { paymentDate: '2026-08-01', value: '1.00', type: 'Dividendo' },
    ]);

    const result = await getDividendsAgenda();
    expect(result[0].type).toBe('Dividendo');
  });

  it('usa data formatada pt-BR para dateCom e payment', async () => {
    mockFetchBrapiDividends.mockResolvedValue([
      { paymentDate: '2026-07-15', value: '1.00', type: 'Dividendo' },
    ]);

    const result = await getDividendsAgenda();
    // pt-BR format: 15/07/2026
    expect(result[0].dateCom).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(result[0].payment).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('usa "—" para paymentDate ausente', async () => {
    mockFetchBrapiDividends.mockResolvedValue([
      { paymentDate: null, value: '1.00', type: 'Dividendo' },
    ]);

    const result = await getDividendsAgenda();
    expect(result[0].dateCom).toBe('—');
    expect(result[0].payment).toBe('—');
  });

  it('usa yieldPct como "-"', async () => {
    mockFetchBrapiDividends.mockResolvedValue([
      { paymentDate: '2026-07-15', value: '1.00', type: 'Dividendo' },
    ]);

    const result = await getDividendsAgenda();
    expect(result[0].yieldPct).toBe('-');
  });
});
