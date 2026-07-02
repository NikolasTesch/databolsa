import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HighlightItem } from '@/lib/market/highlights-data';

const mockFetchBrapiQuote = vi.hoisted(() => vi.fn());
const mockFetchCachedMarketValue = vi.hoisted(() => vi.fn());

vi.mock('@/lib/market/market-fetchers', () => ({
  fetchBrapiQuote: mockFetchBrapiQuote,
  fetchCoinGeckoMulti: vi.fn(),
  fetchFinnhubQuote: vi.fn(),
}));

vi.mock('@/lib/market/market-cache', () => ({
  fetchCachedMarketValue: mockFetchCachedMarketValue,
}));

describe('fetchAssetsForB3', () => {
  let fetchAssetsForB3: (tickers: string[], assetClass: string) => Promise<HighlightItem[]>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import('@/lib/market/highlights-data');
    fetchAssetsForB3 = mod.fetchAssetsForB3;
  });

  it('retorna HighlightItems quando cache retorna dados', async () => {
    mockFetchCachedMarketValue.mockResolvedValue({
      price: new (await import('decimal.js')).Decimal('35.50'),
      name: 'PETROBRAS',
      currency: 'BRL',
      changePercent: '1.25',
      changeValue: null,
      isStale: false,
    });

    const result = await fetchAssetsForB3(['PETR4'], 'STOCK_BR');
    expect(result.length).toBe(1);
    expect(result[0].ticker).toBe('PETR4');
    expect(result[0].name).toBe('PETROBRAS');
    expect(result[0].assetClass).toBe('STOCK_BR');
    expect(result[0].price).toContain('R$');
    expect(result[0].changePercent).toContain('+');
    expect(result[0].stale).toBe(false);
  });

  it('filtra resultados quando cache retorna null', async () => {
    mockFetchCachedMarketValue.mockResolvedValue(null);

    const result = await fetchAssetsForB3(['PETR4'], 'STOCK_BR');
    expect(result.length).toBe(0);
  });
});


