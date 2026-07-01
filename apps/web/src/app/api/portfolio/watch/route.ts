import { NextRequest, NextResponse } from 'next/server';
import { AssetClass, Currency, DataSource } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';
import { quoteService } from '@/lib/quotes/quote.service';
import { jsonError } from '@/lib/http/errors';

/**
 * Resolve a fonte de dados conforme asset class (mesma lógica de QuoteService).
 */
function resolveSource(assetClass: AssetClass): DataSource {
  switch (assetClass) {
    case AssetClass.CRYPTO:
      return DataSource.COINGECKO;
    case AssetClass.STOCK_US:
      return DataSource.FINNHUB;
    default:
      return DataSource.BRAPI;
  }
}

// GET /api/portfolio/watch — list all watched assets with current prices
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return jsonError('UNAUTHORIZED', 'Não autorizado', 401);

  const watches = await prisma.assetWatch.findMany({
    where: { user_id: user.id },
    orderBy: { added_at: 'desc' },
  });

  // Enrich with current prices (parallel per asset)
  const enriched = await Promise.all(
    watches.map(async (w) => {
      try {
        const assetClass = w.asset_class as AssetClass;
        const currency =
          w.asset_class === 'STOCK_US' || w.asset_class === 'BDR'
            ? Currency.USD
            : Currency.BRL;
        const source = resolveSource(assetClass);

        const [quote, cached] = await Promise.all([
          quoteService.getQuote(w.ticker, assetClass, currency),
          prisma.quoteCache.findUnique({
            where: { symbol_source: { symbol: w.ticker, source } },
            select: { changePercent: true },
          }),
        ]);

        return {
          id: w.id,
          ticker: w.ticker,
          name: w.name,
          asset_class: w.asset_class,
          current_price_brl: quote?.priceBrl?.toString() ?? null,
          price_change_pct: cached?.changePercent?.toString() ?? null,
          added_at: w.added_at.toISOString(),
        };
      } catch {
        return {
          id: w.id,
          ticker: w.ticker,
          name: w.name,
          asset_class: w.asset_class,
          current_price_brl: null,
          price_change_pct: null,
          added_at: w.added_at.toISOString(),
        };
      }
    }),
  );

  return NextResponse.json({ watches: enriched });
}

// POST /api/portfolio/watch — add asset to watchlist
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return jsonError('UNAUTHORIZED', 'Não autorizado', 401);

  let body: { ticker?: string; name?: string; asset_class?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError('INVALID_INPUT', 'JSON inválido', 422);
  }

  const { ticker, name, asset_class: assetClassRaw } = body;
  if (!ticker || !ticker.trim()) {
    return jsonError('VALIDATION_ERROR', 'Ticker é obrigatório', 422);
  }

  const validClasses: AssetClass[] = [
    AssetClass.STOCK_BR,
    AssetClass.FII,
    AssetClass.ETF,
    AssetClass.BDR,
    AssetClass.CRYPTO,
    AssetClass.STOCK_US,
  ];
  const assetClass: AssetClass =
    assetClassRaw && (validClasses as string[]).includes(assetClassRaw)
      ? (assetClassRaw as AssetClass)
      : AssetClass.STOCK_BR;

  // Check if already watching
  const existing = await prisma.assetWatch.findUnique({
    where: {
      user_id_ticker: { user_id: user.id, ticker: ticker.trim().toUpperCase() },
    },
  });

  if (existing) {
    return jsonError('CONFLICT', 'Ativo já está na sua watchlist', 409);
  }

  const watch = await prisma.assetWatch.create({
    data: {
      user_id: user.id,
      ticker: ticker.trim().toUpperCase(),
      name: name || null,
      asset_class: assetClass,
    },
  });

  return NextResponse.json(
    {
      id: watch.id,
      ticker: watch.ticker,
      name: watch.name,
      asset_class: watch.asset_class,
      added_at: watch.added_at.toISOString(),
    },
    { status: 201 },
  );
}
