import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';
import { jsonError } from '@/lib/http/errors';

// DELETE /api/portfolio/watch/[id] — remove from watchlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getAuthUser(request);
  if (!user) return jsonError('UNAUTHORIZED', 'Não autorizado', 401);

  const watch = await prisma.assetWatch.findUnique({
    where: { id: params.id },
  });

  if (!watch) {
    return jsonError('NOT_FOUND', 'Ativo não encontrado na watchlist', 404);
  }

  if (watch.user_id !== user.id) {
    return jsonError('FORBIDDEN', 'Você não pode remover este item', 403);
  }

  await prisma.assetWatch.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
