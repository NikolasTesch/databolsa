import { Injectable, Logger } from '@nestjs/common';
import { AssetClass, Currency, DataSource } from '@prisma/client';
import { Decimal as PrismaDecimal } from '@prisma/client/runtime/library';
import { Decimal } from 'decimal.js';
import { PrismaService } from '../../prisma.service';
import { AwesomeApiAdapter } from './adapters/awesomeapi.adapter';
import { BrapiAdapter } from './adapters/brapi.adapter';
import { CoinGeckoAdapter } from './adapters/coingecko.adapter';
import { FinnhubAdapter } from './adapters/finnhub.adapter';
import { QuoteAdapter } from './adapters/quote-adapter.interface';

export interface QuoteServiceResult {
  priceBrl: Decimal;
  isStale: boolean;
}

// Dedicated cache key for USD/BRL FX rate — stored under DataSource.BRAPI slot
const FX_SYMBOL = 'USDBRL';
const FX_SOURCE = DataSource.BRAPI;

@Injectable()
export class QuoteService {
  private readonly logger = new Logger(QuoteService.name);
  private readonly ttlMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly brapiAdapter: BrapiAdapter,
    private readonly coinGeckoAdapter: CoinGeckoAdapter,
    private readonly finnhubAdapter: FinnhubAdapter,
    private readonly awesomeApiAdapter: AwesomeApiAdapter,
  ) {
    const ttlMinutes = parseInt(
      process.env.QUOTE_CACHE_TTL_MINUTES ?? '10',
      10,
    );
    this.ttlMs = ttlMinutes * 60 * 1000;
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

  // ── Private helpers ──────────────────────────────────────────────────────────

  private async getUsdQuote(
    symbol: string,
    source: DataSource,
  ): Promise<QuoteServiceResult | null> {
    // Fetch USD price and FX rate concurrently
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

  /**
   * Core caching logic:
   * 1. Check cache — return if within TTL
   * 2. Call adapter — persist to cache and return
   * 3. On adapter failure — return stale cache value or null
   */
  private async fetchWithCache(
    symbol: string,
    source: DataSource,
    adapter: QuoteAdapter,
  ): Promise<QuoteServiceResult | null> {
    const cached = await this.getCached(symbol, source);

    if (cached && !this.isExpired(cached.fetched_at)) {
      this.logger.log(`Cache HIT: ${symbol} (${source})`);
      return {
        priceBrl: new Decimal(cached.price.toString()),
        isStale: false,
      };
    }

    try {
      const result = await adapter.fetch(symbol);
      await this.upsertCache(symbol, source, result.price, result.currency);
      this.logger.log(`Cache MISS (refreshed): ${symbol} (${source})`);
      return { priceBrl: new Decimal(result.price.toString()), isStale: false };
    } catch (err) {
      this.logger.warn(`Adapter error for ${symbol} (${source}): ${String(err)}`);
      if (cached) {
        this.logger.log(`Cache STALE: ${symbol} (${source})`);
        return {
          priceBrl: new Decimal(cached.price.toString()),
          isStale: true,
        };
      }
      return null;
    }
  }

  private async getCached(symbol: string, source: DataSource) {
    return this.prisma.quoteCache.findUnique({
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
    await this.prisma.quoteCache.upsert({
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
