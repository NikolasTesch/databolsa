import { NextRequest, NextResponse } from 'next/server';
import { fetchBrapiDividends } from '@/lib/market/market-fetchers';
import { CURATED_LISTS } from '@/lib/market/curated-lists';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

interface AgendaItem {
  ticker: string;
  assetClass: 'STOCK_BR' | 'FII';
  type: string;
  paymentDate: string;
  value: string;
  stale: boolean;
}

// Cache em memória de 1 hora
let cachedAgenda: { data: AgendaItem[]; expiresAt: number } | null = null;
const AGENDA_TTL_MS = 60 * 60 * 1000;

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`market:dividends-agenda:${ip}`, {
    limit: 15,
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

  // Verifica cache
  if (cachedAgenda && Date.now() < cachedAgenda.expiresAt) {
    return NextResponse.json({
      data: cachedAgenda.data,
      asOf: new Date().toISOString(),
      stale: false,
    });
  }

  // Coleta tickers de STOCK_BR e FII
  const tickers: Array<{ ticker: string; assetClass: 'STOCK_BR' | 'FII' }> = [
    ...CURATED_LISTS.STOCK_BR.map((t) => ({
      ticker: t,
      assetClass: 'STOCK_BR' as const,
    })),
    ...CURATED_LISTS.FII.map((t) => ({
      ticker: t,
      assetClass: 'FII' as const,
    })),
  ];

  const results: AgendaItem[] = [];
  const batches = chunk(tickers, 5);

  for (const batch of batches) {
    const batchResults = await Promise.allSettled(
      batch.map(async ({ ticker, assetClass }) => {
        const dividends = await fetchBrapiDividends(ticker);
        return dividends.map((d) => ({
          ticker,
          assetClass,
          type: d.type,
          paymentDate: d.paymentDate,
          value: d.value,
          stale: false,
        }));
      }),
    );

    for (const r of batchResults) {
      if (r.status === 'fulfilled') results.push(...r.value);
    }

    if (batches.length > 1) await delay(200);
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const futureResults = results.filter(
    (item) => !item.paymentDate || item.paymentDate >= todayStr
  );

  if (futureResults.length === 0) {
    return NextResponse.json(
      { message: 'Nenhum dividendo disponível no momento.', data: [] },
      { status: 503 },
    );
  }

  // Ordena por paymentDate ascendente (mais próximos primeiro, nulos no fim)
  futureResults.sort((a, b) => {
    if (!a.paymentDate) return 1;
    if (!b.paymentDate) return -1;
    return a.paymentDate.localeCompare(b.paymentDate);
  });

  cachedAgenda = { data: futureResults, expiresAt: Date.now() + AGENDA_TTL_MS };

  return NextResponse.json({
    data: futureResults,
    asOf: new Date().toISOString(),
    stale: false,
  });
}
