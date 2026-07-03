import { Decimal } from 'decimal.js';
import { coinGeckoFetch } from './coingecko-fetch';

export interface MarketQuote {
  price: Decimal;
  currency: 'BRL' | 'USD';
  name: string;
  changePercent: string | null;
  changeValue: string | null;
  volume24h?: Decimal;
}

let tokenWarned = false;

function getFinnhubToken(): string {
  const token = process.env.FINNHUB_TOKEN ?? process.env.FINNHUB_KEY ?? '';
  if (!token && !tokenWarned) {
    tokenWarned = true;
    console.warn('[market-fetchers] FINNHUB_TOKEN not set — Finnhub calls will fail');
  }
  return token;
}

export async function fetchBrapiQuote(symbol: string): Promise<MarketQuote> {
  const token = process.env.BRAPI_TOKEN ?? '';
  const url = `https://brapi.dev/api/quote/${symbol}?token=${token}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`brapi returned ${response.status} for ${symbol}`);
  const data = await response.json();
  const quote = data?.results?.[0];
  if (!quote?.regularMarketPrice) throw new Error(`No price for ${symbol}`);
  return {
    price: new Decimal(String(quote.regularMarketPrice)),
    currency: 'BRL',
    name: quote.longName ?? quote.shortName ?? symbol,
    changePercent: quote.regularMarketChangePercent != null
      ? String(quote.regularMarketChangePercent)
      : null,
    changeValue: quote.regularMarketChange != null
      ? String(quote.regularMarketChange)
      : null,
  };
}

export async function fetchCoinGeckoMulti(
  coinIds: string[],
): Promise<Record<string, MarketQuote>> {
  const ids = coinIds.join(',');
  const response = await coinGeckoFetch(`/simple/price?ids=${ids}&vs_currencies=brl&include_24hr_change=true&include_24hr_vol=true`);
  if (!response.ok) throw new Error(`CoinGecko returned ${response.status}`);
  const data = await response.json();
  const result: Record<string, MarketQuote> = {};
  for (const id of coinIds) {
    if (data[id]?.brl) {
      result[id] = {
        price: new Decimal(String(data[id].brl)),
        currency: 'BRL',
        name: id,
        changePercent: data[id].brl_24h_change != null
          ? String(data[id].brl_24h_change)
          : null,
        changeValue: null,
        volume24h: data[id].brl_24h_vol != null
          ? new Decimal(String(data[id].brl_24h_vol))
          : undefined,
      };
    }
  }
  return result;
}

export async function fetchFinnhubQuote(symbol: string): Promise<MarketQuote> {
  const token = getFinnhubToken();
  const [qRes, pRes] = await Promise.allSettled([
    fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${token}`, {
      signal: AbortSignal.timeout(5000),
    }),
    fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${token}`, {
      signal: AbortSignal.timeout(5000),
    }),
  ]);

  if (qRes.status === 'rejected') throw new Error(`Finnhub quote fetch failed: ${String(qRes.reason)}`);
  const qResponse = qRes.value;
  if (!qResponse.ok) throw new Error(`Finnhub returned ${qResponse.status} for ${symbol}`);
  const qData = await qResponse.json();
  if (!qData?.c) throw new Error(`No price for ${symbol}`);

  let profileName: string = symbol;
  if (pRes.status === 'fulfilled' && pRes.value.ok) {
    try {
      const pData = await pRes.value.json();
      profileName = pData?.name ?? symbol;
    } catch {
      profileName = symbol;
    }
  }

  return {
    price: new Decimal(String(qData.c)),
    currency: 'USD',
    name: profileName,
    changePercent: qData.dp != null ? String(qData.dp) : null,
    changeValue: qData.d != null ? String(qData.d) : null,
  };
}

export async function fetchUsdBrlRate(): Promise<{ price: Decimal; changePercent: string | null }> {
  const url = 'https://economia.awesomeapi.com.br/last/USD-BRL';
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`AwesomeAPI returned ${response.status}`);
  const data = await response.json();
  const rate = data?.USDBRL?.bid;
  const pctChange = data?.USDBRL?.pctChange;
  if (!rate) throw new Error('No USD/BRL rate available');
  return {
    price: new Decimal(String(rate)),
    changePercent: pctChange != null ? String(pctChange) : null,
  };
}

export interface DividendEntry {
  paymentDate: string;
  lastDatePrior: string;
  value: string;
  type: string;
}

const dividendCache = new Map<string, { data: DividendEntry[]; expiresAt: number }>();
const DIVIDEND_TTL_MS = 60 * 60 * 1000; // 1 hora — histórico muda raramente

export async function fetchBrapiDividends(symbol: string): Promise<DividendEntry[]> {
  const cached = dividendCache.get(symbol);
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  const token = process.env.BRAPI_TOKEN ?? '';
  const url = `https://brapi.dev/api/quote/${symbol}?dividends=true&token=${token}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`brapi dividends returned ${response.status} for ${symbol}`);
  const data = await response.json();
  const cashDividends: Array<{ paymentDate?: string; rate?: number; label?: string; lastDatePrior?: string }> =
    data?.results?.[0]?.dividendsData?.cashDividends ?? [];
  const result = cashDividends.map((d) => ({
    paymentDate: d.paymentDate?.split('T')[0] ?? '',
    lastDatePrior: d.lastDatePrior?.split('T')[0] ?? '',
    value: d.rate != null ? new Decimal(String(d.rate)).toFixed(4) : '0.0000',
    type: d.label ?? 'Dividendo',
  }));
  dividendCache.set(symbol, { data: result, expiresAt: Date.now() + DIVIDEND_TTL_MS });
  return result;
}
