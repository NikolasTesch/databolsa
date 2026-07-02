import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api/client', () => ({
  apiFetch: mockApiFetch,
}));

const mockApiFetch = vi.hoisted(() => vi.fn());

describe('assets API client', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('listAssets chama apiFetch com /assets', async () => {
    mockApiFetch.mockResolvedValue({ data: [{ id: '1', ticker: 'PETR4' }] });
    const { listAssets } = await import('@/lib/api/assets');
    const result = await listAssets();
    expect(mockApiFetch).toHaveBeenCalledWith('/assets');
    expect(result).toHaveLength(1);
    expect(result[0].ticker).toBe('PETR4');
  });

  it('getAsset chama apiFetch com /assets/:id', async () => {
    mockApiFetch.mockResolvedValue({ id: '1', ticker: 'PETR4' });
    const { getAsset } = await import('@/lib/api/assets');
    const result = await getAsset('1');
    expect(mockApiFetch).toHaveBeenCalledWith('/assets/1');
    expect(result.ticker).toBe('PETR4');
  });

  it('createAsset chama apiFetch POST', async () => {
    mockApiFetch.mockResolvedValue({ id: '2', ticker: 'VALE3' });
    const { createAsset } = await import('@/lib/api/assets');
    const result = await createAsset({ ticker: 'VALE3', name: 'Vale', asset_class: 'STOCK_BR', currency: 'BRL', data_source: 'BRAPI' });
    expect(mockApiFetch).toHaveBeenCalledWith('/assets', expect.objectContaining({ method: 'POST' }));
    expect(result.ticker).toBe('VALE3');
  });
});
