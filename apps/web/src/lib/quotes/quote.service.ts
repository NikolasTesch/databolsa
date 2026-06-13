import { AssetClass, Currency, DataSource } from '@prisma/client';
import { Decimal } from 'decimal.js';
import prisma from '../prisma';
import { AwesomeApiAdapter } from './awesomeapi.adapter';
import { BrapiAdapter } from './brapi.adapter';
import { CoinGeckoAdapter } from './coingecko.adapter';
import { FinnhubAdapter } from './finnhub.adapter';
import { QuoteAdapter, QuoteResult } from './quote-adapter.interface';
import { StubQuoteAdapter } from './stub-quote.adapter';

export interface QuoteServiceResult {
  priceBrl: Decimal;
  isStale: boolean;
}

const FX_SYMBOL = 'USDBRL';
const FX_SOURCE = DataSource.BRAPI;

export class QuoteService {
  private readonly ttlMs: number;
  private readonly useStub: boolean;

  private readonly brapiAdapter = new BrapiAdapter();
  private readonly coinGeckoAdapter = new CoinGeckoAdapter();
  private readonly finnhubAdapter = new FinnhubAdapter();
  private readonly awesomeApiAdapter = new AwesomeApiAdapter();
  private readonly stubAdapter = new StubQuoteAdapter();

  constructor() {
    const ttlMinutes = parseInt(
      process.env.QUOTE_CACHE_TTL_MINUTES ?? '10',
      10,
    );
    this.ttlMs = ttlMinutes * 60 * 1000;
    this.useStub = process.env.USE_QUOTE_STUB === 'true';
  }

  async getQuote(
    symbol: string,
    assetClass: AssetClass,
    currency: Currency,
  ): Promise<QuoteServiceResult | null> {
    const source = this.resolveSource(assetClass);

    if (currency === Currency.USD) {
      return this.getUsdQuote(symbol, source);
    }

    return this.fetchWithCache(symbol, source, this.resolveAdapter(source));
  }

  private async getUsdQuote(
    symbol: string,
    source: DataSource,
  ): Promise<QuoteServiceResult | null> {
    const [priceResult, fxResult] = await Promise.all([
      this.fetchWithCache(symbol, source, this.resolveAdapter(source)),
      this.getFxRate(),
    ]);

    if (!priceResult || !fxResult) return null;

    return {
      priceBrl: priceResult.priceBrl.times(fxResult.priceBrl),
      isStale: priceResult.isStale || fxResult.isStale,
    };
  }

  private async getFxRate(): Promise<QuoteServiceResult | null> {
    return this.fetchWithCache(FX_SYMBOL, FX_SOURCE, this.awesomeApiAdapter);
  }

  private async fetchWithCache(
    symbol: string,
    source: DataSource,
    adapter: QuoteAdapter,
  ): Promise<QuoteServiceResult | null> {
    if (this.useStub) {
      try {
        const result = await this.stubAdapter.fetch(symbol);
        return { priceBrl: result.price, isStale: false };
      } catch (err) {
        console.warn(`Stub adapter error for ${symbol}: ${String(err)}`);
        return null;
      }
    }

    const cached = await this.getCached(symbol, source);

    if (cached && !this.isExpired(cached.fetched_at)) {
      console.log(`Cache HIT: ${symbol} (${source})`);
      return {
        priceBrl: new Decimal(cached.price.toString()),
        isStale: false,
      };
    }

    try {
      const result = await adapter.fetch(symbol);
      await this.upsertCache(symbol, source, result.price, result.currency);
      console.log(`Cache MISS (refreshed): ${symbol} (${source})`);
      return { priceBrl: result.price, isStale: false };
    } catch (err) {
      console.warn(`Adapter error for ${symbol} (${source}): ${String(err)}`);
      if (cached) {
        console.log(`Cache STALE: ${symbol} (${source})`);
        return {
          priceBrl: new Decimal(cached.price.toString()),
          isStale: true,
        };
      }
      return null;
    }
  }

  private async getCached(symbol: string, source: DataSource) {
    return prisma.quoteCache.findUnique({
      where: { symbol_source: { symbol, source } },
    });
  }

  private isExpired(fetchedAt: Date): boolean {
    return Date.now() - fetchedAt.getTime() > this.ttlMs;
  }

  private async upsertCache(
    symbol: string,
    source: DataSource,
    price: Decimal,
    currency: string,
  ) {
    await prisma.quoteCache.upsert({
      where: { symbol_source: { symbol, source } },
      update: { price: price.toString(), currency, fetched_at: new Date() },
      create: { symbol, source, price: price.toString(), currency },
    });
  }

  private resolveSource(assetClass: AssetClass): DataSource {
    switch (assetClass) {
      case AssetClass.CRYPTO:
        return DataSource.COINGECKO;
      case AssetClass.STOCK_US:
        return DataSource.FINNHUB;
      default:
        return DataSource.BRAPI;
    }
  }

  private resolveAdapter(source: DataSource): QuoteAdapter {
    switch (source) {
      case DataSource.COINGECKO:
        return this.coinGeckoAdapter;
      case DataSource.FINNHUB:
        return this.finnhubAdapter;
      default:
        return this.brapiAdapter;
    }
  }
}
