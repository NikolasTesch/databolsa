import { NextRequest, NextResponse } from 'next/server';
import { Decimal } from 'decimal.js';
import { inferAssetClassForFundamentals } from '@/lib/fundamentals/fundamentals.service';
import { CRYPTO_TICKER_MAP } from '@/lib/quotes/ticker-map';
import { coinGeckoFetch } from '@/lib/market/coingecko-fetch';

type Range = '1d' | '1w' | '15d' | '1m' | '6m' | '1y' | '5y';

const VALID_RANGES = new Set<string>(['1d', '1w', '15d', '1m', '6m', '1y', '5y']);

const RANGE_TO_BRAPI: Record<Range, string> = {
  '1d': '1d',
  '1w': '5d',
  // Brapi não suporta '15d'; buscamos '1mo' e truncamos no servidor
  '15d': '1mo',
  '1m': '1mo',
  '6m': '6mo',
  '1y': '1y',
  '5y': '5y',
};

const RANGE_TO_DAYS: Record<Range, number> = {
  '1d': 1,
  '1w': 7,
  '15d': 15,
  '1m': 30,
  '6m': 180,
  '1y': 365,
  '5y': 1825,
};

async function fetchBrapiHistory(symbol: string, range: Range) {
  const token = process.env.BRAPI_TOKEN;
  const interval = range === '1d' ? '15m' : '1d';
  const period = RANGE_TO_BRAPI[range];
  const url = `https://brapi.dev/api/quote/${symbol}?range=${period}&interval=${interval}&token=${token ?? ''}`;

  console.debug(`[brapi] GET ${url.replace(token ?? '', '***')}`);
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  console.debug(`[brapi] response status ${response.status}`);
  if (!response.ok) throw new Error(`brapi returned ${response.status}`);
  const data = await response.json();
  console.debug(`[brapi] results count: ${data?.results?.length}, has historicalDataPrice: ${!!data?.results?.[0]?.historicalDataPrice}`);
  const prices: Array<{ date: string; close: number }> = data?.results?.[0]?.historicalDataPrice ?? [];

  const mapped = prices.map((p) => ({
    date: typeof p.date === 'number'
      ? new Date(p.date * 1000).toISOString().split('T')[0]
      : String(p.date).split('T')[0],
    close: new Decimal(String(p.close)).toFixed(2),
  }));

  // Para o range '15d', buscamos 1mo na Brapi e truncamos para os últimos 15 pontos
  if (range === '15d') {
    return mapped.slice(-15);
  }

  return mapped;
}

async function fetchCoinGeckoHistory(symbol: string, range: Range) {
  const coinId = CRYPTO_TICKER_MAP[symbol.toUpperCase()];
  if (!coinId) throw new Error(`Unknown crypto: ${symbol}`);

  const days = RANGE_TO_DAYS[range];

  console.debug(`[coingecko] fetching market_chart for ${coinId}, days=${days}`);
  const response = await coinGeckoFetch(`/coins/${coinId}/market_chart?vs_currency=brl&days=${days}&interval=daily`);
  console.debug(`[coingecko] response status ${response.status}`);
  if (!response.ok) throw new Error(`CoinGecko returned ${response.status}`);
  const data = await response.json();

  // prices é array de [timestamp_ms, price]
  const prices: Array<[number, number]> = data?.prices ?? [];
  console.debug(`[coingecko] prices count: ${prices.length}`);
  return prices.map(([ts, price]) => ({
    date: new Date(ts).toISOString().split('T')[0],
    close: new Decimal(String(price)).toFixed(8),
  }));
}

async function fetchFinnhubHistory(symbol: string, range: Range) {
  const token = process.env.FINNHUB_TOKEN ?? process.env.FINNHUB_KEY;
  const days = RANGE_TO_DAYS[range];
  const to = Math.floor(Date.now() / 1000);
  const from = to - days * 86400;
  // 1d = 30-min candles, 1w = daily, 15d+ = daily
  const resolution = range === '1d' ? '30' : 'D';
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${token ?? ''}`;

  console.debug(`[finnhub] GET ${url.replace(token ?? '', '***')}`);
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  console.debug(`[finnhub] response status ${response.status}`);
  if (!response.ok) throw new Error(`Finnhub returned ${response.status}`);
  const data = await response.json();

  if (data.s !== 'ok' || !data.t) {
    console.debug(`[finnhub] response s=${data.s}, has t=${!!data.t}`);
    return [];
  }

  const timestamps: number[] = data.t;
  const closes: number[] = data.c;
  console.debug(`[finnhub] candles count: ${timestamps.length}`);

  return timestamps.map((ts, i) => ({
    date: new Date(ts * 1000).toISOString().split('T')[0],
    close: new Decimal(String(closes[i])).toFixed(2),
  }));
}

export async function GET(
  req: NextRequest,
  { params }: { params: { ticker: string } },
) {
  const ticker = params.ticker.toUpperCase();
  const rangeParam = req.nextUrl.searchParams.get('range') ?? '1y';

  if (!VALID_RANGES.has(rangeParam)) {
    return NextResponse.json(
      { message: `range inválido: ${rangeParam}. Use 1d, 1w, 15d, 1m, 6m, 1y ou 5y` },
      { status: 400 },
    );
  }

  const range = rangeParam as Range;
  const assetClass = inferAssetClassForFundamentals(ticker);

  try {
    let series: Array<{ date: string; close: string }>;

    if (assetClass === 'CRYPTO') {
      series = await fetchCoinGeckoHistory(ticker, range);
    } else if (assetClass === 'STOCK_US') {
      series = await fetchFinnhubHistory(ticker, range);
    } else {
      series = await fetchBrapiHistory(ticker, range);
    }

    return NextResponse.json({
      ticker,
      range,
      series,
    });
  } catch (err) {
    console.warn(`[api] /market/${ticker}/history error: ${String(err)}`);
    return NextResponse.json({
      ticker,
      range,
      series: [],
      stale: true,
    });
  }
}
