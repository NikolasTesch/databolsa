import { NextRequest, NextResponse } from 'next/server';
import { Decimal } from 'decimal.js';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const transactions = await prisma.transaction.findMany({
      where: {
        asset: { user_id: user.id },
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      select: { type: true, unit_price: true, quantity: true, fees: true },
    });

    let totalBought = new Decimal(0);
    let totalSold = new Decimal(0);
    let totalDividends = new Decimal(0);

    for (const tx of transactions) {
      const qty = new Decimal(tx.quantity.toString());
      const price = new Decimal(tx.unit_price.toString());
      const fees = new Decimal(tx.fees?.toString() ?? '0');
      const value = qty.times(price);

      if (tx.type === 'BUY') {
        totalBought = totalBought.plus(value).plus(fees);
      } else if (tx.type === 'SELL') {
        totalSold = totalSold.plus(value);
      } else if (tx.type === 'DIVIDEND') {
        totalDividends = totalDividends.plus(value);
      }
    }

    return NextResponse.json(
      {
        total_bought_brl: totalBought.toString(),
        total_sold_brl: totalSold.toString(),
        total_dividends_brl: totalDividends.toString(),
        estimated_realized_gain_brl: '0',
        transaction_count: transactions.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.warn('[portfolio/monthly-activity] Erro ao agregar atividade mensal:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
