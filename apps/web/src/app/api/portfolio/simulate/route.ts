import { NextRequest, NextResponse } from 'next/server';
import { calculatePosition, simulatePosition } from '@databolsa/core';
import { Decimal } from 'decimal.js';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';
import { quoteService } from '@/lib/quotes/quote.service';
import { prismaToCoreTx } from '@/lib/portfolio/tx-mapper';
import { computePositions } from '@/lib/portfolio/positions';

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  let body: { ticker?: unknown; quantity?: unknown; price?: unknown; type?: unknown; fees?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 422 });
  }

  const { ticker, quantity, price, type, fees } = body;

  if (
    typeof ticker !== 'string' ||
    !ticker.trim() ||
    (type !== 'BUY' && type !== 'SELL') ||
    quantity == null ||
    price == null
  ) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 422 });
  }

  let qtyDecimal: Decimal;
  let priceDecimal: Decimal;
  let feesDecimal: Decimal;

  try {
    qtyDecimal = new Decimal(String(quantity));
    priceDecimal = new Decimal(String(price));
    feesDecimal = fees != null ? new Decimal(String(fees)) : new Decimal(0);
    if (qtyDecimal.lte(0) || priceDecimal.lte(0) || feesDecimal.lt(0)) {
      throw new Error('non-positive');
    }
  } catch {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 422 });
  }

  const normalizedTicker = ticker.trim().toUpperCase();

  // Busca o ativo do usuário (RN-11)
  const asset = await prisma.asset.findFirst({
    where: { ticker: normalizedTicker, user_id: user.id },
    include: { transactions: { orderBy: { date: 'asc' } } },
  });

  if (!asset && type === 'SELL') {
    return NextResponse.json({ error: 'POSITION_NOT_FOUND' }, { status: 404 });
  }

  const coreTxs = asset ? asset.transactions.map(prismaToCoreTx) : [];

  // Posição atual (quote fictícia 0 só para extrair qtd e avg)
  const currentPosition = calculatePosition(coreTxs, new Decimal(0));

  // Patrimônio total e cotações via computePositions (RN-10, RN-11) — único lote de quotes
  const { positions, totalBrl: portfolioValueBrl } = await computePositions(user.id);

  // Tenta extrair a cotação do ticker simulado do lote de posições já calculadas
  let currentQuoteBrl: Decimal | null = null;
  let isStale = false;

  const existingPosition = positions.find((p) => p.asset.ticker === normalizedTicker);
  if (existingPosition) {
    currentQuoteBrl = existingPosition.currentPriceBrl;
    isStale = existingPosition.isStale;
  } else if (asset) {
    // Ticker está na carteira mas sem posição aberta (qtd = 0 após vendas):
    // busca a cotação separadamente para permitir simulação de nova compra
    const quoteResult = await quoteService.getQuote(
      asset.ticker,
      asset.asset_class,
      asset.currency,
    );
    if (quoteResult) {
      currentQuoteBrl = quoteResult.priceBrl;
      isStale = quoteResult.isStale;
    }
  }
  // Se ticker não está na carteira (nova compra) e não há asset, cotação permanece null

  try {
    const simulation = simulatePosition({
      current_quantity: currentPosition.current_quantity,
      current_avg_price: currentPosition.average_price,
      current_invested_brl: currentPosition.invested_value,
      current_portfolio_value_brl: portfolioValueBrl,
      current_quote_brl: currentQuoteBrl,
      hypothetical: {
        type: type as 'BUY' | 'SELL',
        quantity: qtyDecimal,
        price: priceDecimal,
        fees: feesDecimal,
      },
    });

    return NextResponse.json({
      ticker: normalizedTicker,
      is_stale: isStale,
      simulation: {
        new_quantity: simulation.new_quantity.toString(),
        new_avg_price: simulation.new_avg_price.toString(),
        new_invested_brl: simulation.new_invested_brl.toString(),
        new_current_value_brl: simulation.new_current_value_brl?.toString() ?? null,
        new_allocation_pct: simulation.new_allocation_pct?.toString() ?? null,
        pl_brl: simulation.pl_brl?.toString() ?? null,
        pl_pct: simulation.pl_pct?.toString() ?? null,
        delta_quantity: simulation.delta_quantity.toString(),
        delta_invested_brl: simulation.delta_invested_brl.toString(),
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'SELL_EXCEEDS_POSITION') {
      return NextResponse.json({ error: 'SELL_EXCEEDS_POSITION' }, { status: 422 });
    }
    throw err;
  }
}
