import { NextRequest, NextResponse } from 'next/server';
import { Decimal } from 'decimal.js';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';

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

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Payload inválido' }, { status: 400 });
  }

  const { date, unit_price, quantity, fees } = body;

  const data: any = {};
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
