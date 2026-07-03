import { NextRequest, NextResponse } from 'next/server';
import { getFundamentals } from '@/lib/fundamentals/fundamentals.service';
import { calculateDataQualityScore } from '@/lib/analysis/data-quality';
import { isValidTicker } from '@/lib/market/ticker-validation';
import { jsonError } from '@/lib/http/errors';

export async function GET(
  _req: NextRequest,
  { params }: { params: { ticker: string } },
) {
  const ticker = params.ticker.toUpperCase();

  if (!isValidTicker(ticker)) {
    return jsonError('NOT_FOUND', `Ativo nao encontrado: ${ticker}`, 404);
  }

  try {
    const fundamentals = await getFundamentals(ticker);
    const report = calculateDataQualityScore(
      fundamentals.indicators,
      fundamentals.assetClass,
      fundamentals.asOf,
    );

    return NextResponse.json({
      ticker,
      assetClass: fundamentals.assetClass,
      coverageScore: report.coverageScore,
      level: report.level,
      missingFields: report.missingFields,
      staleFields: report.staleFields,
      sourceWarnings: report.sourceWarnings,
      lastUpdatedAt: report.lastUpdatedAt,
    });
  } catch (err) {
    console.error(`[api] /market/${ticker}/data-quality error: ${String(err)}`);
    return jsonError('NOT_FOUND', `Ativo nao encontrado: ${ticker}`, 404);
  }
}
