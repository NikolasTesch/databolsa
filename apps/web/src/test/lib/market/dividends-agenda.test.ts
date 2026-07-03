import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Decimal } from 'decimal.js';
import type { AgendaItem } from '@/lib/market/dividends-agenda';

const mockFetchBrapiDividends = vi.hoisted(() => vi.fn());
const mockFetchCachedMarketValue = vi.hoisted(() => vi.fn());

vi.mock('@/lib/market/market-fetchers', () => ({
  fetchBrapiDividends: mockFetchBrapiDividends,
  fetchBrapiQuote: vi.fn(),
}));

vi.mock('@/lib/market/market-cache', () => ({
  fetchCachedMarketValue: mockFetchCachedMarketValue,
}));

describe('getDividendsAgenda', () => {
  let getDividendsAgenda: () => Promise<AgendaItem[]>;

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-07-01'));
    vi.clearAllMocks();
    mockFetchBrapiDividends.mockReset();
    mockFetchCachedMarketValue.mockReset();
    mockFetchCachedMarketValue.mockResolvedValue(null); // default: no price → yieldPct = '—'
    // Re-import to get a fresh module state (clear in-memory cache)
    vi.resetModules();
    const mod = await import('@/lib/market/dividends-agenda');
    getDividendsAgenda = mod.getDividendsAgenda;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retorna array de AgendaItem quando fetch funciona', async () => {
    mockFetchBrapiDividends.mockResolvedValue([
      { paymentDate: '2026-07-15', lastDatePrior: '2026-07-10', value: '1.50', type: 'Dividendo' },
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
      { paymentDate: '2026-08-01', lastDatePrior: '2026-07-20', value: '0.75', type: 'Juros Sobre Capital Próprio' },
    ]);

    const result = await getDividendsAgenda();
    expect(result[0].type).toBe('JCP');
  });

  it('mapeia "Dividendo" corretamente', async () => {
    mockFetchBrapiDividends.mockResolvedValue([
      { paymentDate: '2026-08-01', lastDatePrior: '2026-07-20', value: '1.00', type: 'Dividendo' },
    ]);

    const result = await getDividendsAgenda();
    expect(result[0].type).toBe('Dividendo');
  });

  it('usa data formatada pt-BR para dateCom e payment', async () => {
    mockFetchBrapiDividends.mockResolvedValue([
      { paymentDate: '2026-07-15', lastDatePrior: '2026-07-10', value: '1.00', type: 'Dividendo' },
    ]);

    const result = await getDividendsAgenda();
    // pt-BR format: 15/07/2026
    expect(result[0].dateCom).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(result[0].payment).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('usa "—" para paymentDate ausente', async () => {
    mockFetchBrapiDividends.mockResolvedValue([
      { paymentDate: null as any, lastDatePrior: null as any, value: '1.00', type: 'Dividendo' },
    ]);

    const result = await getDividendsAgenda();
    expect(result[0].dateCom).toBe('—');
    expect(result[0].payment).toBe('—');
  });

  it('calcula yieldPct como (value / price) * 100', async () => {
    mockFetchBrapiDividends.mockResolvedValue([
      { paymentDate: '2026-07-15', lastDatePrior: '2026-07-10', value: '0.50', type: 'Dividendo' },
    ]);
    mockFetchCachedMarketValue.mockResolvedValue({
      price: new Decimal('38.50'),
      currency: 'BRL',
      name: 'PETR4',
      changePercent: null,
      changeValue: null,
      isStale: false,
    });

    const result = await getDividendsAgenda();
    // (0.50 / 38.50) * 100 = 1.29870… → '1.30%'
    expect(result[0].yieldPct).toBe('1.30%');
  });

  it('usa "—" para yieldPct quando price não disponível', async () => {
    mockFetchBrapiDividends.mockResolvedValue([
      { paymentDate: '2026-07-15', lastDatePrior: '2026-07-10', value: '1.00', type: 'Dividendo' },
    ]);
    mockFetchCachedMarketValue.mockResolvedValue(null);

    const result = await getDividendsAgenda();
    expect(result[0].yieldPct).toBe('—');
  });
});
