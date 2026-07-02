import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_FUNDAMENTALS } from '@/lib/fundamentals/fundamentals-adapter.interface';

const mockGetFundamentals = vi.hoisted(() => vi.fn());

vi.mock('@/lib/fundamentals/fundamentals.service', async () => {
  const actual = await vi.importActual<typeof import('@/lib/fundamentals/fundamentals.service')>(
    '@/lib/fundamentals/fundamentals.service',
  );
  return {
    ...actual,
    getFundamentals: mockGetFundamentals,
  };
});

describe('getAssetAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFundamentals.mockImplementation(async (ticker: string) => {
      if (ticker === 'PETR4') {
        return {
          indicators: {
            ...EMPTY_FUNDAMENTALS,
            pe: '8',
            pb: '1.1',
            dy: '7',
            roe: '18',
            netMargin: '15',
            debtToEquity: '0.6',
          },
          assetClass: 'STOCK_BR',
          stale: false,
          asOf: '2026-07-02T12:00:00.000Z',
        };
      }

      if (ticker === 'PETR3') {
        return {
          indicators: {
            ...EMPTY_FUNDAMENTALS,
            pe: '9',
            pb: '1.2',
            dy: '6',
            roe: '17',
            netMargin: '14',
            debtToEquity: '0.7',
          },
          assetClass: 'STOCK_BR',
          stale: true,
          asOf: '2026-07-01T12:00:00.000Z',
        };
      }

      throw new Error(`no mock for ${ticker}`);
    });
  });

  it('builds analysis with fundamentals, sector and resilient peers', async () => {
    const { getAssetAnalysis } = await import('@/lib/analysis/asset-analysis.service');

    const result = await getAssetAnalysis('PETR4', 'STOCK_BR');

    expect(mockGetFundamentals).toHaveBeenCalledWith('PETR4', 'STOCK_BR');
    expect(result.ticker).toBe('PETR4');
    expect(result.name).toBe('PETR4');
    expect(result.assetClass).toBe('STOCK_BR');
    expect(result.sector).toContain('Petr');
    expect(result.industry).toContain('Explora');
    expect(result.stale).toBe(false);
    expect(result.totalScore).not.toBe('NaN');
    expect(result.scoreLevel).toBe('positive');
    expect(result.peers).toHaveLength(1);
    expect(result.peers[0]).toMatchObject({
      ticker: 'PETR3',
      stale: true,
      asOf: '2026-07-01T12:00:00.000Z',
    });
    expect(mockGetFundamentals.mock.calls.length).toBeLessThanOrEqual(6);
  });
});
