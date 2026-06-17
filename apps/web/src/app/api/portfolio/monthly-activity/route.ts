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
      select: { type: true, unit_price: true, quantity: true, fees: true, asset_id: true },
    });

    let totalBought = new Decimal(0);
    let totalSold = new Decimal(0);
    let totalDividends = new Decimal(0);

    const assetIdsWithSells = new Set<string>();

    for (const tx of transactions) {
      const qty = new Decimal(tx.quantity.toString());
      const price = new Decimal(tx.unit_price.toString());
      const fees = new Decimal(tx.fees?.toString() ?? '0');
      const value = qty.times(price);

      if (tx.type === 'BUY') {
        totalBought = totalBought.plus(value).plus(fees);
      } else if (tx.type === 'SELL') {
        totalSold = totalSold.plus(value);
        assetIdsWithSells.add(tx.asset_id);
      } else if (tx.type === 'DIVIDEND') {
        totalDividends = totalDividends.plus(value);
      }
    }

    // Calcula o ganho de capital realizado nas vendas do mês usando custo médio corrido
    let estimatedRealizedGain = new Decimal(0);

    if (assetIdsWithSells.size > 0) {
      const allTxsForSoldAssets = await prisma.transaction.findMany({
        where: {
          asset_id: { in: [...assetIdsWithSells] },
          date: { lte: endOfMonth },
          type: { in: ['BUY', 'SELL'] },
        },
        orderBy: { date: 'asc' },
        select: { type: true, unit_price: true, quantity: true, fees: true, asset_id: true, date: true },
      });

      // Estado corrido por ativo: custo médio ponderado (RN-01, RN-03)
      const assetState = new Map<string, { qty: Decimal; avgPrice: Decimal }>();

      for (const tx of allTxsForSoldAssets) {
        const state = assetState.get(tx.asset_id) ?? { qty: new Decimal(0), avgPrice: new Decimal(0) };
        const qty = new Decimal(tx.quantity.toString());
        const price = new Decimal(tx.unit_price.toString());
        const fees = new Decimal(tx.fees?.toString() ?? '0');

        if (tx.type === 'BUY') {
          const newQty = state.qty.add(qty);
          const newAvgPrice = newQty.isZero()
            ? new Decimal(0)
            : state.qty.mul(state.avgPrice).add(qty.mul(price)).add(fees).div(newQty);
          assetState.set(tx.asset_id, { qty: newQty, avgPrice: newAvgPrice });
        } else if (tx.type === 'SELL') {
          // Acumula ganho realizado somente para vendas dentro do mês corrente
          if (tx.date >= startOfMonth) {
            estimatedRealizedGain = estimatedRealizedGain.add(
              qty.mul(price.sub(state.avgPrice)),
            );
          }
          const newQty = Decimal.max(new Decimal(0), state.qty.sub(qty));
          assetState.set(tx.asset_id, { qty: newQty, avgPrice: state.avgPrice });
        }
      }
    }

    return NextResponse.json(
      {
        total_bought_brl: totalBought.toString(),
        total_sold_brl: totalSold.toString(),
        total_dividends_brl: totalDividends.toString(),
        estimated_realized_gain_brl: estimatedRealizedGain.toString(),
        transaction_count: transactions.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.warn('[portfolio/monthly-activity] Erro ao agregar atividade mensal:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
