import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';
import { jsonError } from '@/lib/http/errors';
import { GroupMemberRole } from '@prisma/client';

const VALID_ROLES: GroupMemberRole[] = ['LEADER', 'MEMBER'];

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

  if (!membership || membership.role !== 'LEADER') {
    return jsonError('FORBIDDEN', 'Apenas líderes do grupo podem criar convites', 403);
  }

  interface CreateInviteBody {
    role?: string;
    expires_in_days?: number;
    max_uses?: number;
  }

  let body: CreateInviteBody;
  try {
    body = await request.json();
  } catch {
    return jsonError('INVALID_INPUT', 'Payload inválido', 400);
  }

  const inviteRole = body.role ?? 'MEMBER';
  if (!VALID_ROLES.includes(inviteRole as GroupMemberRole)) {
    return jsonError('INVALID_ROLE', 'Papel inválido', 400);
  }

  if (body.expires_in_days !== undefined && (typeof body.expires_in_days !== 'number' || body.expires_in_days <= 0)) {
    return jsonError('INVALID_EXPIRATION', 'expires_in_days deve ser um número positivo', 400);
  }

  if (body.max_uses !== undefined && (typeof body.max_uses !== 'number' || body.max_uses <= 0)) {
    return jsonError('INVALID_MAX_USES', 'max_uses deve ser um número positivo', 400);
  }

  const expiresAt = body.expires_in_days
    ? new Date(Date.now() + body.expires_in_days * 86400000)
    : null;

  const invite = await prisma.groupInvite.create({
    data: {
      group_id: params.id,
      code: crypto.randomUUID(),
      role: inviteRole as GroupMemberRole,
      created_by: user.id,
      expires_at: expiresAt,
      max_uses: body.max_uses ?? null,
    },
  });

  return NextResponse.json(
    {
      id: invite.id,
      code: invite.code,
      role: invite.role,
      expires_at: invite.expires_at?.toISOString() ?? null,
      max_uses: invite.max_uses,
    },
    { status: 201 },
  );
}
