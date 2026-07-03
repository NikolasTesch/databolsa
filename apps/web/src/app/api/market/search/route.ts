import { NextRequest, NextResponse } from 'next/server';
import type { AssetClass } from '@/types/api';
import { searchB3Tickers } from '@/lib/market/brapi-search.adapter';
import { CRYPTO_ID_TO_TICKER, CRYPTO_ID_TO_NAME } from '@/lib/market/curated-lists';
import { jsonError } from '@/lib/http/errors';

const CRYPTO_SEARCH: Array<{ ticker: string; name: string; assetClass: AssetClass }> = Object.entries(
  CRYPTO_ID_TO_TICKER,
).map(([, ticker]) => ({
  ticker,
  name: CRYPTO_ID_TO_NAME[Object.keys(CRYPTO_ID_TO_TICKER).find((k) => CRYPTO_ID_TO_TICKER[k] === ticker) ?? ''] ?? ticker,
  assetClass: 'CRYPTO' as AssetClass,
}));

const US_STOCKS: Array<{ ticker: string; name: string; assetClass: AssetClass }> = [
  { ticker: 'AAPL', name: 'Apple Inc.', assetClass: 'STOCK_US' },
  { ticker: 'MSFT', name: 'Microsoft Corporation', assetClass: 'STOCK_US' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', assetClass: 'STOCK_US' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', assetClass: 'STOCK_US' },
  { ticker: 'TSLA', name: 'Tesla Inc.', assetClass: 'STOCK_US' },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', assetClass: 'STOCK_US' },
  { ticker: 'META', name: 'Meta Platforms Inc.', assetClass: 'STOCK_US' },
  { ticker: 'BRK.B', name: 'Berkshire Hathaway Inc.', assetClass: 'STOCK_US' },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', assetClass: 'STOCK_US' },
  { ticker: 'V', name: 'Visa Inc.', assetClass: 'STOCK_US' },
];

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';

  if (!q) {
    return jsonError('INVALID_INPUT', 'Parâmetro q é obrigatório', 400);
  }

  if (q.length > 100) {
    return jsonError('INVALID_INPUT', 'Consulta muito longa (máx. 100 caracteres)', 400);
  }

  const upper = q.toUpperCase();
  const limit = 10;

  const [b3Results, cryptoResults, usResults] = await Promise.all([
    searchB3Tickers(q, limit),
    Promise.resolve(
      CRYPTO_SEARCH.filter(
        (c) => c.ticker.startsWith(upper) || c.name.toUpperCase().includes(upper),
      ).slice(0, limit),
    ),
    Promise.resolve(
      US_STOCKS.filter(
        (s) => s.ticker.startsWith(upper) || s.name.toUpperCase().includes(upper),
      ).slice(0, limit),
    ),
  ]);

  const combined = [...b3Results, ...cryptoResults, ...usResults];
  const seen = new Set<string>();
  const results = combined
    .filter((r) => {
      if (seen.has(r.ticker)) return false;
      seen.add(r.ticker);
      return true;
    })
    .slice(0, limit);

  return NextResponse.json({ results });
}
