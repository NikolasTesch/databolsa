import { NextRequest, NextResponse } from 'next/server';
import { TransactionType } from '@prisma/client';
import { calculateCurrentQuantity } from '@databolsa/core';
import { Decimal } from 'decimal.js';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';
import { prismaToCoreTx } from '@/lib/portfolio/tx-mapper';
import { jsonError } from '@/lib/http/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return jsonError('UNAUTHORIZED', 'Não autorizado', 401);
  }

  const asset = await prisma.asset.findFirst({
    where: { id: params.id, user_id: user.id },
  });

  if (!asset) {
    return jsonError('NOT_FOUND', 'Ativo não encontrado', 404);
  }

  const transactions = await prisma.transaction.findMany({
    where: { asset_id: params.id },
    orderBy: { date: 'asc' },
  });

  return NextResponse.json(transactions, { status: 200 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return jsonError('UNAUTHORIZED', 'Não autorizado', 401);
  }

  let body: {
    type?: unknown;
    date?: unknown;
    unit_price?: unknown;
    quantity?: unknown;
    fees?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError('INVALID_INPUT', 'Payload inválido', 400);
  }

  const { type, date, unit_price, quantity, fees } = body;

  // Validations
  if (!type || !Object.values(TransactionType).includes(type as TransactionType)) {
    return jsonError('INVALID_TRANSACTION_TYPE', 'Tipo de transação inválido', 400);
  }
  if (!date || isNaN(Date.parse(date as string))) {
    return jsonError('INVALID_DATE', 'Data inválida', 400);
  }
  try {
    if (new Decimal(unit_price as string).lessThanOrEqualTo(0)) {
      return jsonError('INVALID_PRICE', 'Preço unitário deve ser maior que zero', 400);
    }
    if (new Decimal(quantity as string).lessThanOrEqualTo(0)) {
      return jsonError('INVALID_QUANTITY', 'Quantidade deve ser maior que zero', 400);
    }
  } catch {
    return jsonError('INVALID_DECIMAL', 'Valores decimais inválidos', 400);
  }

  return prisma.$transaction(async (tx) => {
    const asset = await tx.asset.findFirst({
      where: { id: params.id, user_id: user.id },
    });
    if (!asset) {
      return jsonError('NOT_FOUND', 'Ativo não encontrado', 404);
    }

    if (type === TransactionType.SELL) {
      const existingTxs = await tx.transaction.findMany({
        where: { asset_id: params.id },
        orderBy: { date: 'asc' },
      });
      const coreTxs = existingTxs.map(prismaToCoreTx);
      const currentQty = calculateCurrentQuantity(coreTxs);
      const sellQty = new Decimal(quantity as string);

      if (sellQty.greaterThan(currentQty)) {
        return jsonError('SELL_EXCEEDS_POSITION', 'Sell quantity exceeds current position', 422);
      }
    }

    const transaction = await tx.transaction.create({
      data: {
        asset_id: params.id,
        type: type as TransactionType,
        date: new Date(date as string),
        unit_price: new Decimal(unit_price as string).toString(),
        quantity: new Decimal(quantity as string).toString(),
        fees: fees ? new Decimal(fees as string).toString() : '0',
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  });
}
