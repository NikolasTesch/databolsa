import { NextRequest, NextResponse } from 'next/server';
import { Decimal } from 'decimal.js';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';
import { assertCanViewPortfolio } from '@/lib/auth/groups';
import { quoteService } from '@/lib/quotes/quote.service';
import { jsonError } from '@/lib/http/errors';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return jsonError('UNAUTHORIZED', 'Não autorizado', 401);
  }

  const targetUserId = request.nextUrl.searchParams.get('targetUserId') ?? user.id;
  if (targetUserId !== user.id) {
    try {
      await assertCanViewPortfolio(user.id, targetUserId);
    } catch {
      return jsonError('FORBIDDEN', 'Você não tem permissão para ver esta carteira', 403);
    }
  }

  // Busca todas as transações DIVIDEND do usuário (RN-11)
  const dividendTxs = await prisma.transaction.findMany({
    where: {
      type: 'DIVIDEND',
      asset: { user_id: targetUserId },
    },
    include: { asset: { select: { ticker: true, currency: true, asset_class: true } } },
    orderBy: { date: 'asc' },
  });

  // Converte cada provento para BRL
  // Para ativos USD: busca FX (pode ser stale — RN-10)
  const hasUsdAssets = dividendTxs.some((tx) => tx.asset.currency === 'USD');
  let fxBrl: Decimal | null = null;
  if (hasUsdAssets) {
    const fxResult = await quoteService.getFxRate();
    if (fxResult) fxBrl = fxResult.priceBrl;
  }

  function toBrl(tx: (typeof dividendTxs)[number]): Decimal {
    const gross = new Decimal(tx.quantity.toString()).mul(new Decimal(tx.unit_price.toString()));
    if (tx.asset.currency === 'USD') {
      return gross.mul(fxBrl ?? new Decimal(1));
    }
    return gross;
  }

  // Agrupamentos
  const byMonth = new Map<string, Decimal>(); // "YYYY-MM"
  const byQuarter = new Map<string, Decimal>(); // "YYYY-Q#"
  const byYear = new Map<string, Decimal>(); // "YYYY"
  const byAsset = new Map<string, Decimal>(); // ticker

  for (const tx of dividendTxs) {
    const brl = toBrl(tx);
    const date = tx.date instanceof Date ? tx.date : new Date(tx.date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const quarter = Math.ceil((date.getMonth() + 1) / 3);

    const monthKey = `${year}-${month}`;
    const quarterKey = `${year}-Q${quarter}`;
    const yearKey = String(year);
    const assetKey = tx.asset.ticker;

    byMonth.set(monthKey, (byMonth.get(monthKey) ?? new Decimal(0)).add(brl));
    byQuarter.set(quarterKey, (byQuarter.get(quarterKey) ?? new Decimal(0)).add(brl));
    byYear.set(yearKey, (byYear.get(yearKey) ?? new Decimal(0)).add(brl));
    byAsset.set(assetKey, (byAsset.get(assetKey) ?? new Decimal(0)).add(brl));
  }

  function mapToSorted<K extends string>(m: Map<K, Decimal>) {
    return Array.from(m.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({ key, value_brl: value.toString() }));
  }

  const total_brl = Array.from(byYear.values()).reduce((acc, v) => acc.add(v), new Decimal(0));

  return NextResponse.json({
    total_brl: total_brl.toString(),
    by_month: mapToSorted(byMonth),
    by_quarter: mapToSorted(byQuarter),
    by_year: mapToSorted(byYear),
    by_asset: Array.from(byAsset.entries())
      .sort(([, a], [, b]) => b.comparedTo(a))
      .map(([key, value]) => ({ key, value_brl: value.toString() })),
  });
}
