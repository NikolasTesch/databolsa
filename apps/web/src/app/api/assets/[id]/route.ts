import { NextRequest, NextResponse } from 'next/server';
import { DataSource } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';
import { jsonError } from '@/lib/http/errors';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  const asset = await prisma.asset.findFirst({
    where: {
      id: params.id,
      user_id: user.id,
    },
  });

  if (!asset) {
    return NextResponse.json({ message: 'Ativo não encontrado' }, { status: 404 });
  }

  return NextResponse.json(asset, { status: 200 });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

  interface PatchAssetBody {
    name?: string;
    sector?: string | null;
    data_source?: string;
    ticker?: unknown;
    currency?: unknown;
  }

  let body: PatchAssetBody;
  try {
    body = await request.json();
  } catch {
    return jsonError('INVALID_PAYLOAD', 'Payload inválido', 400);
  }

  if ('ticker' in body || 'currency' in body) {
    return jsonError(
      'IMMUTABLE_FIELD',
      'ticker e currency não podem ser alterados após a criação do ativo',
      422,
    );
  }

  const { name, sector, data_source } = body;

  const data: {
    name?: string;
    sector?: string | null;
    data_source?: DataSource;
  } = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return jsonError('INVALID_NAME', 'Nome não pode ser vazio', 422);
    }
    data.name = name.trim();
  }

  if (sector !== undefined) {
    data.sector = sector === null ? null : String(sector).trim();
  }

  if (data_source !== undefined) {
    if (!Object.values(DataSource).includes(data_source as DataSource)) {
      return jsonError('INVALID_DATA_SOURCE', 'Fonte de dados inválida', 400);
    }
    data.data_source = data_source as DataSource;
  }

  const updated = await prisma.asset.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(updated, { status: 200 });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  const asset = await prisma.asset.findFirst({
    where: {
      id: params.id,
      user_id: user.id,
    },
  });

  if (!asset) {
    return NextResponse.json({ message: 'Ativo não encontrado' }, { status: 404 });
  }

  await prisma.asset.delete({
    where: { id: params.id },
  });

  return new NextResponse(null, { status: 204 });
}
