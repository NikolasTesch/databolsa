// @vitest-environment node
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_FUNDAMENTALS } from '@/lib/fundamentals/fundamentals-adapter.interface';

const mockGetAssetAnalysis = vi.hoisted(() => vi.fn());

vi.mock('@/lib/analysis/asset-analysis.service', () => ({
  getAssetAnalysis: mockGetAssetAnalysis,
}));

function analysis(ticker: string, score: string, pe: string, dy: string) {
  return {
    ticker,
    name: ticker,
    assetClass: 'STOCK_BR' as const,
    sector: null,
    industry: null,
    asOf: '2026-07-02T12:00:00.000Z',
    stale: false,
    fundamentals: {
      ...EMPTY_FUNDAMENTALS,
      pe,
      dy,
      pb: '1.5',
      roe: '15',
      netMargin: '10',
      debtToEquity: '0.8',
      dailyLiquidity: '5000000',
    },
    totalScore: score,
    scoreLevel: 'positive' as const,
    breakdown: [],
    alerts: [],
    peers: [],
  };
}

describe('GET /api/market/compare', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAssetAnalysis.mockImplementation(async (ticker: string) => {
      if (ticker === 'PETR4') return analysis(ticker, '82', '8', '12');
      if (ticker === 'VALE3') return analysis(ticker, '75', '6', '8');
      if (ticker === 'ITUB4') return analysis(ticker, '90', '10', '6');
      throw new Error(`source failed for ${ticker}`);
    });
  });

  it('returns comparison data for valid tickers', async () => {
    const { GET } = await import('@/app/api/market/compare/route');
    const req = new NextRequest(
      'http://localhost/api/market/compare?tickers=PETR4,VALE3',
    );

    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.items).toHaveLength(2);
    expect(json.items.map((i: { ticker: string }) => i.ticker)).toEqual(['PETR4', 'VALE3']);
    expect(json.items[0].totalScore).toBe('82');
    expect(json.items[1].totalScore).toBe('75');
    expect(json.failedTickers).toHaveLength(0);
    expect(json.asOf).toBeDefined();
  });

  it('reports failed tickers separately', async () => {
    const { GET } = await import('@/app/api/market/compare/route');
    const req = new NextRequest(
      'http://localhost/api/market/compare?tickers=PETR4,INVALID',
    );

    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.items).toHaveLength(1);
    expect(json.items[0].ticker).toBe('PETR4');
    expect(json.failedTickers).toEqual(['INVALID']);
  });

  it('returns 400 for empty tickers', async () => {
    const { GET } = await import('@/app/api/market/compare/route');
    const req = new NextRequest('http://localhost/api/market/compare?tickers=');

    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('INVALID_INPUT');
    expect(mockGetAssetAnalysis).not.toHaveBeenCalled();
  });

  it('returns 400 for more than 6 tickers', async () => {
    const { GET } = await import('@/app/api/market/compare/route');
    const sevenTickers = 'A,B,C,D,E,F,G';
    const req = new NextRequest(
      `http://localhost/api/market/compare?tickers=${sevenTickers}`,
    );

    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('passes class hint to getAssetAnalysis', async () => {
    const { GET } = await import('@/app/api/market/compare/route');
    const req = new NextRequest(
      'http://localhost/api/market/compare?tickers=PETR4&class=FII',
    );

    const response = await GET(req);
    expect(response.status).toBe(200);

    expect(mockGetAssetAnalysis).toHaveBeenCalledWith('PETR4', 'FII');
  });

  it('uppercases all tickers', async () => {
    const { GET } = await import('@/app/api/market/compare/route');
    const req = new NextRequest(
      'http://localhost/api/market/compare?tickers=petr4,vale3',
    );

    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.items.map((i: { ticker: string }) => i.ticker)).toEqual(['PETR4', 'VALE3']);
  });
});
