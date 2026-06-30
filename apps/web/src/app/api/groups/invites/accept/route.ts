import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';
import { jsonError } from '@/lib/http/errors';

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return jsonError('UNAUTHORIZED', 'Não autorizado', 401);
  }

  interface AcceptInviteBody {
    code?: string;
  }

  let body: AcceptInviteBody;
  try {
    body = await request.json();
  } catch {
    return jsonError('INVALID_INPUT', 'Payload inválido', 400);
  }

  const { code } = body;

  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return jsonError('INVALID_INVITE_CODE', 'Código de convite inválido', 400);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const invite = await tx.groupInvite.findUnique({
        where: { code: code.trim() },
        include: { group: true },
      });

      if (!invite) {
        throw Object.assign(new Error('Convite não encontrado'), { code: 'INVITE_NOT_FOUND', status: 404 });
      }

      if (invite.revoked) {
        throw Object.assign(new Error('Convite revogado'), { code: 'INVITE_REVOKED', status: 400 });
      }

      if (invite.expires_at && invite.expires_at < new Date()) {
        throw Object.assign(new Error('Convite expirado'), { code: 'INVITE_EXPIRED', status: 400 });
      }

      if (invite.max_uses !== null && invite.uses >= invite.max_uses) {
        throw Object.assign(new Error('Limite de usos excedido'), { code: 'INVITE_MAX_USES', status: 400 });
      }

      // Verifica se o usuário já é membro do grupo
      const existingMembership = await tx.groupMembership.findUnique({
        where: {
          group_id_user_id: {
            group_id: invite.group_id,
            user_id: user.id,
          },
        },
      });

      if (existingMembership) {
        throw Object.assign(new Error('Usuário já é membro deste grupo'), { code: 'ALREADY_MEMBER', status: 409 });
      }

      // Incrementa uses e cria membership
      await tx.groupInvite.update({
        where: { id: invite.id },
        data: { uses: { increment: 1 } },
      });

      await tx.groupMembership.create({
        data: {
          group_id: invite.group_id,
          user_id: user.id,
          role: invite.role,
        },
      });

      return { group_id: invite.group_id, role: invite.role };
    });

    return NextResponse.json(
      { success: true, group_id: result.group_id, role: result.role },
      { status: 200 },
    );
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json(
        { message: err.message, error: { code: err.code } },
        { status: err.status },
      );
    }
    throw err;
  }
}
