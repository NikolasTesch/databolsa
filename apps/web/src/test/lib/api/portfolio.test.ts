import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockApiFetch = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api/client', () => ({
  apiFetch: mockApiFetch,
}));

describe('portfolio API client', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('getPortfolioSummary chama /portfolio/summary', async () => {
    mockApiFetch.mockResolvedValue({ patrimonio_total_brl: '10000', positions: [] });
    const { getPortfolioSummary } = await import('@/lib/api/portfolio');
    const result = await getPortfolioSummary();
    expect(mockApiFetch).toHaveBeenCalledWith('/portfolio/summary');
    expect(result.patrimonio_total_brl).toBe('10000');
  });

  it('getPortfolioSummary com targetUserId adiciona query param', async () => {
    mockApiFetch.mockResolvedValue({ patrimonio_total_brl: '5000', positions: [] });
    const { getPortfolioSummary } = await import('@/lib/api/portfolio');
    await getPortfolioSummary('user123');
    expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('targetUserId=user123'));
  });

  it('getBenchmark passa benchmark e period como query params', async () => {
    mockApiFetch.mockResolvedValue({ period: '1y', benchmark: 'IBOVESPA', portfolio_series: [], benchmark_series: [], portfolio_return_pct: '10', benchmark_return_pct: '8', is_stale: false });
    const { getBenchmark } = await import('@/lib/api/portfolio');
    await getBenchmark('IBOVESPA', '1y');
    expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('benchmark=IBOVESPA&period=1y'));
  });
});
