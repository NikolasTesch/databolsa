import { NextRequest, NextResponse } from 'next/server';
import { Decimal } from 'decimal.js';
import { inferAssetClassForFundamentals } from '@/lib/fundamentals/fundamentals.service';

export async function GET(
  _req: NextRequest,
  { params }: { params: { ticker: string } },
) {
  const ticker = params.ticker.toUpperCase();
  const assetClass = inferAssetClassForFundamentals(ticker);

  // Crypto e ETF não têm dividendos no free tier
  if (assetClass === 'CRYPTO' || assetClass === 'ETF') {
    return NextResponse.json({ ticker, dividends: [] });
  }

  try {
    const token = process.env.BRAPI_TOKEN;
    const url = `https://brapi.dev/api/quote/${ticker}?dividends=true&token=${token ?? ''}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

    if (!response.ok) {
      return NextResponse.json({ ticker, dividends: [], stale: true });
    }

    const data = await response.json();
    const dividendsData: Array<{
      paymentDate?: string;
      rate?: number;
      type?: string;
    }> = data?.results?.[0]?.dividendsData?.cashDividends ?? [];

    const dividends = dividendsData.map((d) => ({
      paymentDate: d.paymentDate?.split('T')[0] ?? '',
      value: d.rate != null ? new Decimal(String(d.rate)).toFixed(4) : '0.0000',
      type: d.type ?? 'Dividendo',
    }));

    return NextResponse.json({ ticker, dividends });
  } catch (err) {
    console.warn(`[api] /market/${ticker}/dividends error: ${String(err)}`);
    return NextResponse.json({ ticker, dividends: [], stale: true });
  }
}
