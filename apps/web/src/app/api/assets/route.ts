import { NextRequest, NextResponse } from 'next/server';
import { AssetClass, Currency, DataSource } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  const assets = await prisma.asset.findMany({
    where: { user_id: user.id },
  });

  return NextResponse.json(assets, { status: 200 });
}

export async function POST(request: NextRequest) {
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

  const { ticker, name, asset_class, currency, data_source } = body;

  // Validations
  if (!ticker || typeof ticker !== 'string' || ticker.trim().length === 0) {
    return NextResponse.json({ message: 'Ticker inválido' }, { status: 400 });
  }
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ message: 'Nome inválido' }, { status: 400 });
  }
  if (!Object.values(AssetClass).includes(asset_class)) {
    return NextResponse.json({ message: 'Classe de ativo inválida' }, { status: 400 });
  }
  if (!Object.values(Currency).includes(currency)) {
    return NextResponse.json({ message: 'Moeda inválida' }, { status: 400 });
  }
  if (!Object.values(DataSource).includes(data_source)) {
    return NextResponse.json({ message: 'Fonte de dados inválida' }, { status: 400 });
  }

  const asset = await prisma.asset.create({
    data: {
      ticker: ticker.toUpperCase(),
      name,
      asset_class,
      currency,
      data_source,
      user_id: user.id,
    },
  });

  return NextResponse.json(asset, { status: 201 });
}
