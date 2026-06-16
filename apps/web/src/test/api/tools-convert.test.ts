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

  it('suporta CAD → BRL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        CADBRL: { bid: '4.10' },
      }),
    });

    const req = makeReq({ from: 'CAD', to: 'BRL', amount: '10' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.from).toBe('CAD');
    expect(parseFloat(body.result)).toBeCloseTo(41, 1);
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

  it('suporta DOGE → BRL e SHIB → USD', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        dogecoin: { brl: 0.85 },
      }),
    });

    const req1 = makeReq({ from: 'DOGE', to: 'BRL', amount: '100' });
    const res1 = await GET(req1);
    expect(res1.status).toBe(200);
    const body1 = await res1.json();
    expect(body1.from).toBe('DOGE');
    expect(parseFloat(body1.result)).toBeCloseTo(85, 1);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        'shiba-inu': { usd: 0.000022 },
      }),
    });

    const req2 = makeReq({ from: 'SHIB', to: 'USD', amount: '1000000' });
    const res2 = await GET(req2);
    expect(res2.status).toBe(200);
    const body2 = await res2.json();
    expect(body2.from).toBe('SHIB');
    expect(parseFloat(body2.result)).toBeCloseTo(22, 1);
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

describe('TC-04 — Degradação Graciosa com fallbackRates (RN-10)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna taxa stale de fallbackRates se a API falhar após cache miss', async () => {
    // 1. Primeira chamada: sucesso para preencher fallbackRates
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        USDBRL: { bid: '5.20' },
      }),
    });

    const req1 = makeReq({ from: 'USD', to: 'BRL', amount: '100' });
    const res1 = await GET(req1);
    expect(res1.status).toBe(200);
    const body1 = await res1.json();
    expect(body1.stale).toBe(false);
    expect(body1.rate).toBe('5.2');

    // 2. Segunda chamada: falha na API externa
    mockFetch.mockRejectedValueOnce(new Error('AwesomeAPI fora do ar'));

    // Executamos a chamada. Como a API falhou, ela deve usar o fallbackRates
    const req2 = makeReq({ from: 'USD', to: 'BRL', amount: '100' });
    const res2 = await GET(req2);

    expect(res2.status).toBe(200);
    const body2 = await res2.json();
    expect(body2.from).toBe('USD');
    expect(body2.to).toBe('BRL');
    expect(body2.rate).toBe('5.2');
    expect(body2.stale).toBe(true); // Marcado como stale!
    expect(parseFloat(body2.result)).toBeCloseTo(520, 1);
  });
});
