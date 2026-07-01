import { NextRequest, NextResponse } from 'next/server';
import { Decimal } from 'decimal.js';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';
import { assertCanViewPortfolio } from '@/lib/auth/groups';
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

  try {
    // Aggregate BUY transactions by year/month
    const transactions = await prisma.transaction.findMany({
      where: {
        type: 'BUY',
        asset: { user_id: targetUserId },
      },
      select: {
        date: true,
        quantity: true,
        unit_price: true,
        fees: true,
      },
      orderBy: { date: 'asc' },
    });

    // Group by year → month
    const byYear: Record<string, Record<string, Decimal>> = {};

    for (const tx of transactions) {
      const date = tx.date instanceof Date ? tx.date : new Date(tx.date);
      const year = date.getFullYear().toString();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const total = new Decimal(tx.quantity.toString())
        .mul(new Decimal(tx.unit_price.toString()))
        .plus(new Decimal(tx.fees?.toString() ?? '0'));

      if (!byYear[year]) byYear[year] = {};
      byYear[year][month] = (byYear[year][month] ?? new Decimal(0)).add(total);
    }

    // Convert to serializable format
    const result: Record<string, Record<string, string>> = {};
    for (const [year, months] of Object.entries(byYear)) {
      result[year] = {};
      for (const [month, value] of Object.entries(months)) {
        result[year][month] = value.toString();
      }
    }

    return NextResponse.json({ by_year: result });
  } catch (error) {
    console.warn('[portfolio/aportes] Erro ao agregar aportes:', error);
    return jsonError('INTERNAL_ERROR', 'Erro interno', 500);
  }
}
