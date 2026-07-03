import { NextRequest, NextResponse } from 'next/server';
import { AlertCondition } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { getAuthUser } from '@/lib/auth/get-user';
import { jsonError } from '@/lib/http/errors';
import { createAlert, listAlerts } from '@/lib/analysis/analysis-alert.service';
import type { AlertMetric } from '@/lib/analysis/analysis-alert.service';

const VALID_METRICS = ['dy', 'pe', 'pb', 'roe', 'score', 'stale'];

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return jsonError('UNAUTHORIZED', 'Não autorizado', 401);
  }

  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker') ?? undefined;

  try {
    const alerts = await listAlerts(user.id, ticker);
    return NextResponse.json({ alerts });
  } catch (err) {
    console.warn(`[analysis-alerts] list failed: ${err instanceof Error ? err.message : String(err)}`);
    return jsonError('INTERNAL_ERROR', 'Erro ao listar alertas', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return jsonError('UNAUTHORIZED', 'Não autorizado', 401);
  }

  let body: {
    ticker?: unknown;
    metric?: unknown;
    condition?: unknown;
    target_value?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError('INVALID_INPUT', 'Parâmetros inválidos', 400);
  }

  const { ticker, metric, condition, target_value } = body;

  if (typeof ticker !== 'string' || !ticker.trim()) {
    return jsonError('INVALID_INPUT', 'ticker é obrigatório', 400);
  }

  if (typeof metric !== 'string' || !VALID_METRICS.includes(metric)) {
    return jsonError(
      'INVALID_INPUT',
      'metric deve ser: dy, pe, pb, roe, score, stale',
      400,
    );
  }

  if (metric === 'stale') {
    try {
      const alert = await createAlert(user.id, {
        ticker: ticker.trim(),
        metric: 'stale',
        condition: AlertCondition.ABOVE,
        target_value: '24',
      });

      return NextResponse.json(alert, { status: 201 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar alerta';
      return jsonError('CREATE_ERROR', msg, 400);
    }
  }

  if (condition !== 'ABOVE' && condition !== 'BELOW') {
    return jsonError('INVALID_INPUT', "condition deve ser 'ABOVE' ou 'BELOW'", 400);
  }

  if (target_value == null) {
    return jsonError('INVALID_INPUT', 'target_value é obrigatório', 400);
  }

  let targetDecimal: Decimal;
  try {
    targetDecimal = new Decimal(String(target_value));
    if (targetDecimal.lte(0)) {
      return jsonError('INVALID_INPUT', 'target_value deve ser maior que zero', 400);
    }
  } catch (err) {
    console.warn(`[analysis-alerts] invalid target_value: ${err instanceof Error ? err.message : String(err)}`);
    return jsonError('INVALID_INPUT', 'target_value inválido', 400);
  }

  try {
    const alert = await createAlert(user.id, {
      ticker: ticker.trim(),
      metric: metric as AlertMetric,
      condition: condition as AlertCondition,
      target_value: targetDecimal,
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao criar alerta';
    return jsonError('CREATE_ERROR', msg, 400);
  }
}
