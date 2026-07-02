// @vitest-environment node
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_FUNDAMENTALS } from '@/lib/fundamentals/fundamentals-adapter.interface';

const mockGetAssetAnalysis = vi.hoisted(() => vi.fn());

vi.mock('@/lib/analysis/asset-analysis.service', () => ({
  getAssetAnalysis: mockGetAssetAnalysis,
}));

describe('GET /api/market/[ticker]/analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAssetAnalysis.mockResolvedValue({
      ticker: 'PETR4',
      name: 'PETR4',
      assetClass: 'STOCK_BR',
      sector: 'Energia',
      industry: 'Petroleo',
      asOf: '2026-07-02T12:00:00.000Z',
      stale: false,
      fundamentals: {
        ...EMPTY_FUNDAMENTALS,
        pe: '8',
        pb: '1.1',
      },
      totalScore: '82',
      scoreLevel: 'positive',
      breakdown: [],
      alerts: [],
      peers: [],
    });
  });

  it('returns asset analysis and passes class hint to service', async () => {
    const { GET } = await import('@/app/api/market/[ticker]/analysis/route');
    const req = new NextRequest('http://localhost/api/market/PETR4/analysis?class=STOCK_BR');

    const response = await GET(req, { params: { ticker: 'PETR4' } });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(mockGetAssetAnalysis).toHaveBeenCalledWith('PETR4', 'STOCK_BR');
    expect(json).toMatchObject({
      ticker: 'PETR4',
      totalScore: '82',
      scoreLevel: 'positive',
    });
  });

  it('returns 404 for invalid ticker', async () => {
    const { GET } = await import('@/app/api/market/[ticker]/analysis/route');
    const req = new NextRequest('http://localhost/api/market/%3Cscript%3E/analysis');

    const response = await GET(req, { params: { ticker: '<script>' } });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error.code).toBe('NOT_FOUND');
    expect(mockGetAssetAnalysis).not.toHaveBeenCalled();
  });
});
