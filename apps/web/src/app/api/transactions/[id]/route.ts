import { NextRequest, NextResponse } from 'next/server';
import { Decimal } from 'decimal.js';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';
import type { TransactionType } from '@prisma/client';
import { jsonError } from '@/lib/http/errors';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return jsonError('UNAUTHORIZED', 'Não autorizado', 401);
  }

  const existing = await prisma.transaction.findFirst({
    where: {
      id: params.id,
      asset: { user_id: user.id },
    },
  });

  if (!existing) {
    return jsonError('NOT_FOUND', 'Transação não encontrada', 404);
  }

  interface PatchTransactionBody {
    date?: string;
    unit_price?: string | number;
    quantity?: string | number;
    fees?: string | number;
  }

  let body: PatchTransactionBody;
  try {
    body = await request.json();
  } catch {
    return jsonError('INVALID_INPUT', 'Payload inválido', 400);
  }

  const { date, unit_price, quantity, fees } = body;

  interface UpdateData {
    date?: Date;
    unit_price?: string;
    quantity?: string;
    fees?: string;
  }

  const data: UpdateData = {};
  if (date) {
    if (isNaN(Date.parse(date))) {
      return jsonError('INVALID_DATE', 'Data inválida', 400);
    }
    data.date = new Date(date);
  }
  if (unit_price) {
    try {
      if (new Decimal(unit_price).lessThanOrEqualTo(0)) {
        return jsonError('INVALID_PRICE', 'Preço unitário deve ser maior que zero', 400);
      }
      data.unit_price = new Decimal(unit_price).toString();
    } catch {
      return jsonError('INVALID_PRICE', 'Preço unitário inválido', 400);
    }
  }
  if (quantity) {
    try {
      if (new Decimal(quantity).lessThanOrEqualTo(0)) {
        return jsonError('INVALID_QUANTITY', 'Quantidade deve ser maior que zero', 400);
      }
      data.quantity = new Decimal(quantity).toString();
    } catch {
      return jsonError('INVALID_QUANTITY', 'Quantidade inválida', 400);
    }
  }
  if (fees !== undefined && fees !== null) {
    try {
      data.fees = new Decimal(fees).toString();
    } catch {
      return jsonError('INVALID_FEES', 'Taxas inválidas', 400);
    }
  }

  // Revalidate RN-02: if quantity or date changes, check the full timeline
  if (data.quantity !== undefined || data.date !== undefined) {
    const allTxs = await prisma.transaction.findMany({
      where: { asset_id: existing.asset_id },
      orderBy: { date: 'asc' },
    });

    const timeline = allTxs.map((t) => ({
      type: t.type as TransactionType,
      quantity: new Decimal(t.id === existing.id && data.quantity !== undefined ? data.quantity : t.quantity),
      date: t.id === existing.id && data.date !== undefined ? data.date : t.date,
    }));
    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = new Decimal(0);
    for (const t of timeline) {
      if (t.type === 'BUY' || t.type === 'DIVIDEND') {
        running = running.add(t.quantity);
      } else if (t.type === 'SELL') {
        running = running.sub(t.quantity);
        if (running.lessThan(0)) {
          return jsonError('SELL_EXCEEDS_POSITION', 'Quantidade de venda excede a posição disponível nesta data', 422);
        }
      }
    }
  }

  const updated = await prisma.transaction.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(updated, { status: 200 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return jsonError('UNAUTHORIZED', 'Não autorizado', 401);
  }

  const existing = await prisma.transaction.findFirst({
    where: {
      id: params.id,
      asset: { user_id: user.id },
    },
  });

  if (!existing) {
    return jsonError('NOT_FOUND', 'Transação não encontrada', 404);
  }

  await prisma.transaction.delete({
    where: { id: params.id },
  });

  return new NextResponse(null, { status: 204 });
}
