import { NextRequest, NextResponse } from 'next/server';
import { inferAssetClassForFundamentals, getFundamentals } from '@/lib/fundamentals/fundamentals.service';
import type { AssetClass } from '@/types/api';

export async function GET(
  req: NextRequest,
  { params }: { params: { ticker: string } },
) {
  const ticker = params.ticker.toUpperCase();
  const classHint = req.nextUrl.searchParams.get('class') as AssetClass | null;

  try {
    const assetClass = classHint ?? inferAssetClassForFundamentals(ticker);
    const result = await getFundamentals(ticker, assetClass);

    return NextResponse.json({
      ticker,
      assetClass: result.assetClass,
      indicators: result.indicators,
      stale: result.stale,
      asOf: result.asOf,
    });
  } catch (err) {
    console.error(`[api] /market/${ticker}/fundamentals error: ${String(err)}`);
    return NextResponse.json({ message: `Ativo não encontrado: ${ticker}` }, { status: 404 });
  }
}
