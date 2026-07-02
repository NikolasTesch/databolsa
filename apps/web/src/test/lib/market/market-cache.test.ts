import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Decimal } from 'decimal.js';
import type { MarketCacheResult } from '@/lib/market/market-cache';

const mockPrisma = vi.hoisted(() => ({
  quoteCache: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  default: mockPrisma,
}));

describe('fetchCachedMarketValue', () => {
  let fetchCachedMarketValue: (
    symbol: string,
    source: string,
    ttlMs: number,
    fetcher: () => Promise<any>,
  ) => Promise<MarketCacheResult | null>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import('@/lib/market/market-cache');
    fetchCachedMarketValue = mod.fetchCachedMarketValue;
  });

  const mockFetcher = vi.fn().mockResolvedValue({
    price: new Decimal('35.50'),
    currency: 'BRL',
    name: 'PETROBRAS',
    changePercent: '1.25',
    changeValue: null,
  });

  it('retorna null quando não há cache e fetcher falha', async () => {
    mockPrisma.quoteCache.findUnique.mockResolvedValue(null);
    const fetcher = vi.fn().mockRejectedValue(new Error('API error'));

    const result = await fetchCachedMarketValue('PETR4', 'BRAPI', 5000, fetcher);
    expect(result).toBeNull();
  });

  it('retorna stale=true quando cache existe mas fetcher falha', async () => {
    mockPrisma.quoteCache.findUnique.mockResolvedValue({
      symbol: 'PETR4',
      source: 'BRAPI',
      price: '35.00',
      currency: 'BRL',
      name: 'PETROBRAS',
      changePercent: null,
      changeValue: null,
      fetched_at: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago (expired)
    });
    const fetcher = vi.fn().mockRejectedValue(new Error('API error'));

    const result = await fetchCachedMarketValue('PETR4', 'BRAPI', 5000, fetcher);
    expect(result).not.toBeNull();
    expect(result!.isStale).toBe(true);
    expect(result!.price.toString()).toBe('35');
  });

  it('usa fetcher quando cache está expirado e atualiza', async () => {
    mockPrisma.quoteCache.findUnique.mockResolvedValue({
      symbol: 'PETR4',
      source: 'BRAPI',
      price: '35.00',
      currency: 'BRL',
      name: 'PETROBRAS',
      changePercent: null,
      changeValue: null,
      fetched_at: new Date(Date.now() - 10 * 60 * 1000),
    });
    mockPrisma.quoteCache.upsert.mockResolvedValue({});

    const result = await fetchCachedMarketValue('PETR4', 'BRAPI', 5000, mockFetcher);
    expect(result).not.toBeNull();
    expect(result!.price.toString()).toBe('35.5');
    expect(result!.isStale).toBe(false);
    expect(mockPrisma.quoteCache.upsert).toHaveBeenCalledTimes(1);
  });
});
