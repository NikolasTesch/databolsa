import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';

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
