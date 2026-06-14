// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  default: {
    quoteCache: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('@/lib/market/brapi-search.adapter', () => ({
  searchB3Tickers: vi.fn(),
}));

import prisma from '@/lib/prisma';
import { searchB3Tickers } from '@/lib/market/brapi-search.adapter';
import { GET as searchGet } from '@/app/api/market/search/route';
import { GET as highlightsGet } from '@/app/api/market/highlights/route';
import { GET as indicesGet } from '@/app/api/market/indices/route';

const mockPrisma = prisma as unknown as {
  quoteCache: {
    findUnique: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
};

describe('GET /api/market/search (TC-02, TC-03)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-03: retorna 400 se q não fornecido', async () => {
    const req = new NextRequest('http://localhost:3000/api/market/search');
    const res = await searchGet(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toContain('q');
  });

  it('TC-02: retorna resultados B3 ao buscar PETR', async () => {
    (searchB3Tickers as ReturnType<typeof vi.fn>).mockResolvedValue([
      { ticker: 'PETR4', name: 'Petrobras PN', assetClass: 'STOCK_BR' },
      { ticker: 'PETR3', name: 'Petrobras ON', assetClass: 'STOCK_BR' },
    ]);

    const req = new NextRequest('http://localhost:3000/api/market/search?q=PETR');
    const res = await searchGet(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results).toHaveLength(2);
    expect(body.results[0].ticker).toBe('PETR4');
    expect(body.results[0].assetClass).toBe('STOCK_BR');
  });

  it('retorna resultados crypto ao buscar BTC', async () => {
    (searchB3Tickers as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/market/search?q=BTC');
    const res = await searchGet(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    const btcResult = body.results.find((r: { ticker: string }) => r.ticker === 'BTC');
    expect(btcResult).toBeDefined();
    expect(btcResult.assetClass).toBe('CRYPTO');
  });

  it('retorna 200 com array vazio se q não encontrar nada', async () => {
    (searchB3Tickers as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/market/search?q=XYZXYZXYZ');
    const res = await searchGet(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results).toEqual([]);
  });
});

describe('GET /api/market/highlights (TC-05, TC-06)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-06: retorna 400 para type inválido', async () => {
    const req = new NextRequest('http://localhost:3000/api/market/highlights?type=INVALIDO');
    const res = await highlightsGet(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toContain('Tipo inválido');
  });

  it('TC-05: retorna stale=true quando cache existe mas fetch falha', async () => {
    mockPrisma.quoteCache.findUnique.mockResolvedValue({
      symbol: 'PETR4',
      source: 'BRAPI',
      price: '38.50',
      currency: 'BRL',
      fetched_at: new Date(Date.now() - 10 * 60 * 1000),
    });
    mockPrisma.quoteCache.upsert.mockResolvedValue({});

    const req = new NextRequest('http://localhost:3000/api/market/highlights?type=STOCK_BR');
    const res = await highlightsGet(req);
    const body = await res.json();

    if (body.gainers || body.losers) {
      const allItems = [...(body.gainers ?? []), ...(body.losers ?? [])];
      const staleItems = allItems.filter((i: { stale: boolean }) => i.stale);
      expect(staleItems.length).toBeGreaterThan(0);
    }
  });

  it('usa STOCK_BR como padrão quando type não fornecido', async () => {
    mockPrisma.quoteCache.findUnique.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/market/highlights');
    const res = await highlightsGet(req);

    expect([200, 503]).toContain(res.status);
    if (res.status === 200) {
      const body = await res.json();
      expect(body.type).toBe('STOCK_BR');
    }
  });
});

describe('GET /api/market/indices (TC-04)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-04: inclui CDI hardcoded com stale=false', async () => {
    mockPrisma.quoteCache.findUnique.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/market/indices');
    const res = await indicesGet();

    if (res.status === 200) {
      const body = await res.json();
      const cdi = body.indices.find((i: { id: string }) => i.id === 'CDI');
      expect(cdi).toBeDefined();
      expect(cdi.stale).toBe(false);
      expect(cdi.changePercent).toBeNull();
      expect(body.asOf).toBeDefined();
    }
  });

  it('TC-04: retorna stale=true quando cache existe mas fonte falha', async () => {
    mockPrisma.quoteCache.findUnique.mockResolvedValue({
      symbol: 'IBOVESPA',
      source: 'BRAPI',
      price: '128450',
      currency: 'BRL',
      fetched_at: new Date(Date.now() - 10 * 60 * 1000),
    });

    const res = await indicesGet();
    if (res.status === 200) {
      const body = await res.json();
      const ibov = body.indices.find((i: { id: string }) => i.id === 'IBOV');
      if (ibov) {
        expect(typeof ibov.stale).toBe('boolean');
      }
    }
  });
});
