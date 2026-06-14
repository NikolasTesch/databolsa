// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    quoteCache: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    assetFundamentalsCache: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

// Mock fetch global
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import prisma from '@/lib/prisma';
import { GET as quoteGet } from '@/app/api/market/[ticker]/quote/route';
import { GET as fundamentalsGet } from '@/app/api/market/[ticker]/fundamentals/route';
import { GET as historyGet } from '@/app/api/market/[ticker]/history/route';

const mockPrisma = prisma as unknown as {
  quoteCache: {
    findUnique: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
  assetFundamentalsCache: {
    findUnique: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
};

// TC-04: GET /api/market/TICKERINEXISTENTE/quote retorna 404
describe('GET /api/market/[ticker]/quote — TC-04', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.quoteCache.findUnique.mockResolvedValue(null);
    mockPrisma.quoteCache.upsert.mockResolvedValue({});
  });

  it('TC-04: retorna 404 quando ticker não existe e fetch falha', async () => {
    // Simular todas as fontes falhando
    mockFetch.mockRejectedValue(new Error('Network error'));

    const req = new NextRequest('http://localhost:3000/api/market/TICKER_INEXISTENTE/quote');
    const res = await quoteGet(req, { params: { ticker: 'TICKER_INEXISTENTE' } });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.message).toContain('TICKER_INEXISTENTE');
  });
});

// TC-03: GET /api/market/PETR4/fundamentals retorna campos null para ausentes
describe('GET /api/market/[ticker]/fundamentals — TC-03', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.assetFundamentalsCache.findUnique.mockResolvedValue(null);
    mockPrisma.assetFundamentalsCache.upsert.mockResolvedValue({});
  });

  it('TC-03: retorna indicadores com campos null para ausentes (mock brapi)', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{
          regularMarketPrice: 38.5,
          longName: 'Petrobras PN',
          // indicadores fundamentalistas ausentes (free tier)
          priceEarnings: null,
          dividendYield: null,
          priceToBook: 1.8,
        }],
      }),
    } as Response);

    const req = new NextRequest('http://localhost:3000/api/market/PETR4/fundamentals');
    const res = await fundamentalsGet(req, { params: { ticker: 'PETR4' } });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ticker).toBe('PETR4');
    expect(body.indicators).toBeDefined();
    // pe deve ser null (não retornado pelo free tier)
    expect(body.indicators.pe).toBeNull();
    // pb deve ter valor
    expect(body.indicators.pb).toBe('1.8');
    // Nenhum campo deve ser NaN
    const values = Object.values(body.indicators);
    for (const v of values) {
      if (v !== null) {
        expect(String(v)).not.toBe('NaN');
        expect(isNaN(Number(v))).toBe(false);
      }
    }
  });
});

// TC-05: histórico retorna valores como string decimal
describe('GET /api/market/[ticker]/history — TC-05', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TC-05: retorna series com values como string decimal, nunca float nativo', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{
          historicalDataPrice: [
            { date: 1700000000, close: 38.50123456 },
            { date: 1700086400, close: 39.1 },
            { date: 1700172800, close: 37.8999 },
          ],
        }],
      }),
    } as Response);

    const req = new NextRequest('http://localhost:3000/api/market/PETR4/history?range=1y');
    const res = await historyGet(req, { params: { ticker: 'PETR4' } });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.series).toBeDefined();
    expect(body.series.length).toBeGreaterThan(0);

    // Todos os valores de close devem ser strings
    for (const point of body.series) {
      expect(typeof point.close).toBe('string');
      expect(typeof point.date).toBe('string');
      // Garantir que é um número válido (não NaN)
      expect(isNaN(parseFloat(point.close))).toBe(false);
    }
  });

  it('TC-05b: retorna 400 para range inválido', async () => {
    const req = new NextRequest('http://localhost:3000/api/market/PETR4/history?range=invalid');
    const res = await historyGet(req, { params: { ticker: 'PETR4' } });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toContain('range inválido');
  });
});
