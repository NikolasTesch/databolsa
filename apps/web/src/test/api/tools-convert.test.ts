// @vitest-environment node
/**
 * SPEC-0017 — TC-01, TC-02, TC-03
 * Tests for GET /api/market/tools/convert
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the memory cache to always return null (cache miss) by default
vi.mock('@/lib/cache/memory-cache', () => ({
  createMemoryCache: () => ({
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
    has: vi.fn().mockReturnValue(false),
    delete: vi.fn(),
    clear: vi.fn(),
  }),
}));

// We test the route handler directly; external fetches are mocked via global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { GET } from '@/app/api/market/tools/convert/route';

function makeReq(params: Record<string, string>) {
  const url = new URL('http://localhost:3000/api/market/tools/convert');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url.toString());
}

describe('TC-01 — GET /api/market/tools/convert: conversão fiat (USD → BRL)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna conversão correta com AwesomeAPI mockada', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        USDBRL: { bid: '5.27' },
      }),
    });

    const req = makeReq({ from: 'USD', to: 'BRL', amount: '100' });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.from).toBe('USD');
    expect(body.to).toBe('BRL');
    expect(body.amount).toBe('100');
    expect(body.rate).toBe('5.27');
    // result = 100 * 5.27 = 527
    expect(parseFloat(body.result)).toBeCloseTo(527, 1);
    expect(body).toHaveProperty('updatedAt');
    expect(body).toHaveProperty('stale');
  });

  it('suporta EUR → BRL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        EURBRL: { bid: '5.75' },
      }),
    });

    const req = makeReq({ from: 'EUR', to: 'BRL', amount: '50' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.from).toBe('EUR');
    expect(parseFloat(body.result)).toBeCloseTo(287.5, 1);
  });

  it('suporta GBP → BRL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        GBPBRL: { bid: '6.70' },
      }),
    });

    const req = makeReq({ from: 'GBP', to: 'BRL', amount: '10' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.from).toBe('GBP');
    expect(parseFloat(body.result)).toBeCloseTo(67, 1);
  });
});

describe('TC-02 — GET /api/market/tools/convert: conversão crypto (BTC → BRL)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna conversão correta com CoinGecko mockado (BTC → BRL)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        bitcoin: { brl: 500000 },
      }),
    });

    const req = makeReq({ from: 'BTC', to: 'BRL', amount: '0.5' });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.from).toBe('BTC');
    expect(body.to).toBe('BRL');
    expect(body.rate).toBe('500000');
    expect(parseFloat(body.result)).toBeCloseTo(250000, 0);
  });

  it('suporta ETH → USD', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ethereum: { usd: 3500 },
      }),
    });

    const req = makeReq({ from: 'ETH', to: 'USD', amount: '2' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.from).toBe('ETH');
    expect(parseFloat(body.result)).toBeCloseTo(7000, 0);
  });

  it('suporta SOL → BRL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        solana: { brl: 750 },
      }),
    });

    const req = makeReq({ from: 'SOL', to: 'BRL', amount: '10' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(parseFloat(body.result)).toBeCloseTo(7500, 0);
  });
});

describe('TC-03 — Validações de inputs inválidos (retornam 400)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna 400 quando amount = 0', async () => {
    const req = makeReq({ from: 'USD', to: 'BRL', amount: '0' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('retorna 400 quando amount é negativo', async () => {
    const req = makeReq({ from: 'USD', to: 'BRL', amount: '-10' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('retorna 400 quando amount não é numérico', async () => {
    const req = makeReq({ from: 'USD', to: 'BRL', amount: 'abc' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('retorna 400 quando from é inválido/não suportado', async () => {
    const req = makeReq({ from: 'XYZ', to: 'BRL', amount: '100' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('retorna 400 quando to é inválido para fiat', async () => {
    const req = makeReq({ from: 'USD', to: 'USD', amount: '100' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('retorna 400 quando to é inválido para crypto', async () => {
    const req = makeReq({ from: 'BTC', to: 'EUR', amount: '1' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('retorna 400 quando from está ausente', async () => {
    const req = makeReq({ to: 'BRL', amount: '100' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('retorna 400 quando to está ausente', async () => {
    const req = makeReq({ from: 'USD', amount: '100' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('retorna 400 quando amount está ausente', async () => {
    const req = makeReq({ from: 'USD', to: 'BRL' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});
