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
    const transactions = await prisma.transaction.findMany({
      where: {
        asset: { user_id: user.id },
        type: { in: ['BUY', 'SELL'] },
      },
      orderBy: { date: 'asc' },
      select: { type: true, date: true, unit_price: true, quantity: true, fees: true },
    });

    let cumulative = new Decimal(0);
    const dataPoints: { date: string; cumulative_invested_brl: string }[] = [];

    for (const tx of transactions) {
      const qty = new Decimal(tx.quantity.toString());
      const price = new Decimal(tx.unit_price.toString());
      const fees = new Decimal(tx.fees?.toString() ?? '0');
      const value = qty.times(price);

      if (tx.type === 'BUY') {
        cumulative = cumulative.plus(value).plus(fees);
      } else {
        cumulative = Decimal.max(new Decimal(0), cumulative.minus(value));
      }

      const dateStr = tx.date.toISOString().slice(0, 10);
      if (dataPoints.length > 0 && dataPoints[dataPoints.length - 1].date === dateStr) {
        dataPoints[dataPoints.length - 1].cumulative_invested_brl = cumulative.toString();
      } else {
        dataPoints.push({ date: dateStr, cumulative_invested_brl: cumulative.toString() });
      }
    }

    return NextResponse.json({ data_points: dataPoints }, { status: 200 });
  } catch (error) {
    console.error('[portfolio/history] Erro ao calcular histórico:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
