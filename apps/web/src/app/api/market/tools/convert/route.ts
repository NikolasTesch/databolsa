import { NextRequest, NextResponse } from 'next/server';
import { Decimal } from 'decimal.js';
import { createMemoryCache } from '@/lib/cache/memory-cache';
import { CRYPTO_TICKER_MAP } from '@/lib/quotes/ticker-map';
import prisma from '@/lib/prisma';
import { coinGeckoFetch } from '@/lib/market/coingecko-fetch';

const RATE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface RateCacheEntry {
  rate: Decimal;
  updatedAt: string;
  stale: boolean;
}

// Singleton in-memory rate cache
const rateCache = createMemoryCache<RateCacheEntry>(RATE_TTL_MS);

// Supported fiat currencies (AwesomeAPI covers any pair among these)
const SUPPORTED_FIAT = new Set(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'ARS', 'BRL']);
// Supported crypto sources (keys of CRYPTO_TICKER_MAP)
const CRYPTO_TICKERS = new Set(Object.keys(CRYPTO_TICKER_MAP));
// Supported targets for crypto
const SUPPORTED_CRYPTO_TO = new Set(['BRL', 'USD']);

// Global in-memory fallback cache is replaced by PostgreSQL database QuoteCache for persistence across restarts/serverless functions.

