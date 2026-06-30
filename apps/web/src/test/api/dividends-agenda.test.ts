/**
 * T12 — Testes para API de dividendos agenda:
 * - GET /api/market/dividends/agenda retorna JSON com data array (200)
 * - Retorna 503 quando não há dados
 *
 * NOTA: O teste 503 deve vir primeiro porque a route handler tem cache
 * em memória (variável cachedAgenda). Se o teste 200 executar primeiro,
 * o cache persiste e o teste 503 recebe dados antigos.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockFetchBrapiDividends = vi.hoisted(() => vi.fn());

vi.mock('@/lib/market/market-fetchers', () => ({
  fetchBrapiDividends: mockFetchBrapiDividends,
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true, retryAfterSec: 0 }),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

const { GET } = await import('@/app/api/market/dividends/agenda/route');

describe('GET /api/market/dividends/agenda', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchBrapiDividends.mockReset();
  });

  // 503 FIRST — before cache is populated by the 200 test
  it('returns 503 when no dividends available (all fetch fail)', async () => {
    mockFetchBrapiDividends.mockRejectedValue(new Error('API error'));

    const req = new NextRequest('http://localhost:3000/api/market/dividends/agenda');
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toHaveProperty('message');
    expect(body).toHaveProperty('data');
    expect(body.data).toEqual([]);
  });

  it('returns 200 with data array when dividends available', async () => {
    mockFetchBrapiDividends.mockResolvedValue([
      { paymentDate: '2026-07-15', value: '1.2300', type: 'Dividendo' },
    ]);

    const req = new NextRequest('http://localhost:3000/api/market/dividends/agenda');
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body).toHaveProperty('asOf');
    expect(body).toHaveProperty('stale');
    expect(body.stale).toBe(false);
  });
});
