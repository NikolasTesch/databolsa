import { NextRequest, NextResponse } from 'next/server';
import { Decimal } from 'decimal.js';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';
import { quoteService } from '@/lib/quotes/quote.service';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  // Janela dos últimos 12 meses
  const now = new Date();
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setFullYear(now.getFullYear() - 1);

  const dividendTxs = await prisma.transaction.findMany({
    where: {
      type: 'DIVIDEND',
      date: { gte: twelveMonthsAgo },
      asset: { user_id: user.id },
    },
    include: { asset: { select: { currency: true } } },
  });

  if (dividendTxs.length === 0) {
    return NextResponse.json({
      annual_projection_brl: '0',
      monthly_avg_brl: '0',
      basis_months: 0,
    });
  }

  const hasUsd = dividendTxs.some((tx) => tx.asset.currency === 'USD');
  let fxBrl: Decimal | null = null;
  if (hasUsd) {
    const fxResult = await quoteService.getFxRate();
    if (fxResult) fxBrl = fxResult.priceBrl;
  }

  // Soma total dos últimos 12 meses em BRL
  let total = new Decimal(0);
  const monthsWithDividends = new Set<string>();

  for (const tx of dividendTxs) {
    const gross = new Decimal(tx.quantity.toString()).mul(new Decimal(tx.unit_price.toString()));
    const brl = tx.asset.currency === 'USD' ? gross.mul(fxBrl ?? new Decimal(1)) : gross;
    total = total.add(brl);

    const date = tx.date instanceof Date ? tx.date : new Date(tx.date);
    monthsWithDividends.add(`${date.getFullYear()}-${date.getMonth()}`);
  }

  // Projeção anual = média mensal × 12 (anualiza mesmo que < 12 meses disponíveis)
  const basisMonths = monthsWithDividends.size || 1;
  const monthlyAvg = total.div(basisMonths);
  const annualProjection = monthlyAvg.mul(12);

  return NextResponse.json({
    annual_projection_brl: annualProjection.toString(),
    monthly_avg_brl: monthlyAvg.toString(),
    basis_months: basisMonths,
  });
}
