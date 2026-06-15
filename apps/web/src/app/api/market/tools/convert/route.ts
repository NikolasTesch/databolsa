import { NextRequest, NextResponse } from 'next/server';
import { Decimal } from 'decimal.js';
import { createMemoryCache } from '@/lib/cache/memory-cache';
import { CRYPTO_TICKER_MAP } from '@/lib/quotes/ticker-map';

const RATE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface RateCacheEntry {
  rate: Decimal;
  updatedAt: string;
  stale: boolean;
}

// Singleton in-memory rate cache
const rateCache = createMemoryCache<RateCacheEntry>(RATE_TTL_MS);

// Supported fiat pairs: from → BRL via AwesomeAPI
const SUPPORTED_FIAT_FROM = new Set(['USD', 'EUR', 'GBP']);
// Supported crypto sources (keys of CRYPTO_TICKER_MAP)
const CRYPTO_TICKERS = new Set(Object.keys(CRYPTO_TICKER_MAP));
// Supported targets for crypto
const SUPPORTED_CRYPTO_TO = new Set(['BRL', 'USD']);

async function fetchFiatRate(from: string, to: string): Promise<{ rate: Decimal; stale: boolean }> {
  const cacheKey = `rate:${from}/${to}`;

  const cached = rateCache.get(cacheKey);
  if (cached) {
    console.log(`[tools.convert] cache hit for pair=${from}/${to}`);
    return { rate: cached.rate, stale: cached.stale };
  }

  console.log(`[tools.convert] cache miss for pair=${from}/${to}`);

  try {
    const url = `https://economia.awesomeapi.com.br/last/${from}-${to}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`AwesomeAPI returned ${res.status}`);
    const data = await res.json();
    const pairKey = `${from}${to}`;
    const bid = data?.[pairKey]?.bid;
    if (!bid) throw new Error(`No rate for ${from}-${to}`);

    const rate = new Decimal(String(bid));
    const entry: RateCacheEntry = {
      rate,
      updatedAt: new Date().toISOString(),
      stale: false,
    };
    rateCache.set(cacheKey, entry);
    return { rate, stale: false };
  } catch (err) {
    console.error(`[tools.convert] error fetching rate for ${from}/${to}: ${String(err)}`);

    // Return a stale value if we have one in cache — but the TTL expired just now
    // Since we can't access expired entries, we signal unavailability
    throw err;
  }
}

async function fetchCryptoRate(from: string, to: string): Promise<{ rate: Decimal; stale: boolean }> {
  const cacheKey = `rate:${from}/${to}`;

  const cached = rateCache.get(cacheKey);
  if (cached) {
    console.log(`[tools.convert] cache hit for pair=${from}/${to}`);
    return { rate: cached.rate, stale: cached.stale };
  }

  console.log(`[tools.convert] cache miss for pair=${from}/${to}`);

  try {
    const coinId = CRYPTO_TICKER_MAP[from.toUpperCase()];
    if (!coinId) throw new Error(`Unknown crypto ticker: ${from}`);

    const vsCurrency = to.toLowerCase();
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${vsCurrency}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`CoinGecko returned ${res.status}`);
    const data = await res.json();

    const price = data?.[coinId]?.[vsCurrency];
    if (price == null) throw new Error(`No price for ${from} in ${to}`);

    const rate = new Decimal(String(price));
    const entry: RateCacheEntry = {
      rate,
      updatedAt: new Date().toISOString(),
      stale: false,
    };
    rateCache.set(cacheKey, entry);
    return { rate, stale: false };
  } catch (err) {
    console.error(`[tools.convert] error fetching rate for ${from}/${to}: ${String(err)}`);
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
  const isFiat = SUPPORTED_FIAT_FROM.has(from);

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
    if (to !== 'BRL') {
      return NextResponse.json(
        { message: `Par não suportado: ${from}/${to}. Fiat suporta apenas destino BRL.` },
        { status: 400 },
      );
    }

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
    { message: `Par não suportado: ${from}/${to}. Use USD, EUR, GBP para fiat ou BTC, ETH, SOL para crypto.` },
    { status: 400 },
  );
}

/** Expose cache for testing — do not use in production code */
export { rateCache as _rateCache };
