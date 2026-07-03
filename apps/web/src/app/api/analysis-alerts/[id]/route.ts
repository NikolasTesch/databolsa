import { NextRequest, NextResponse } from 'next/server';
import { Decimal } from 'decimal.js';
import { AlertCondition } from '@prisma/client';
import { getAuthUser } from '@/lib/auth/get-user';
import { jsonError } from '@/lib/http/errors';
import { updateAlert, deleteAlert } from '@/lib/analysis/analysis-alert.service';
import type { UpdateAlertParams } from '@/lib/analysis/analysis-alert.service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getAuthUser(request);
  if (!user) {
    return jsonError('UNAUTHORIZED', 'Não autorizado', 401);
  }

  let body: {
    is_active?: unknown;
    condition?: unknown;
    target_value?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError('INVALID_PAYLOAD', 'Payload inválido', 400);
  }

  const { is_active, condition, target_value } = body;

  const updateParams: UpdateAlertParams = {};

  if (is_active !== undefined) {
    updateParams.is_active = Boolean(is_active);
  }

  if (condition !== undefined) {
    if (condition !== 'ABOVE' && condition !== 'BELOW') {
      return jsonError('INVALID_CONDITION', "condition deve ser 'ABOVE' ou 'BELOW'", 400);
    }
    updateParams.condition = condition as AlertCondition;
  }

  if (target_value !== undefined) {
    try {
      const val = new Decimal(String(target_value));
      if (val.lte(0)) {
        return jsonError('INVALID_TARGET', 'target_value deve ser maior que zero', 400);
      }
      updateParams.target_value = val.toString();
    } catch {
      return jsonError('INVALID_TARGET', 'target_value inválido', 400);
    }
  }

  try {
    const alert = await updateAlert(params.id, user.id, updateParams);
    return NextResponse.json(alert, { status: 200 });
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_FOUND') {
      return jsonError('NOT_FOUND', 'Alerta não encontrado', 404);
    }
    const msg = err instanceof Error ? err.message : 'Erro ao atualizar alerta';
    return jsonError('UPDATE_ERROR', msg, 400);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getAuthUser(request);
  if (!user) {
    return jsonError('UNAUTHORIZED', 'Não autorizado', 401);
  }

  try {
    await deleteAlert(params.id, user.id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_FOUND') {
      return jsonError('NOT_FOUND', 'Alerta não encontrado', 404);
    }
    return jsonError('DELETE_ERROR', 'Erro ao remover alerta', 500);
  }
}
