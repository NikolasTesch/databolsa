import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';
import { jsonError } from '@/lib/http/errors';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; inviteId: string } },
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  // Verifica se o usuário é LEADER do grupo
  const membership = await prisma.groupMembership.findUnique({
    where: {
      group_id_user_id: {
        group_id: params.id,
        user_id: user.id,
      },
    },
  });

  if (!membership || membership.role !== 'LEADER') {
    return jsonError('FORBIDDEN', 'Apenas líderes do grupo podem revogar convites', 403);
  }

  const invite = await prisma.groupInvite.findFirst({
    where: {
      id: params.inviteId,
      group_id: params.id,
    },
  });

  if (!invite) {
    return jsonError('NOT_FOUND', 'Convite não encontrado', 404);
  }

  await prisma.groupInvite.update({
    where: { id: params.inviteId },
    data: { revoked: true },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
