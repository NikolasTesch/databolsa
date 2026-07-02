import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CryptoOverviewResult } from '@/lib/market/crypto-overview';

vi.mock('@/lib/market/market-fetchers', () => ({
  fetchCoinGeckoMulti: mockFetchCoinGeckoMulti,
}));

vi.mock('@/lib/market/market-cache', () => ({
  fetchCachedMarketValue: mockFetchCachedMarketValue,
}));

const mockFetchCoinGeckoMulti = vi.hoisted(() => vi.fn());
const mockFetchCachedMarketValue = vi.hoisted(() => vi.fn());

describe('getCryptoOverview', () => {
  let getCryptoOverview: () => Promise<CryptoOverviewResult>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import('@/lib/market/crypto-overview');
    getCryptoOverview = mod.getCryptoOverview;
  });

  it('retorna assets e trending quando CoinGecko funciona', async () => {
    mockFetchCoinGeckoMulti.mockResolvedValue({
      bitcoin: {
        price: new (await import('decimal.js')).Decimal('250000'),
        currency: 'BRL',
        changePercent: '2.5',
        volume24h: new (await import('decimal.js')).Decimal('50000000000'),
      },
    });
    mockFetchCachedMarketValue.mockResolvedValue({
      price: new (await import('decimal.js')).Decimal('250000'),
      name: 'Bitcoin',
      changePercent: '2.5',
      isStale: false,
    });

    const result = await getCryptoOverview();
    expect(result.assets.length).toBeGreaterThan(0);
    expect(result.trending.length).toBeGreaterThan(0);
    expect(result.assets[0].symbol).toBe('BTC');
    expect(result.assets[0].changePercent).toContain('+');
  });

  it('retorna arrays vazios quando CoinGecko falha', async () => {
    mockFetchCoinGeckoMulti.mockRejectedValue(new Error('API error'));

    const result = await getCryptoOverview();
    expect(result.assets).toEqual([]);
    expect(result.trending).toEqual([]);
  });
});
