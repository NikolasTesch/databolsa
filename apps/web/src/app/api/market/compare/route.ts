import { NextRequest, NextResponse } from 'next/server';
import type { AssetClass } from '@/types/api';
import { getAssetAnalysis } from '@/lib/analysis/asset-analysis.service';
import { jsonError } from '@/lib/http/errors';

const MAX_TICKERS = 6;

function parseAssetClass(raw: string | null): AssetClass | undefined {
  if (!raw) return undefined;
  const upper = raw.toUpperCase() as AssetClass;
  const valid: AssetClass[] = ['STOCK_BR', 'FII', 'ETF', 'BDR', 'STOCK_US', 'CRYPTO'];
  return valid.includes(upper) ? upper : undefined;
}

export async function GET(req: NextRequest) {
  const rawTickers = req.nextUrl.searchParams.get('tickers') ?? '';
  const classHint = parseAssetClass(req.nextUrl.searchParams.get('class'));

  const tickers = rawTickers
    .split(',')
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);

  if (tickers.length === 0) {
    return jsonError('INVALID_INPUT', 'Informe ao menos um ticker.', 400);
  }

  if (tickers.length > MAX_TICKERS) {
    return jsonError('INVALID_INPUT', `Máximo de ${MAX_TICKERS} tickers por comparação.`, 400);
  }

  const settled = await Promise.allSettled(
    tickers.map((ticker) => getAssetAnalysis(ticker, classHint)),
  );

  const items = settled.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : [],
  );

  const failedTickers = settled.flatMap((result, index) =>
    result.status === 'rejected' ? [tickers[index]] : [],
  );

  return NextResponse.json({
    items,
    failedTickers,
    asOf: new Date().toISOString(),
  });
}
