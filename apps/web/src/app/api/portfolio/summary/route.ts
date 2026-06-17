import { NextRequest, NextResponse } from 'next/server';
import { TransactionType, Prisma } from '@prisma/client';
import { calculatePosition } from '@databolsa/core';
import { Transaction as CoreTransaction } from '@databolsa/core';
import { Decimal } from 'decimal.js';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';
import { QuoteService } from '@/lib/quotes/quote.service';

const quoteService = new QuoteService();

interface PositionItem {
  ticker: string;
  asset_id: string;
  current_quantity: string;
  average_price: string;
  invested_value: string;
  valor_atual_brl: string | null;
  lucro_prejuizo_brl: string | null;
  lucro_prejuizo_pct: string | null;
  total_dividends_brl: string;
  total_return_brl: string | null;
  total_return_pct: string | null;
  yield_on_cost_pct: string;
  alocacao_pct: string | null;
  is_stale: boolean;
  current_price_brl: string | null;
}

function prismaToCoreTx(tx: {
  type: TransactionType;
  date: Date;
  unit_price: Prisma.Decimal;
  quantity: Prisma.Decimal;
  fees: Prisma.Decimal;
}): CoreTransaction {
  return {
    type: tx.type as CoreTransaction['type'],
    date: tx.date.toISOString().slice(0, 10),
    unit_price: new Decimal(tx.unit_price.toString()),
    quantity: new Decimal(tx.quantity.toString()),
    fees: new Decimal(tx.fees.toString()),
  };
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  const assets = await prisma.asset.findMany({
    where: { user_id: user.id },
    include: {
      transactions: { orderBy: { date: 'asc' } },
    },
  });

  const assetsWithTxs = assets.filter((asset) =>
    asset.transactions.some((tx) => tx.type === 'BUY' || tx.type === 'SELL'),
  );

  const quoteResults = await Promise.all(
    assetsWithTxs.map((asset) =>
      quoteService.getQuote(asset.ticker, asset.asset_class, asset.currency),
    ),
  );

  const positions: PositionItem[] = [];
  let totalBrl = new Decimal(0);

  for (let i = 0; i < assetsWithTxs.length; i++) {
    const asset = assetsWithTxs[i];
    const quoteResult = quoteResults[i];

    const coreTxs = asset.transactions.map(prismaToCoreTx);

    const quotePrice = quoteResult?.priceBrl ?? new Decimal(0);
    const position = calculatePosition(coreTxs, quotePrice);

    if (position.current_quantity.isZero()) continue;

    const valorAtualBrl = quoteResult ? position.current_value.toString() : null;
    const lucroBrl = quoteResult ? position.profit_loss.toString() : null;
    const lucroPct = quoteResult ? position.profit_loss_pct.toString() : null;
    const totalReturnBrl = quoteResult ? position.total_return.toString() : null;
    const totalReturnPct = quoteResult ? position.total_return_pct.toString() : null;

    if (quoteResult) {
      totalBrl = totalBrl.plus(position.current_value);
    }

    positions.push({
      ticker: asset.ticker,
      asset_id: asset.id,
      current_quantity: position.current_quantity.toString(),
      average_price: position.average_price.toString(),
      invested_value: position.invested_value.toString(),
      valor_atual_brl: valorAtualBrl,
      lucro_prejuizo_brl: lucroBrl,
      lucro_prejuizo_pct: lucroPct,
      total_dividends_brl: position.total_dividends.toString(),
      total_return_brl: totalReturnBrl,
      total_return_pct: totalReturnPct,
      yield_on_cost_pct: position.yield_on_cost_pct.toString(),
      alocacao_pct: null,
      is_stale: quoteResult?.isStale ?? false,
      current_price_brl: quoteResult ? quoteResult.priceBrl.toString() : null,
    });
  }

  if (totalBrl.greaterThan(0)) {
    for (const pos of positions) {
      if (pos.valor_atual_brl !== null) {
        pos.alocacao_pct = new Decimal(pos.valor_atual_brl)
          .div(totalBrl)
          .times(100)
          .toFixed(4);
      }
    }
  }

  return NextResponse.json(
    {
      positions,
      patrimonio_total_brl: totalBrl.toString(),
    },
    { status: 200 },
  );
}
