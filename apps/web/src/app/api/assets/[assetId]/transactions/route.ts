import { NextRequest, NextResponse } from 'next/server';
import { TransactionType } from '@prisma/client';
import { calculateCurrentQuantity } from '@databolsa/core';
import { Transaction as CoreTransaction } from '@databolsa/core';
import { Decimal } from 'decimal.js';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';

function prismaToCoreTx(tx: {
  type: TransactionType;
  date: Date;
  unit_price: any;
  quantity: any;
  fees: any;
}): CoreTransaction {
  return {
    type: tx.type as 'BUY' | 'SELL',
    date: tx.date.toISOString().slice(0, 10),
    unit_price: new Decimal(tx.unit_price.toString()),
    quantity: new Decimal(tx.quantity.toString()),
    fees: new Decimal(tx.fees.toString()),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { assetId: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  const asset = await prisma.asset.findFirst({
    where: { id: params.assetId, user_id: user.id },
  });

  if (!asset) {
    return NextResponse.json({ message: 'Ativo não encontrado' }, { status: 404 });
  }

  const transactions = await prisma.transaction.findMany({
    where: { asset_id: params.assetId },
    orderBy: { date: 'asc' },
  });

  return NextResponse.json(transactions, { status: 200 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { assetId: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Payload inválido' }, { status: 400 });
  }

  const { type, date, unit_price, quantity, fees } = body;

  // Validations
  if (!type || !Object.values(TransactionType).includes(type)) {
    return NextResponse.json({ message: 'Tipo de transação inválido' }, { status: 400 });
  }
  if (!date || isNaN(Date.parse(date))) {
    return NextResponse.json({ message: 'Data inválida' }, { status: 400 });
  }
  try {
    if (new Decimal(unit_price).lessThanOrEqualTo(0)) {
      return NextResponse.json({ message: 'Preço unitário deve ser maior que zero' }, { status: 400 });
    }
    if (new Decimal(quantity).lessThanOrEqualTo(0)) {
      return NextResponse.json({ message: 'Quantidade deve ser maior que zero' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ message: 'Valores decimais inválidos' }, { status: 400 });
  }

  return prisma.$transaction(async (tx) => {
    const asset = await tx.asset.findFirst({
      where: { id: params.assetId, user_id: user.id },
    });
    if (!asset) {
      return NextResponse.json({ message: 'Ativo não encontrado' }, { status: 404 });
    }

    if (type === TransactionType.SELL) {
      const existingTxs = await tx.transaction.findMany({
        where: { asset_id: params.assetId },
        orderBy: { date: 'asc' },
      });
      const coreTxs = existingTxs.map(prismaToCoreTx);
      const currentQty = calculateCurrentQuantity(coreTxs);
      const sellQty = new Decimal(quantity);

      if (sellQty.greaterThan(currentQty)) {
        return NextResponse.json(
          { message: 'Sell quantity exceeds current position' },
          { status: 422 }
        );
      }
    }

    const transaction = await tx.transaction.create({
      data: {
        asset_id: params.assetId,
        type,
        date: new Date(date),
        unit_price: new Decimal(unit_price).toString(),
        quantity: new Decimal(quantity).toString(),
        fees: fees ? new Decimal(fees).toString() : '0',
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  });
}
