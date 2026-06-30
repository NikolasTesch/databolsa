import { NextRequest, NextResponse } from 'next/server';
import { AlertCondition } from '@prisma/client';
import { Decimal } from 'decimal.js';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';
import { evaluateAlerts } from '@/lib/alerts/alert.service';
import { jsonError } from '@/lib/http/errors';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return jsonError('UNAUTHORIZED', 'Não autorizado', 401);
  }

  // Avaliação lazy: verifica alertas ao listar (ADR-0010)
  await evaluateAlerts(user.id);

  const alerts = await prisma.priceAlert.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: 'desc' },
  });

  return NextResponse.json({
    alerts: alerts.map((a) => ({
      id: a.id,
      asset_ticker: a.asset_ticker,
      condition: a.condition,
      target_price: a.target_price.toString(),
      is_active: a.is_active,
      triggered_at: a.triggered_at?.toISOString() ?? null,
      created_at: a.created_at.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return jsonError('UNAUTHORIZED', 'Não autorizado', 401);
  }

  let body: { asset_ticker?: unknown; condition?: unknown; target_price?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError('INVALID_INPUT', 'Parâmetros inválidos', 422);
  }

  const { asset_ticker, condition, target_price } = body;

  if (
    typeof asset_ticker !== 'string' ||
    !asset_ticker.trim() ||
    (condition !== 'ABOVE' && condition !== 'BELOW') ||
    target_price == null
  ) {
    return jsonError('INVALID_INPUT', 'Parâmetros inválidos', 422);
  }

  let targetDecimal: Decimal;
  try {
    targetDecimal = new Decimal(String(target_price));
    if (targetDecimal.lte(0)) throw new Error('non-positive');
  } catch {
    return jsonError('INVALID_INPUT', 'Parâmetros inválidos', 422);
  }

  const alert = await prisma.priceAlert.create({
    data: {
      user_id: user.id,
      asset_ticker: asset_ticker.trim().toUpperCase(),
      condition: condition as AlertCondition,
      target_price: targetDecimal.toString(),
    },
  });

  return NextResponse.json(
    {
      id: alert.id,
      asset_ticker: alert.asset_ticker,
      condition: alert.condition,
      target_price: alert.target_price.toString(),
      is_active: alert.is_active,
      triggered_at: null,
      created_at: alert.created_at.toISOString(),
    },
    { status: 201 },
  );
}
