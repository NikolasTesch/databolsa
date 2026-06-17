import { NextRequest, NextResponse } from 'next/server';
import { AssetClass, Currency, DataSource } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';
import { jsonError } from '@/lib/http/errors';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const rawPage = searchParams.get('page') ?? '1';
  const rawLimit = searchParams.get('limit') ?? '50';

  const page = Number(rawPage);
  const limit = Number(rawLimit);

  if (
    !Number.isInteger(page) ||
    !Number.isInteger(limit) ||
    page < 1 ||
    limit < 1 ||
    limit > 100
  ) {
    return jsonError('INVALID_PAGINATION', 'Parâmetros de paginação inválidos', 400);
  }

  const skip = (page - 1) * limit;

  const [total, assets] = await Promise.all([
    prisma.asset.count({ where: { user_id: user.id } }),
    prisma.asset.findMany({
      where: { user_id: user.id },
      skip,
      take: limit,
      include: { transactions: true },
      orderBy: { ticker: 'asc' },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return NextResponse.json(
    { data: assets, page, limit, total, totalPages },
    { status: 200 },
  );
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  interface CreateAssetBody {
    ticker?: string;
    name?: string;
    asset_class?: string;
    currency?: string;
    data_source?: string;
  }

  let body: CreateAssetBody;
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
  if (!asset_class || !Object.values(AssetClass).includes(asset_class as AssetClass)) {
    return NextResponse.json({ message: 'Classe de ativo inválida' }, { status: 400 });
  }
  if (!currency || !Object.values(Currency).includes(currency as Currency)) {
    return NextResponse.json({ message: 'Moeda inválida' }, { status: 400 });
  }
  if (!data_source || !Object.values(DataSource).includes(data_source as DataSource)) {
    return NextResponse.json({ message: 'Fonte de dados inválida' }, { status: 400 });
  }

  const asset = await prisma.asset.create({
    data: {
      ticker: ticker.toUpperCase(),
      name,
      asset_class: asset_class as AssetClass,
      currency: currency as Currency,
      data_source: data_source as DataSource,
      user_id: user.id,
    },
  });

  return NextResponse.json(asset, { status: 201 });
}
