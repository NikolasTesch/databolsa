import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';
import { jsonError } from '@/lib/http/errors';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(request);
  if (!user) {
    return jsonError('UNAUTHORIZED', 'Não autorizado', 401);
  }

  const membership = await prisma.groupMembership.findUnique({
    where: {
      group_id_user_id: {
        group_id: params.id,
        user_id: user.id,
      },
    },
  });

  if (!membership) {
    return jsonError('FORBIDDEN', 'Usuário não é membro deste grupo', 403);
  }

  const group = await prisma.group.findUnique({
    where: { id: params.id },
    include: {
      memberships: {
        include: {
          user: { select: { id: true, email: true } },
        },
      },
      invites: membership.role === 'LEADER' && {
        where: {
          revoked: false,
          OR: [
            { expires_at: null },
            { expires_at: { gte: new Date() } },
          ],
        },
      },
    },
  });

  if (!group) {
    return jsonError('NOT_FOUND', 'Grupo não encontrado', 404);
  }

  const members = group.memberships.map((m) => ({
    user_id: m.user_id,
    email: m.user.email,
    role: m.role,
    joined_at: m.joined_at.toISOString(),
  }));

  const response: {
    id: string;
    name: string;
    description: string | null;
    created_by: string;
    members: typeof members;
    invites?: {
      id: string;
      code: string;
      role: string;
      expires_at: string | null;
      max_uses: number | null;
      uses: number;
      revoked: boolean;
    }[];
  } = {
    id: group.id,
    name: group.name,
    description: group.description,
    created_by: group.created_by,
    members,
  };

  if (membership.role === 'LEADER' && group.invites) {
    response.invites = group.invites.map((inv) => ({
      id: inv.id,
      code: inv.code,
      role: inv.role,
      expires_at: inv.expires_at?.toISOString() ?? null,
      max_uses: inv.max_uses,
      uses: inv.uses,
      revoked: inv.revoked,
    }));
  }

  return NextResponse.json(response, { status: 200 });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(request);
  if (!user) {
    return jsonError('UNAUTHORIZED', 'Não autorizado', 401);
  }

  const group = await prisma.group.findUnique({
    where: { id: params.id },
  });

  if (!group) {
    return jsonError('NOT_FOUND', 'Grupo não encontrado', 404);
  }

  if (group.created_by !== user.id) {
    return jsonError('FORBIDDEN', 'Apenas o criador pode excluir o grupo', 403);
  }

  await prisma.group.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
