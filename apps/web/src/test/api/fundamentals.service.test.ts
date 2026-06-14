// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NormalizedFundamentals } from '@/lib/fundamentals/fundamentals-adapter.interface';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    assetFundamentalsCache: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

// Mock dos adapters
vi.mock('@/lib/fundamentals/brapi-fundamentals.adapter', () => ({
  BrapiFundamentalsAdapter: vi.fn().mockImplementation(() => ({
    assetClass: 'STOCK_BR',
    fetchFundamentals: vi.fn(),
  })),
}));

vi.mock('@/lib/fundamentals/finnhub-fundamentals.adapter', () => ({
  FinnhubFundamentalsAdapter: vi.fn().mockImplementation(() => ({
    assetClass: 'STOCK_US',
    fetchFundamentals: vi.fn(),
  })),
}));

vi.mock('@/lib/fundamentals/coingecko-fundamentals.adapter', () => ({
  CoinGeckoFundamentalsAdapter: vi.fn().mockImplementation(() => ({
    assetClass: 'CRYPTO',
    fetchFundamentals: vi.fn(),
  })),
}));

import prisma from '@/lib/prisma';
import { BrapiFundamentalsAdapter } from '@/lib/fundamentals/brapi-fundamentals.adapter';
import { EMPTY_FUNDAMENTALS } from '@/lib/fundamentals/fundamentals-adapter.interface';
import { getFundamentals, inferAssetClassForFundamentals } from '@/lib/fundamentals/fundamentals.service';

const mockPrisma = prisma as unknown as {
  assetFundamentalsCache: {
    findUnique: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
};

const freshCacheDate = new Date(Date.now() - 60 * 60 * 1000); // 1h atrás (válido)
const staleCacheDate = new Date(Date.now() - 8 * 60 * 60 * 1000); // 8h atrás (expirado)

const sampleFundamentals: NormalizedFundamentals = {
  ...EMPTY_FUNDAMENTALS,
  pe: '8.5',
  pb: '1.2',
  dy: '6.54',
};

describe('FundamentalsService — TC-01: cache hit', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-01: retorna dado do cache se TTL válido, sem chamar adapter', async () => {
    mockPrisma.assetFundamentalsCache.findUnique.mockResolvedValue({
      symbol: 'PETR4',
      source: 'BRAPI',
      data: sampleFundamentals,
      fetched_at: freshCacheDate,
    });

    const result = await getFundamentals('PETR4', 'STOCK_BR');

    expect(result.stale).toBe(false);
    expect(result.indicators.pe).toBe('8.5');
    // Adapter NÃO deve ser chamado
    const adapterInstance = (BrapiFundamentalsAdapter as ReturnType<typeof vi.fn>).mock.results[0]?.value;
    if (adapterInstance) {
      expect(adapterInstance.fetchFundamentals).not.toHaveBeenCalled();
    }
  });
});

describe('FundamentalsService — TC-02: stale em falha de fonte', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-02: com cache expirado e fonte falhando, serve stale com stale:true', async () => {
    // Cache existe mas está expirado
    mockPrisma.assetFundamentalsCache.findUnique.mockResolvedValue({
      symbol: 'PETR4',
      source: 'BRAPI',
      data: sampleFundamentals,
      fetched_at: staleCacheDate,
    });
    mockPrisma.assetFundamentalsCache.upsert.mockRejectedValue(new Error('DB error'));

    // Forçar o adapter a falhar
    const { BrapiFundamentalsAdapter: BrapiMock } = await import('@/lib/fundamentals/brapi-fundamentals.adapter');
    (BrapiMock as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      assetClass: 'STOCK_BR',
      fetchFundamentals: vi.fn().mockRejectedValue(new Error('Source offline')),
    }));

    const result = await getFundamentals('PETR4', 'STOCK_BR');

    expect(result.stale).toBe(true);
    expect(result.indicators.pe).toBe('8.5');
  });
});

describe('FundamentalsService — TC-10: fonte offline sem cache', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-10: fonte offline E sem cache — retorna todos null, nunca lança exceção', async () => {
    // Sem cache
    mockPrisma.assetFundamentalsCache.findUnique.mockResolvedValue(null);

    // Adapter falha
    const { BrapiFundamentalsAdapter: BrapiMock } = await import('@/lib/fundamentals/brapi-fundamentals.adapter');
    (BrapiMock as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      assetClass: 'STOCK_BR',
      fetchFundamentals: vi.fn().mockRejectedValue(new Error('Source offline')),
    }));

    let result;
    let threw = false;

    try {
      result = await getFundamentals('PETR4', 'STOCK_BR');
    } catch {
      threw = true;
    }

    expect(threw).toBe(false);
    expect(result).toBeDefined();
    expect(result!.indicators.pe).toBeNull();
    expect(result!.indicators.pb).toBeNull();

    // Nenhum valor deve ser NaN ou undefined
    const values = Object.values(result!.indicators);
    for (const v of values) {
      expect(v === null || typeof v === 'string').toBe(true);
      if (v !== null) {
        expect(String(v)).not.toBe('NaN');
      }
    }
  });
});

describe('inferAssetClassForFundamentals', () => {
  it('detecta STOCK_BR para PETR4', () => {
    expect(inferAssetClassForFundamentals('PETR4')).toBe('STOCK_BR');
  });

  it('detecta FII para MXRF11', () => {
    expect(inferAssetClassForFundamentals('MXRF11')).toBe('FII');
  });

  it('detecta ETF para BOVA11', () => {
    expect(inferAssetClassForFundamentals('BOVA11')).toBe('ETF');
  });

  it('detecta BDR para AAPL34', () => {
    expect(inferAssetClassForFundamentals('AAPL34')).toBe('BDR');
  });

  it('detecta CRYPTO para BTC', () => {
    expect(inferAssetClassForFundamentals('BTC')).toBe('CRYPTO');
  });

  it('detecta STOCK_US para AAPL', () => {
    expect(inferAssetClassForFundamentals('AAPL')).toBe('STOCK_US');
  });
});
