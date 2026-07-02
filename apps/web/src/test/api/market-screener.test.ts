// @vitest-environment node
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_FUNDAMENTALS } from '@/lib/fundamentals/fundamentals-adapter.interface';

const mockGetAssetAnalysis = vi.hoisted(() => vi.fn());

vi.mock('@/lib/analysis/asset-analysis.service', () => ({
  getAssetAnalysis: mockGetAssetAnalysis,
}));

function analysis(ticker: string, score: string, dy: string, pb: string, dailyLiquidity = '2000000') {
  return {
    ticker,
    name: ticker,
    assetClass: 'FII',
    sector: 'Fundos Imobiliarios',
    industry: 'Tijolo',
    asOf: '2026-07-02T12:00:00.000Z',
    stale: false,
    fundamentals: {
      ...EMPTY_FUNDAMENTALS,
      dy,
      pb,
      dailyLiquidity,
    },
    totalScore: score,
    scoreLevel: 'positive',
    breakdown: [],
    alerts: [],
    peers: [],
  };
}

describe('GET /api/market/screener', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAssetAnalysis.mockImplementation(async (ticker: string) => {
      if (ticker === 'MXRF11') return analysis(ticker, '88', '11', '1.02');
      if (ticker === 'HGLG11') return analysis(ticker, '76', '8', '0.95');
      if (ticker === 'BCFF11') return analysis(ticker, '50', '5', '1.2');
      throw new Error(`source failed for ${ticker}`);
    });
  });

  it('applies dividend preset, filters and returns partial results', async () => {
    const { GET } = await import('@/app/api/market/screener/route');
    const req = new NextRequest(
      'http://localhost/api/market/screener?class=FII&preset=dividends&maxPb=1.1&sort=score&limit=4',
    );

    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.partial).toBe(true);
    expect(json.items.map((item: { ticker: string }) => item.ticker)).toEqual(['MXRF11', 'HGLG11']);
    expect(json.items[0].totalScore).toBe('88');
    expect(json.failedTickers.length).toBeGreaterThan(0);
  });

  it('returns 400 for invalid limit', async () => {
    const { GET } = await import('@/app/api/market/screener/route');
    const req = new NextRequest('http://localhost/api/market/screener?class=FII&limit=101');

    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('INVALID_INPUT');
    expect(mockGetAssetAnalysis).not.toHaveBeenCalled();
  });
});
