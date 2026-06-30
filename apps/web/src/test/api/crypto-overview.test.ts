/**
 * T12 — Testes para API de crypto overview:
 * - GET /api/market/crypto/overview retorna JSON com data e trending arrays (200)
 * - Retorna 503 quando não há dados de cripto
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Decimal } from 'decimal.js';
import { NextRequest } from 'next/server';

const mockFetchCoinGeckoMulti = vi.hoisted(() => vi.fn());
const mockFetchCachedMarketValue = vi.hoisted(() => vi.fn());

vi.mock('@/lib/market/market-fetchers', () => ({
  fetchCoinGeckoMulti: mockFetchCoinGeckoMulti,
}));

vi.mock('@/lib/market/market-cache', () => ({
  fetchCachedMarketValue: mockFetchCachedMarketValue,
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true, retryAfterSec: 0 }),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

const { GET } = await import('@/app/api/market/crypto/overview/route');

describe('GET /api/market/crypto/overview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchCoinGeckoMulti.mockReset();
    mockFetchCachedMarketValue.mockReset();
  });

  it('returns 200 with data and trending arrays', async () => {
    // Must provide data for ALL crypto assets in CURATED_LISTS.CRYPTO
    // to avoid the fetcher callback throwing 'No data for coinId'
    const mockCoinData = {
      bitcoin: {
        price: new Decimal('350000'), currency: 'BRL', changePercent: '2.5',
        changeValue: null, volume24h: new Decimal('50000000000'),
      },
      ethereum: {
        price: new Decimal('15000'), currency: 'BRL', changePercent: '-1.2',
        changeValue: null, volume24h: new Decimal('20000000000'),
      },
      tether: {
        price: new Decimal('6.05'), currency: 'BRL', changePercent: '0.0',
        changeValue: null, volume24h: new Decimal('100000000000'),
      },
      solana: {
        price: new Decimal('800.00'), currency: 'BRL', changePercent: '5.3',
        changeValue: null, volume24h: new Decimal('15000000000'),
      },
      binancecoin: {
        price: new Decimal('2500.00'), currency: 'BRL', changePercent: '-0.8',
        changeValue: null, volume24h: new Decimal('8000000000'),
      },
    };

    mockFetchCoinGeckoMulti.mockResolvedValue(mockCoinData);

    // fetchCachedMarketValue must handle fetcher success/failure gracefully
    mockFetchCachedMarketValue.mockImplementation(
      async (_ticker, _source, _ttl, fetcher) => {
        try {
          const result = await fetcher();
          return { ...result, isStale: false };
        } catch {
          return null;
        }
      },
    );

    const req = new NextRequest('http://localhost:3000/api/market/crypto/overview');
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('trending');
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(Array.isArray(body.trending)).toBe(true);
    expect(body).toHaveProperty('asOf');
  });

  it('returns 503 when fetchCoinGeckoMulti fails', async () => {
    mockFetchCoinGeckoMulti.mockRejectedValue(new Error('CoinGecko API error'));

    const req = new NextRequest('http://localhost:3000/api/market/crypto/overview');
    const response = await GET(req);

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body).toHaveProperty('data');
    expect(body.data).toEqual([]);
    expect(body).toHaveProperty('trending');
    expect(body.trending).toEqual([]);
  });
});
