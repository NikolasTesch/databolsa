import { AssetClass, Currency, DataSource } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { QuoteService } from './quote.service';

function prismaDecimal(value: string) {
  return { toString: () => value } as any;
}

function makeCachedQuote(symbol: string, source: DataSource, price: string, ageMs = 0) {
  return {
    id: 'cache-id',
    symbol,
    source,
    price: prismaDecimal(price),
    currency: 'BRL',
    fetched_at: new Date(Date.now() - ageMs),
  };
}

describe('QuoteService', () => {
  let service: QuoteService;
  let prisma: { quoteCache: { findUnique: jest.Mock; upsert: jest.Mock } };
  let brapiAdapter: { fetch: jest.Mock };
  let coinGeckoAdapter: { fetch: jest.Mock };
  let finnhubAdapter: { fetch: jest.Mock };
  let awesomeApiAdapter: { fetch: jest.Mock };

  const TTL_MS = 10 * 60 * 1000; // 10 minutes, matching default

  beforeEach(() => {
    process.env.QUOTE_CACHE_TTL_MINUTES = '10';

    prisma = {
      quoteCache: {
        findUnique: jest.fn(),
        upsert: jest.fn().mockResolvedValue({}),
      },
    };
    brapiAdapter = { fetch: jest.fn() };
    coinGeckoAdapter = { fetch: jest.fn() };
    finnhubAdapter = { fetch: jest.fn() };
    awesomeApiAdapter = { fetch: jest.fn() };

    service = new QuoteService(
      prisma as any,
      brapiAdapter as any,
      coinGeckoAdapter as any,
      finnhubAdapter as any,
      awesomeApiAdapter as any,
    );
  });

  afterEach(() => jest.clearAllMocks());

  describe('TC-01: cache hit', () => {
    it('should return cached value and NOT call adapter when cache is within TTL', async () => {
      // Cache is fresh (fetched 1 minute ago)
      prisma.quoteCache.findUnique.mockResolvedValue(
        makeCachedQuote('PETR4', DataSource.BRAPI, '35.50', 60_000),
      );

      const result = await service.getQuote('PETR4', AssetClass.STOCK_BR, Currency.BRL);

      expect(brapiAdapter.fetch).not.toHaveBeenCalled();
      expect(result).not.toBeNull();
      expect(result!.isStale).toBe(false);
      expect(result!.priceBrl.toFixed(2)).toBe('35.50');
    });
  });

  describe('TC-02: cache miss', () => {
    it('should call adapter and upsert cache when no cache exists', async () => {
      prisma.quoteCache.findUnique.mockResolvedValue(null);
      brapiAdapter.fetch.mockResolvedValue({
        price: new Decimal('35.75'),
        currency: 'BRL',
      });

      const result = await service.getQuote('PETR4', AssetClass.STOCK_BR, Currency.BRL);

      expect(brapiAdapter.fetch).toHaveBeenCalledWith('PETR4');
      expect(prisma.quoteCache.upsert).toHaveBeenCalled();
      expect(result).not.toBeNull();
      expect(result!.isStale).toBe(false);
      expect(result!.priceBrl.toFixed(2)).toBe('35.75');
    });

    it('should call adapter and upsert cache when cache is expired', async () => {
      // Cache expired (fetched 20 minutes ago, TTL is 10 min)
      prisma.quoteCache.findUnique.mockResolvedValue(
        makeCachedQuote('PETR4', DataSource.BRAPI, '35.00', 20 * 60_000),
      );
      brapiAdapter.fetch.mockResolvedValue({
        price: new Decimal('36.00'),
        currency: 'BRL',
      });

      const result = await service.getQuote('PETR4', AssetClass.STOCK_BR, Currency.BRL);

      expect(brapiAdapter.fetch).toHaveBeenCalledWith('PETR4');
      expect(result!.priceBrl.toFixed(2)).toBe('36.00');
      expect(result!.isStale).toBe(false);
    });
  });

  describe('TC-03: stale cache on adapter failure', () => {
    it('should return stale cache with is_stale=true when adapter throws and cache exists', async () => {
      // Cache expired
      prisma.quoteCache.findUnique.mockResolvedValue(
        makeCachedQuote('PETR4', DataSource.BRAPI, '35.00', 20 * 60_000),
      );
      brapiAdapter.fetch.mockRejectedValue(new Error('503 Service Unavailable'));

      const result = await service.getQuote('PETR4', AssetClass.STOCK_BR, Currency.BRL);

      expect(result).not.toBeNull();
      expect(result!.isStale).toBe(true);
      expect(result!.priceBrl.toFixed(2)).toBe('35.00');
    });

    it('should return null when adapter throws and no cache exists', async () => {
      prisma.quoteCache.findUnique.mockResolvedValue(null);
      brapiAdapter.fetch.mockRejectedValue(new Error('503 Service Unavailable'));

      const result = await service.getQuote('PETR4', AssetClass.STOCK_BR, Currency.BRL);

      expect(result).toBeNull();
    });
  });

  describe('TC-04: USD to BRL conversion', () => {
    it('should return priceBrl = usdPrice * fxRate for USD assets', async () => {
      // Finnhub returns USD price; AwesomeAPI returns FX rate
      // Both are cache misses, so adapters are called
      prisma.quoteCache.findUnique.mockResolvedValue(null);
      finnhubAdapter.fetch.mockResolvedValue({
        price: new Decimal('200.00'),
        currency: 'USD',
      });
      awesomeApiAdapter.fetch.mockResolvedValue({
        price: new Decimal('5.00'),
        currency: 'BRL',
      });

      const result = await service.getQuote('AAPL', AssetClass.STOCK_US, Currency.USD);

      expect(finnhubAdapter.fetch).toHaveBeenCalledWith('AAPL');
      expect(awesomeApiAdapter.fetch).toHaveBeenCalled();
      expect(result).not.toBeNull();
      // 200 USD * 5.00 BRL/USD = 1000 BRL
      expect(result!.priceBrl.toFixed(2)).toBe('1000.00');
      expect(result!.isStale).toBe(false);
    });

    it('should return null when FX rate is unavailable and no FX cache exists', async () => {
      prisma.quoteCache.findUnique.mockResolvedValue(null);
      finnhubAdapter.fetch.mockResolvedValue({
        price: new Decimal('200.00'),
        currency: 'USD',
      });
      awesomeApiAdapter.fetch.mockRejectedValue(new Error('FX unavailable'));

      const result = await service.getQuote('AAPL', AssetClass.STOCK_US, Currency.USD);

      expect(result).toBeNull();
    });

    it('should mark isStale=true when FX rate is stale', async () => {
      // AAPL price: fresh cache
      // FX rate: expired cache + adapter failure → stale
      prisma.quoteCache.findUnique
        .mockResolvedValueOnce(makeCachedQuote('AAPL', DataSource.FINNHUB, '200.00', 60_000))
        .mockResolvedValueOnce(makeCachedQuote('USDBRL', DataSource.BRAPI, '5.00', 20 * 60_000));

      finnhubAdapter.fetch.mockRejectedValue(new Error('timeout'));
      awesomeApiAdapter.fetch.mockRejectedValue(new Error('timeout'));

      const result = await service.getQuote('AAPL', AssetClass.STOCK_US, Currency.USD);

      expect(result).not.toBeNull();
      expect(result!.isStale).toBe(true);
      expect(result!.priceBrl.toFixed(2)).toBe('1000.00');
    });
  });

  describe('TC-05: adapter routing', () => {
    it('should use CoinGeckoAdapter for CRYPTO assets', async () => {
      prisma.quoteCache.findUnique.mockResolvedValue(null);
      coinGeckoAdapter.fetch.mockResolvedValue({
        price: new Decimal('250000.00'),
        currency: 'BRL',
      });

      await service.getQuote('BTC', AssetClass.CRYPTO, Currency.BRL);

      expect(coinGeckoAdapter.fetch).toHaveBeenCalledWith('BTC');
      expect(brapiAdapter.fetch).not.toHaveBeenCalled();
    });

    it('should use FinnhubAdapter for STOCK_US assets (BRL currency edge case)', async () => {
      prisma.quoteCache.findUnique.mockResolvedValue(null);
      finnhubAdapter.fetch.mockResolvedValue({
        price: new Decimal('150.00'),
        currency: 'USD',
      });

      // STOCK_US with BRL currency (not typical but tests routing)
      await service.getQuote('MSFT', AssetClass.STOCK_US, Currency.BRL);

      expect(finnhubAdapter.fetch).toHaveBeenCalledWith('MSFT');
      expect(brapiAdapter.fetch).not.toHaveBeenCalled();
    });
  });
});
