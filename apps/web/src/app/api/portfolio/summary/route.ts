import { NextRequest, NextResponse } from 'next/server';
import { AssetClass, Currency, TransactionType } from '@prisma/client';
import { calculatePosition } from '@databolsa/core';
import { Transaction as CoreTransaction } from '@databolsa/core';
import { Decimal } from 'decimal.js';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';
import { QuoteService } from '@/lib/quotes/quote.service';

const quoteService = new QuoteService();

function prismaToCoreTx(tx: {
  type: TransactionType;
  date: Date;
  unit_price: any;
  quantity: any;
  fees: any;
}): CoreTransaction {
  return {
    type: tx.type as 'BUY' | 'SELL',
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

  const positions: any[] = [];
  let totalBrl = new Decimal(0);

  for (const asset of assets) {
    const coreTxs = asset.transactions
      .filter((tx) => tx.type === 'BUY' || tx.type === 'SELL')
      .map(prismaToCoreTx);
    if (coreTxs.length === 0) continue;

    const quoteResult = await quoteService.getQuote(
      asset.ticker,
      asset.asset_class,
      asset.currency
    );

    const quotePrice = quoteResult?.priceBrl ?? new Decimal(0);
    const position = calculatePosition(coreTxs, quotePrice);

    if (position.current_quantity.isZero()) continue;

    const valorAtualBrl = quoteResult
      ? position.current_value.toString()
      : null;
    const lucroBrl = quoteResult ? position.profit_loss.toString() : null;
    const lucroPct = quoteResult
      ? position.profit_loss_pct.toString()
      : null;

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
      alocacao_pct: null,
      is_stale: quoteResult?.isStale ?? false,
      current_price_brl: quoteResult ? quoteResult.priceBrl.toString() : null,
    });
  }

  // Calculate alocacao_pct after accumulating total
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
    { status: 200 }
  );
}
