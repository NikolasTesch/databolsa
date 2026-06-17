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
      select: { type: true, date: true, unit_price: true, quantity: true, fees: true, asset_id: true },
    });

    // Estado corrido por ativo: custo médio ponderado (RN-01, RN-03)
    const assetState = new Map<string, { qty: Decimal; avgPrice: Decimal }>();
    // Total investido corrente = Σ (qty_i × avgPrice_i) para todos os ativos
    let totalInvested = new Decimal(0);

    const dataPoints: { date: string; cumulative_invested_brl: string }[] = [];

    for (const tx of transactions) {
      const assetId = tx.asset_id;
      const state = assetState.get(assetId) ?? { qty: new Decimal(0), avgPrice: new Decimal(0) };
      const qty = new Decimal(tx.quantity.toString());
      const price = new Decimal(tx.unit_price.toString());
      const fees = new Decimal(tx.fees?.toString() ?? '0');

      // Valor investido atual deste ativo antes da transação
      const prevAssetInvested = state.qty.mul(state.avgPrice);

      if (tx.type === 'BUY') {
        const newQty = state.qty.add(qty);
        const newAvgPrice = newQty.isZero()
          ? new Decimal(0)
          : state.qty.mul(state.avgPrice).add(qty.mul(price)).add(fees).div(newQty);
        assetState.set(assetId, { qty: newQty, avgPrice: newAvgPrice });
        totalInvested = totalInvested.sub(prevAssetInvested).add(newQty.mul(newAvgPrice));
      } else {
        // SELL: quantidade diminui, avgPrice inalterado (RN-03)
        const newQty = Decimal.max(new Decimal(0), state.qty.sub(qty));
        assetState.set(assetId, { qty: newQty, avgPrice: state.avgPrice });
        totalInvested = totalInvested.sub(prevAssetInvested).add(newQty.mul(state.avgPrice));
      }

      const dateStr = tx.date.toISOString().slice(0, 10);
      if (dataPoints.length > 0 && dataPoints[dataPoints.length - 1].date === dateStr) {
        dataPoints[dataPoints.length - 1].cumulative_invested_brl = totalInvested.toString();
      } else {
        dataPoints.push({ date: dateStr, cumulative_invested_brl: totalInvested.toString() });
      }
    }

    return NextResponse.json({ data_points: dataPoints }, { status: 200 });
  } catch (error) {
    console.error('[portfolio/history] Erro ao calcular histórico:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
