import { NextRequest, NextResponse } from 'next/server';
import { Decimal } from 'decimal.js';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';
import type { TransactionType } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  const existing = await prisma.transaction.findFirst({
    where: {
      id: params.id,
      asset: { user_id: user.id },
    },
  });

  if (!existing) {
    return NextResponse.json({ message: 'Transação não encontrada' }, { status: 404 });
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
    return NextResponse.json({ message: 'Payload inválido' }, { status: 400 });
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
      return NextResponse.json({ message: 'Data inválida' }, { status: 400 });
    }
    data.date = new Date(date);
  }
  if (unit_price) {
    try {
      if (new Decimal(unit_price).lessThanOrEqualTo(0)) {
        return NextResponse.json({ message: 'Preço unitário deve ser maior que zero' }, { status: 400 });
      }
      data.unit_price = new Decimal(unit_price).toString();
    } catch {
      return NextResponse.json({ message: 'Preço unitário inválido' }, { status: 400 });
    }
  }
  if (quantity) {
    try {
      if (new Decimal(quantity).lessThanOrEqualTo(0)) {
        return NextResponse.json({ message: 'Quantidade deve ser maior que zero' }, { status: 400 });
      }
      data.quantity = new Decimal(quantity).toString();
    } catch {
      return NextResponse.json({ message: 'Quantidade inválida' }, { status: 400 });
    }
  }
  if (fees !== undefined && fees !== null) {
    try {
      data.fees = new Decimal(fees).toString();
    } catch {
      return NextResponse.json({ message: 'Taxas inválidas' }, { status: 400 });
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
          return NextResponse.json(
            { message: 'Quantidade de venda excede a posição disponível nesta data' },
            { status: 422 }
          );
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
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  const existing = await prisma.transaction.findFirst({
    where: {
      id: params.id,
      asset: { user_id: user.id },
    },
  });

  if (!existing) {
    return NextResponse.json({ message: 'Transação não encontrada' }, { status: 404 });
  }

  await prisma.transaction.delete({
    where: { id: params.id },
  });

  return new NextResponse(null, { status: 204 });
}