async function fetchFiatRate(from: string, to: string): Promise<{ rate: Decimal; stale: boolean }> {
  const cacheKey = `rate:${from}/${to}`;

  // 1. Check in-memory cache
  const cachedMem = rateCache.get(cacheKey);
  if (cachedMem) {
    console.log(`[tools.convert] in-memory cache hit for pair=${from}/${to}`);
    return { rate: cachedMem.rate, stale: cachedMem.stale };
  }

  // 2. Check database cache
  const cachedDb = await prisma.quoteCache.findUnique({
    where: { symbol_source: { symbol: `${from}${to}`, source: 'BRAPI' } },
  });
  const isExpired = cachedDb ? (Date.now() - new Date(cachedDb.fetched_at).getTime() > RATE_TTL_MS) : true;
  if (cachedDb && !isExpired) {
    console.log(`[tools.convert] database cache hit for pair=${from}/${to}`);
    const rate = new Decimal(cachedDb.price.toString());
    rateCache.set(cacheKey, {
      rate,
      updatedAt: cachedDb.fetched_at.toISOString(),
      stale: false,
    });
    return { rate, stale: false };
  }

  console.log(`[tools.convert] cache miss or expired for pair=${from}/${to}`);

  // 3. Fetch from API
  try {
    const url = `https://economia.awesomeapi.com.br/last/${from}-${to}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`AwesomeAPI returned ${res.status}`);
    const data = await res.json();
    const pairKey = `${from}${to}`;
    const bid = data?.[pairKey]?.bid;
    if (!bid) throw new Error(`No rate for ${from}-${to}`);

    const rate = new Decimal(String(bid));
    const updatedAt = new Date();

    // 4. Update database cache
    await prisma.quoteCache.upsert({
      where: { symbol_source: { symbol: `${from}${to}`, source: 'BRAPI' } },
      update: { price: rate.toString(), currency: to, fetched_at: updatedAt },
      create: { symbol: `${from}${to}`, source: 'BRAPI', price: rate.toString(), currency: to, fetched_at: updatedAt },
    });

    // 5. Update in-memory cache
    rateCache.set(cacheKey, {
      rate,
      updatedAt: updatedAt.toISOString(),
      stale: false,
    });

    return { rate, stale: false };
  } catch (err) {
    console.error(`[tools.convert] error fetching rate for ${from}/${to}: ${String(err)}`);

    // 6. Degradação graciosa (RN-10): retornar a última cotação conhecida do banco
    if (cachedDb) {
      console.warn(`[tools.convert] using database fallback rate for fiat pair=${from}/${to}`);
      return { rate: new Decimal(cachedDb.price.toString()), stale: true };
    }

    throw err;
  }
}

async function fetchCryptoRate(from: string, to: string): Promise<{ rate: Decimal; stale: boolean }> {
  const cacheKey = `rate:${from}/${to}`;

  // 1. Check in-memory cache
  const cachedMem = rateCache.get(cacheKey);
  if (cachedMem) {
    console.log(`[tools.convert] in-memory cache hit for pair=${from}/${to}`);
    return { rate: cachedMem.rate, stale: cachedMem.stale };
  }

  // 2. Check database cache
  const cachedDb = await prisma.quoteCache.findUnique({
    where: { symbol_source: { symbol: `${from}${to}`, source: 'COINGECKO' } },
  });
  const isExpired = cachedDb ? (Date.now() - new Date(cachedDb.fetched_at).getTime() > RATE_TTL_MS) : true;
  if (cachedDb && !isExpired) {
    console.log(`[tools.convert] database cache hit for pair=${from}/${to}`);
    const rate = new Decimal(cachedDb.price.toString());
    rateCache.set(cacheKey, {
      rate,
      updatedAt: cachedDb.fetched_at.toISOString(),
      stale: false,
    });
    return { rate, stale: false };
  }

  console.log(`[tools.convert] cache miss or expired for pair=${from}/${to}`);

  // 3. Fetch from API
  try {
    const coinId = CRYPTO_TICKER_MAP[from.toUpperCase()];
    if (!coinId) throw new Error(`Unknown crypto ticker: ${from}`);

    const vsCurrency = to.toLowerCase();
    const response = await coinGeckoFetch(`/simple/price?ids=${coinId}&vs_currencies=${vsCurrency}`);
    if (!response.ok) throw new Error(`CoinGecko returned ${response.status}`);
    const data = await response.json();

    const price = data?.[coinId]?.[vsCurrency];
    if (price == null) throw new Error(`No price for ${from} in ${to}`);

    const rate = new Decimal(String(price));
    const updatedAt = new Date();

    // 4. Update database cache
    await prisma.quoteCache.upsert({
      where: { symbol_source: { symbol: `${from}${to}`, source: 'COINGECKO' } },
      update: { price: rate.toString(), currency: to, fetched_at: updatedAt },
      create: { symbol: `${from}${to}`, source: 'COINGECKO', price: rate.toString(), currency: to, fetched_at: updatedAt },
    });

    // 5. Update in-memory cache
    rateCache.set(cacheKey, {
      rate,
      updatedAt: updatedAt.toISOString(),
      stale: false,
    });

    return { rate, stale: false };
  } catch (err) {
    console.error(`[tools.convert] error fetching rate for ${from}/${to}: ${String(err)}`);

    // 6. Degradação graciosa (RN-10): retornar a última cotação conhecida do banco
    if (cachedDb) {
      console.warn(`[tools.convert] using database fallback rate for crypto pair=${from}/${to}`);
      return { rate: new Decimal(cachedDb.price.toString()), stale: true };
    }

    throw err;
  }
}


/**
 * GET /api/market/tools/convert
 *
 * Query params:
 *   - from: source currency (e.g. USD, EUR, GBP, BTC, ETH, SOL)
 *   - to: target currency (e.g. BRL, USD)
 *   - amount: positive number to convert
 *
 * Returns: { from, to, amount, rate, result, updatedAt, stale }
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get('from')?.toUpperCase();
  const to = searchParams.get('to')?.toUpperCase();
  const amountRaw = searchParams.get('amount');

  // Validate required params
  if (!from || !to || !amountRaw) {
    return NextResponse.json(
      { message: 'Parâmetros obrigatórios: from, to, amount.' },
      { status: 400 },
    );
  }

  // Validate amount
  let amount: Decimal;
  try {
    amount = new Decimal(amountRaw);
    if (amount.lte(0)) throw new Error('Amount must be > 0');
  } catch {
    return NextResponse.json(
      { message: 'Parâmetro amount inválido. Deve ser um número maior que zero.' },
      { status: 400 },
    );
  }

  // Determine conversion type
  const isCrypto = CRYPTO_TICKERS.has(from);
  const isFiat = SUPPORTED_FIAT.has(from) && SUPPORTED_FIAT.has(to);

  if (isCrypto) {
    if (!SUPPORTED_CRYPTO_TO.has(to)) {
      return NextResponse.json(
        { message: `Par não suportado: ${from}/${to}. Crypto suporta: BRL, USD como destino.` },
        { status: 400 },
      );
    }

    try {
      const { rate, stale } = await fetchCryptoRate(from, to);
      const result = amount.times(rate);
      const cacheKey = `rate:${from}/${to}`;
      const cached = rateCache.get(cacheKey);

      return NextResponse.json({
        from,
        to,
        amount: amount.toString(),
        rate: rate.toString(),
        result: result.toString(),
        updatedAt: cached?.updatedAt ?? new Date().toISOString(),
        stale,
      });
    } catch {
      return NextResponse.json(
        { message: `Não foi possível obter a cotação de ${from}/${to}. Tente novamente.` },
        { status: 503 },
      );
    }
  }

  if (isFiat) {
    try {
      const { rate, stale } = await fetchFiatRate(from, to);
      const result = amount.times(rate);
      const cacheKey = `rate:${from}/${to}`;
      const cached = rateCache.get(cacheKey);

      return NextResponse.json({
        from,
        to,
        amount: amount.toString(),
        rate: rate.toString(),
        result: result.toString(),
        updatedAt: cached?.updatedAt ?? new Date().toISOString(),
        stale,
      });
    } catch {
      return NextResponse.json(
        { message: `Não foi possível obter a cotação de ${from}/${to}. Tente novamente.` },
        { status: 503 },
      );
    }
  }

  return NextResponse.json(
    { message: `Par não suportado: ${from}/${to}. Use moedas como USD, EUR, GBP, ARS, BRL para fiat, ou BTC, ETH, SOL para crypto.` },
    { status: 400 },
  );
}

