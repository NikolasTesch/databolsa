import { NextRequest, NextResponse } from 'next/server';
import { Decimal } from 'decimal.js';
import { AlertCondition } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';
import { jsonError } from '@/lib/http/errors';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getAuthUser(request);
  if (!user) {
    return jsonError('UNAUTHORIZED', 'Não autorizado', 401);
  }

  const alert = await prisma.priceAlert.findUnique({
    where: { id: params.id },
  });

  if (!alert || alert.user_id !== user.id) {
    return jsonError('NOT_FOUND', 'Alerta não encontrado', 404);
  }

  interface PatchAlertBody {
    target_price?: string | number;
    condition?: string;
    is_active?: boolean;
  }

  let body: PatchAlertBody;
  try {
    body = await request.json();
  } catch {
    return jsonError('INVALID_PAYLOAD', 'Payload inválido', 400);
  }

  const { target_price, condition, is_active } = body;

  const data: {
    target_price?: string;
    condition?: AlertCondition;
    is_active?: boolean;
    triggered_at?: null;
  } = {};

  if (target_price !== undefined) {
    try {
      const d = new Decimal(target_price);
      if (d.lessThanOrEqualTo(0)) {
        return jsonError('INVALID_TARGET_PRICE', 'target_price deve ser maior que zero', 400);
      }
      data.target_price = d.toString();
    } catch {
      return jsonError('INVALID_TARGET_PRICE', 'target_price inválido', 400);
    }
  }

  if (condition !== undefined) {
    if (condition !== 'ABOVE' && condition !== 'BELOW') {
      return jsonError('INVALID_CONDITION', "condition deve ser 'ABOVE' ou 'BELOW'", 400);
    }
    data.condition = condition as AlertCondition;
  }

  if (is_active === true) {
    data.is_active = true;
    data.triggered_at = null;
  }

  const updated = await prisma.priceAlert.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(updated, { status: 200 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getAuthUser(request);
  if (!user) {
    return jsonError('UNAUTHORIZED', 'Não autorizado', 401);
  }

  const alert = await prisma.priceAlert.findUnique({
    where: { id: params.id },
  });

  if (!alert || alert.user_id !== user.id) {
    return jsonError('NOT_FOUND', 'Alerta não encontrado', 404);
  }

  await prisma.priceAlert.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
