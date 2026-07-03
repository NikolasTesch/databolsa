import { NextRequest, NextResponse } from 'next/server';
import { getEvents } from '@/lib/market/events.service';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * GET /api/market/events
 *
 * Query params:
 *  - ticker (optional): filter by symbol
 *  - type (optional): filter by event type (DIVIDEND_EX, DIVIDEND_PAYMENT, EARNINGS, MEETING, SPLIT)
 *  - from (optional): start date ISO (YYYY-MM-DD)
 *  - to (optional): end date ISO (YYYY-MM-DD)
 *  - limit (optional, default 20, max 50): max results
 *
 * Returns:
 *  { data: CorporateEvent[], total, asOf, stale }
 *
 * 400 for limit > 50 or invalid dates
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`market:events:${ip}`, {
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: 'Muitas requisições. Tente novamente em instantes.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSec) },
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker') ?? undefined;
  const type = searchParams.get('type') ?? undefined;
  const from = searchParams.get('from') ?? undefined;
  const to = searchParams.get('to') ?? undefined;
  const limitStr = searchParams.get('limit') ?? '20';
  const parsedLimit = parseInt(limitStr, 10);
  if (Number.isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
    return NextResponse.json(
      { message: 'limit deve ser um número entre 1 e 50.' },
      { status: 400 },
    );
  }
  const limit = parsedLimit;

  if (from && isNaN(Date.parse(from))) {
    return NextResponse.json(
      { message: 'from deve ser uma data ISO válida (YYYY-MM-DD).' },
      { status: 400 },
    );
  }

  if (to && isNaN(Date.parse(to))) {
    return NextResponse.json(
      { message: 'to deve ser uma data ISO válida (YYYY-MM-DD).' },
      { status: 400 },
    );
  }

  try {
    const result = await getEvents({ ticker, type, from, to, limit });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[api/market/events] error:', String(err));
    return NextResponse.json(
      { message: 'Erro ao buscar eventos corporativos.' },
      { status: 500 },
    );
  }
}
