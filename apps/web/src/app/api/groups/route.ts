import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';
import { jsonError } from '@/lib/http/errors';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  const memberships = await prisma.groupMembership.findMany({
    where: { user_id: user.id },
    include: {
      group: {
        include: {
          _count: { select: { memberships: true } },
        },
      },
    },
    orderBy: { joined_at: 'desc' },
  });

  const groups = memberships.map((m) => ({
    id: m.group_id,
    name: m.group.name,
    description: m.group.description,
    role: m.role,
    memberCount: m.group._count.memberships,
  }));

  return NextResponse.json(groups, { status: 200 });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  interface CreateGroupBody {
    name?: string;
    description?: string;
  }

  let body: CreateGroupBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Payload inválido' }, { status: 400 });
  }

  const { name, description } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ message: 'Nome do grupo não pode estar vazio' }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const group = await tx.group.create({
      data: {
        name: name.trim(),
        description: description?.trim() ?? null,
        created_by: user.id,
      },
    });

    await tx.groupMembership.create({
      data: {
        group_id: group.id,
        user_id: user.id,
        role: 'LEADER',
      },
    });

    return group;
  });

  return NextResponse.json(
    {
      id: result.id,
      name: result.name,
      description: result.description,
      created_by: result.created_by,
      created_at: result.created_at.toISOString(),
    },
    { status: 201 },
  );
}
