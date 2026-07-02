import { NextRequest, NextResponse } from 'next/server';
import type { AssetClass } from '@/types/api';
import { getAssetAnalysis } from '@/lib/analysis/asset-analysis.service';
import { jsonError } from '@/lib/http/errors';
import { isValidTicker } from '@/lib/market/ticker-validation';

export async function GET(
  req: NextRequest,
  { params }: { params: { ticker: string } },
) {
  const ticker = params.ticker.toUpperCase();

  if (!isValidTicker(ticker)) {
    return jsonError('NOT_FOUND', `Ativo nao encontrado: ${ticker}`, 404);
  }

  const classHint = req.nextUrl.searchParams.get('class') as AssetClass | null;

  try {
    const analysis = await getAssetAnalysis(ticker, classHint ?? undefined);
    return NextResponse.json(analysis);
  } catch (err) {
    console.error(`[api] /market/${ticker}/analysis error: ${String(err)}`);
    return jsonError('NOT_FOUND', `Ativo nao encontrado: ${ticker}`, 404);
  }
}
