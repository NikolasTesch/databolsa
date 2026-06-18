import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';
import { jsonError } from '@/lib/http/errors';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } },
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  // Verifica se o grupo existe
  const group = await prisma.group.findUnique({
    where: { id: params.id },
  });

  if (!group) {
    return jsonError('NOT_FOUND', 'Grupo não encontrado', 404);
  }

  // Verifica se o alvo é membro do grupo
  const targetMembership = await prisma.groupMembership.findUnique({
    where: {
      group_id_user_id: {
        group_id: params.id,
        user_id: params.userId,
      },
    },
  });

  if (!targetMembership) {
    return jsonError('NOT_FOUND', 'Membro não encontrado no grupo', 404);
  }

  if (params.userId === user.id) {
    // Saindo por conta própria
    if (targetMembership.role === 'LEADER') {
      // Verifica se é o último LEADER
      const leaderCount = await prisma.groupMembership.count({
        where: {
          group_id: params.id,
          role: 'LEADER',
        },
      });

      if (leaderCount <= 1) {
        return jsonError(
          'LAST_LEADER',
          'Último líder não pode sair do grupo. Transfira a liderança ou exclua o grupo.',
          400,
        );
      }
    }

    await prisma.groupMembership.delete({
      where: {
        group_id_user_id: {
          group_id: params.id,
          user_id: params.userId,
        },
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  }

  // Líder removendo outro membro
  const requesterMembership = await prisma.groupMembership.findUnique({
    where: {
      group_id_user_id: {
        group_id: params.id,
        user_id: user.id,
      },
    },
  });

  if (!requesterMembership || requesterMembership.role !== 'LEADER') {
    return jsonError('FORBIDDEN', 'Apenas líderes podem remover membros do grupo', 403);
  }

  if (targetMembership.role === 'LEADER') {
    return jsonError('CANNOT_REMOVE_LEADER', 'Não é possível remover um líder do grupo', 400);
  }

  await prisma.groupMembership.delete({
    where: {
      group_id_user_id: {
        group_id: params.id,
        user_id: params.userId,
      },
    },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
