import { NextRequest, NextResponse } from 'next/server';
import { fetchCdiSeries } from '@/lib/market/benchmark-fetchers';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * GET /api/market/cdi
 * Retorna o CDI acumulado no período (default: 1Y).
 * Público — não requer autenticação.
 * Query params:
 *   - period: 1M | 3M | 6M | 1Y | ALL (default: 1Y)
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`market:cdi:${ip}`, { limit: 30, windowMs: 60 * 1000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: 'Muitas requisições. Tente novamente em instantes.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSec) },
      },
    );
  }

  const period = (request.nextUrl.searchParams.get('period') ?? '1Y') as '1M' | '3M' | '6M' | '1Y' | 'ALL';
  const validPeriods = ['1M', '3M', '6M', '1Y', 'ALL'];
  if (!validPeriods.includes(period)) {
    return NextResponse.json(
      { message: `Período inválido: ${period}. Use: ${validPeriods.join('|')}` },
      { status: 400 },
    );
  }

  try {
    const result = await fetchCdiSeries(period);
    const accumulatedPct = parseFloat(result.return_pct).toFixed(2);

    return NextResponse.json({
      period,
      accumulated_pct: accumulatedPct,
      series: result.series,
      as_of: new Date().toISOString(),
    });
  } catch (err) {
    console.warn(`[cdi] fetch failed: ${String(err)}`);
    return NextResponse.json(
      { message: 'CDI indisponível no momento.' },
      { status: 503 },
    );
  }
}
