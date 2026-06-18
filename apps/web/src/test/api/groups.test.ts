// @vitest-environment node
/**
 * SPEC-0038 — Grupos de investimento: endpoints REST (fase 2/3)
 *
 * Cobre: REQ-01..REQ-06, AC-01..AC-06
 * TC-01..TC-10
 */
import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Decimal } from 'decimal.js';
import prisma from '@/lib/prisma';

// ---------------------------------------------------------------------------
// Mocks globais
// ---------------------------------------------------------------------------

vi.mock('@/lib/prisma', () => ({
  default: {
    user: { findUnique: vi.fn() },
    group: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
    groupMembership: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    groupInvite: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/quotes/quote.service', () => ({
  quoteService: {
    getQuote: vi.fn(),
    getFxRate: vi.fn(),
  },
  QuoteService: class {},
}));

vi.mock('@/lib/portfolio/positions', () => ({
  computePositions: vi.fn(),
}));

import { signAccessToken } from '@/lib/auth/jwt';
import { computePositions } from '@/lib/portfolio/positions';
import { quoteService } from '@/lib/quotes/quote.service';

// Import handlers
import { GET as groupsGet, POST as groupsPost } from '@/app/api/groups/route';
import { GET as groupDetailsGet, DELETE as groupDelete } from '@/app/api/groups/[id]/route';
import { POST as invitesPost } from '@/app/api/groups/[id]/invites/route';
import { POST as acceptInvitePost } from '@/app/api/groups/invites/accept/route';
import { DELETE as revokeInviteDelete } from '@/app/api/groups/[id]/invites/[inviteId]/route';
import { DELETE as memberDelete } from '@/app/api/groups/[id]/members/[userId]/route';
import { GET as summaryGet } from '@/app/api/portfolio/summary/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function makeAuthRequest(
  url: string,
  options: RequestInit = {},
): Promise<NextRequest> {
  const token = await signAccessToken({ sub: 'user-1', email: 'test@test.com' });
  return new NextRequest(url, {
    ...options,
    headers: {
      ...(options.headers as Record<string, string> ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
}

function mockAuthUser(userId = 'user-1') {
  vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: 'USER' } as any);
}

function makeStubGroup(overrides: Record<string, any> = {}) {
  return {
    id: 'group-1',
    name: 'Grupo Alfa',
    description: 'Descrição do Grupo Alfa',
    created_by: 'user-1',
    created_at: new Date('2026-06-17'),
    ...overrides,
  };
}

function makeStubMembership(overrides: Record<string, any> = {}) {
  return {
    id: 'membership-1',
    group_id: 'group-1',
    user_id: 'user-1',
    role: 'LEADER',
    joined_at: new Date('2026-06-17'),
    ...overrides,
  };
}

function makeStubInvite(overrides: Record<string, any> = {}) {
  return {
    id: 'invite-1',
    group_id: 'group-1',
    code: 'abc-123-uuid',
    role: 'MEMBER',
    created_by: 'user-1',
    expires_at: null,
    max_uses: null,
    uses: 0,
    revoked: false,
    created_at: new Date('2026-06-17'),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthUser();
});

// ===========================================================================
// POST /api/groups — Criação de grupo
// ===========================================================================

describe('POST /api/groups', () => {
  it('retorna 401 sem JWT', async () => {
    const req = new NextRequest('http://localhost:3000/api/groups', {
      method: 'POST',
      body: JSON.stringify({ name: 'Grupo Alfa' }),
    });
    const res = await groupsPost(req);
    expect(res.status).toBe(401);
  });

  it('retorna 400 para nome vazio', async () => {
    const req = await makeAuthRequest('http://localhost:3000/api/groups', {
      method: 'POST',
      body: JSON.stringify({ name: '' }),
    });
    const res = await groupsPost(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toContain('vazio');
  });

  it('cria grupo com membership LEADER em transação', async () => {
    const stubGroup = makeStubGroup();

    // $transaction com callback executa a fn com tx que tem os mesmos métodos mockados
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      const tx = {
        group: { create: vi.fn().mockResolvedValue(stubGroup) },
        groupMembership: { create: vi.fn().mockResolvedValue(makeStubMembership()) },
      };
      return fn(tx);
    });

    const req = await makeAuthRequest('http://localhost:3000/api/groups', {
      method: 'POST',
      body: JSON.stringify({ name: 'Grupo Alfa', description: 'Descrição do Grupo Alfa' }),
    });
    const res = await groupsPost(req);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.id).toBe('group-1');
    expect(body.name).toBe('Grupo Alfa');
    expect(body.description).toBe('Descrição do Grupo Alfa');
    expect(body.created_by).toBe('user-1');
  });
});

// ===========================================================================
// GET /api/groups — Listagem de grupos
// ===========================================================================

describe('GET /api/groups', () => {
  it('retorna 401 sem JWT', async () => {
    const req = new NextRequest('http://localhost:3000/api/groups');
    const res = await groupsGet(req);
    expect(res.status).toBe(401);
  });

  it('lista grupos do usuário com memberCount', async () => {
    vi.mocked(prisma.groupMembership.findMany).mockResolvedValue([
      {
        group_id: 'group-1',
        role: 'LEADER',
        joined_at: new Date('2026-06-17'),
        group: {
          id: 'group-1',
          name: 'Grupo Alfa',
          description: 'Descrição',
          created_by: 'user-1',
          created_at: new Date('2026-06-17'),
          _count: { memberships: 3 },
        },
      },
      {
        group_id: 'group-2',
        role: 'MEMBER',
        joined_at: new Date('2026-06-17'),
        group: {
          id: 'group-2',
          name: 'Grupo Beta',
          description: null,
          created_by: 'user-2',
          created_at: new Date('2026-06-17'),
          _count: { memberships: 5 },
        },
      },
    ]);

    const req = await makeAuthRequest('http://localhost:3000/api/groups');
    const res = await groupsGet(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].id).toBe('group-1');
    expect(body[0].name).toBe('Grupo Alfa');
    expect(body[0].role).toBe('LEADER');
    expect(body[0].memberCount).toBe(3);
    expect(body[1].id).toBe('group-2');
    expect(body[1].role).toBe('MEMBER');
    expect(body[1].memberCount).toBe(5);
  });
});

// ===========================================================================
// GET /api/groups/[id] — Detalhes do grupo
// ===========================================================================

describe('GET /api/groups/[id]', () => {
  it('retorna 403 se usuário não é membro', async () => {
    vi.mocked(prisma.groupMembership.findUnique).mockResolvedValue(null);

    const req = await makeAuthRequest('http://localhost:3000/api/groups/group-1');
    const res = await groupDetailsGet(req, { params: { id: 'group-1' } });
    expect(res.status).toBe(403);
  });

  it('líder vê detalhes do grupo com invites ativos', async () => {
    vi.mocked(prisma.groupMembership.findUnique).mockResolvedValue(
      makeStubMembership({ role: 'LEADER' }),
    );

    const stubGroup = makeStubGroup({
      memberships: [
        { user_id: 'user-1', role: 'LEADER', joined_at: new Date('2026-06-17'), user: { id: 'user-1', email: 'leader@test.com' } },
        { user_id: 'user-2', role: 'MEMBER', joined_at: new Date('2026-06-17'), user: { id: 'user-2', email: 'member@test.com' } },
      ],
      invites: [makeStubInvite()],
    });

    vi.mocked(prisma.group.findUnique).mockResolvedValue(stubGroup);

    const req = await makeAuthRequest('http://localhost:3000/api/groups/group-1');
    const res = await groupDetailsGet(req, { params: { id: 'group-1' } });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.id).toBe('group-1');
    expect(body.members).toHaveLength(2);
    expect(body.invites).toBeDefined();
    expect(body.invites).toHaveLength(1);
    expect(body.invites[0].code).toBe('abc-123-uuid');
  });

  it('membro NÃO vê invites', async () => {
    vi.mocked(prisma.groupMembership.findUnique).mockResolvedValue(
      makeStubMembership({ role: 'MEMBER' }),
    );

    const stubGroup = makeStubGroup({
      memberships: [
        { user_id: 'user-1', role: 'MEMBER', joined_at: new Date('2026-06-17'), user: { id: 'user-1', email: 'member@test.com' } },
      ],
      // invites não é incluído quando role não é LEADER — mas o mock retorna mesmo assim;
      // a lógica do handler usa invites: membership.role === 'LEADER' && { ... }
      // que retorna false para MEMBER, então invites não entra no include
    });

    vi.mocked(prisma.group.findUnique).mockResolvedValue(stubGroup);

    const req = await makeAuthRequest('http://localhost:3000/api/groups/group-1');
    const res = await groupDetailsGet(req, { params: { id: 'group-1' } });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.invites).toBeUndefined();
  });
});

// ===========================================================================
// DELETE /api/groups/[id] — Excluir grupo
// ===========================================================================

describe('DELETE /api/groups/[id]', () => {
  it('só o criador pode excluir', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue(
      makeStubGroup({ created_by: 'user-2' }),
    );

    const req = await makeAuthRequest('http://localhost:3000/api/groups/group-1', {
      method: 'DELETE',
    });
    const res = await groupDelete(req, { params: { id: 'group-1' } });
    expect(res.status).toBe(403);
  });

  it('exclui grupo com sucesso', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue(makeStubGroup());
    vi.mocked(prisma.group.delete).mockResolvedValue(makeStubGroup());

    const req = await makeAuthRequest('http://localhost:3000/api/groups/group-1', {
      method: 'DELETE',
    });
    const res = await groupDelete(req, { params: { id: 'group-1' } });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(prisma.group.delete).toHaveBeenCalledWith({ where: { id: 'group-1' } });
  });
});

// ===========================================================================
// POST /api/groups/[id]/invites — Gerar convite
// ===========================================================================

describe('POST /api/groups/[id]/invites', () => {
  it('membro comum NÃO pode criar convite (403)', async () => {
    vi.mocked(prisma.groupMembership.findUnique).mockResolvedValue(
      makeStubMembership({ role: 'MEMBER' }),
    );

    const req = await makeAuthRequest('http://localhost:3000/api/groups/group-1/invites', {
      method: 'POST',
      body: JSON.stringify({ role: 'MEMBER' }),
    });
    const res = await invitesPost(req, { params: { id: 'group-1' } });
    expect(res.status).toBe(403);
  });

  it('líder cria convite com código UUID', async () => {
    vi.mocked(prisma.groupMembership.findUnique).mockResolvedValue(
      makeStubMembership({ role: 'LEADER' }),
    );
    vi.mocked(prisma.groupInvite.create).mockResolvedValue(makeStubInvite());

    const req = await makeAuthRequest('http://localhost:3000/api/groups/group-1/invites', {
      method: 'POST',
      body: JSON.stringify({ role: 'MEMBER' }),
    });
    const res = await invitesPost(req, { params: { id: 'group-1' } });
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.code).toBe('abc-123-uuid');
    expect(body.role).toBe('MEMBER');
  });

  it('líder cria convite com expiração e max_uses', async () => {
    const expiresAt = new Date(Date.now() + 7 * 86400000);
    vi.mocked(prisma.groupMembership.findUnique).mockResolvedValue(
      makeStubMembership({ role: 'LEADER' }),
    );
    vi.mocked(prisma.groupInvite.create).mockResolvedValue(
      makeStubInvite({ expires_at: expiresAt, max_uses: 5 }),
    );

    const req = await makeAuthRequest('http://localhost:3000/api/groups/group-1/invites', {
      method: 'POST',
      body: JSON.stringify({ role: 'MEMBER', expires_in_days: 7, max_uses: 5 }),
    });
    const res = await invitesPost(req, { params: { id: 'group-1' } });
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.expires_at).toBeDefined();
    expect(body.max_uses).toBe(5);
  });
});

// ===========================================================================
// POST /api/groups/invites/accept — Aceitar convite
// ===========================================================================

describe('POST /api/groups/invites/accept', () => {
  it('aceita convite válido com sucesso', async () => {
    const stubInvite = makeStubInvite();
    const stubMembership = makeStubMembership({ user_id: 'user-2', role: 'MEMBER' });

    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      const tx = {
        groupInvite: {
          findUnique: vi.fn().mockResolvedValue(stubInvite),
          update: vi.fn().mockResolvedValue({ ...stubInvite, uses: 1 }),
        },
        groupMembership: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue(stubMembership),
        },
      };
      return fn(tx);
    });

    const req = await makeAuthRequest('http://localhost:3000/api/groups/invites/accept', {
      method: 'POST',
      body: JSON.stringify({ code: 'abc-123-uuid' }),
    });
    const res = await acceptInvitePost(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.group_id).toBe('group-1');
    expect(body.role).toBe('MEMBER');
  });

  it('rejeita convite revogado', async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      const tx = {
        groupInvite: {
          findUnique: vi.fn().mockResolvedValue(makeStubInvite({ revoked: true })),
        },
        groupMembership: { findUnique: vi.fn() },
      };
      return fn(tx);
    });

    const req = await makeAuthRequest('http://localhost:3000/api/groups/invites/accept', {
      method: 'POST',
      body: JSON.stringify({ code: 'abc-123-uuid' }),
    });
    const res = await acceptInvitePost(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.message).toContain('revogado');
  });

  it('rejeita convite expirado', async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      const tx = {
        groupInvite: {
          findUnique: vi.fn().mockResolvedValue(
            makeStubInvite({ expires_at: new Date('2020-01-01') }),
          ),
        },
        groupMembership: { findUnique: vi.fn() },
      };
      return fn(tx);
    });

    const req = await makeAuthRequest('http://localhost:3000/api/groups/invites/accept', {
      method: 'POST',
      body: JSON.stringify({ code: 'abc-123-uuid' }),
    });
    const res = await acceptInvitePost(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.message).toContain('expirado');
  });

  it('rejeita convite com max_uses excedido', async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      const tx = {
        groupInvite: {
          findUnique: vi.fn().mockResolvedValue(
            makeStubInvite({ max_uses: 1, uses: 1 }),
          ),
        },
        groupMembership: { findUnique: vi.fn() },
      };
      return fn(tx);
    });

    const req = await makeAuthRequest('http://localhost:3000/api/groups/invites/accept', {
      method: 'POST',
      body: JSON.stringify({ code: 'abc-123-uuid' }),
    });
    const res = await acceptInvitePost(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.message).toContain('Limite');
  });

  it('rejeita usuário que já é membro (409)', async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      const tx = {
        groupInvite: {
          findUnique: vi.fn().mockResolvedValue(makeStubInvite()),
        },
        groupMembership: {
          findUnique: vi.fn().mockResolvedValue(makeStubMembership()),
        },
      };
      return fn(tx);
    });

    const req = await makeAuthRequest('http://localhost:3000/api/groups/invites/accept', {
      method: 'POST',
      body: JSON.stringify({ code: 'abc-123-uuid' }),
    });
    const res = await acceptInvitePost(req);
    expect(res.status).toBe(409);
  });

  it('rejeita convite inexistente', async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      const tx = {
        groupInvite: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
        groupMembership: { findUnique: vi.fn() },
      };
      return fn(tx);
    });

    const req = await makeAuthRequest('http://localhost:3000/api/groups/invites/accept', {
      method: 'POST',
      body: JSON.stringify({ code: 'nonexistent-code' }),
    });
    const res = await acceptInvitePost(req);
    expect(res.status).toBe(404);
  });
});

// ===========================================================================
// DELETE /api/groups/[id]/invites/[inviteId] — Revogar convite
// ===========================================================================

describe('DELETE /api/groups/[id]/invites/[inviteId]', () => {
  it('membro NÃO pode revogar convite (403)', async () => {
    vi.mocked(prisma.groupMembership.findUnique).mockResolvedValue(
      makeStubMembership({ role: 'MEMBER' }),
    );

    const req = await makeAuthRequest(
      'http://localhost:3000/api/groups/group-1/invites/invite-1',
      { method: 'DELETE' },
    );
    const res = await revokeInviteDelete(req, { params: { id: 'group-1', inviteId: 'invite-1' } });
    expect(res.status).toBe(403);
  });

  it('líder revoga convite com sucesso', async () => {
    vi.mocked(prisma.groupMembership.findUnique).mockResolvedValue(
      makeStubMembership({ role: 'LEADER' }),
    );
    vi.mocked(prisma.groupInvite.findFirst).mockResolvedValue(makeStubInvite());
    vi.mocked(prisma.groupInvite.update).mockResolvedValue(makeStubInvite({ revoked: true }));

    const req = await makeAuthRequest(
      'http://localhost:3000/api/groups/group-1/invites/invite-1',
      { method: 'DELETE' },
    );
    const res = await revokeInviteDelete(req, { params: { id: 'group-1', inviteId: 'invite-1' } });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(prisma.groupInvite.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'invite-1' },
        data: { revoked: true },
      }),
    );
  });
});

// ===========================================================================
// DELETE /api/groups/[id]/members/[userId] — Remover membro / Sair
// ===========================================================================

describe('DELETE /api/groups/[id]/members/[userId]', () => {
  it('membro sai do grupo por conta própria', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue(makeStubGroup());
    vi.mocked(prisma.groupMembership.findUnique).mockResolvedValue(
      makeStubMembership({ user_id: 'user-1', role: 'MEMBER' }),
    );
    vi.mocked(prisma.groupMembership.delete).mockResolvedValue(makeStubMembership());

    const req = await makeAuthRequest(
      'http://localhost:3000/api/groups/group-1/members/user-1',
      { method: 'DELETE' },
    );
    const res = await memberDelete(req, { params: { id: 'group-1', userId: 'user-1' } });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('último líder não pode sair (400)', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue(makeStubGroup());
    vi.mocked(prisma.groupMembership.findUnique).mockResolvedValue(
      makeStubMembership({ user_id: 'user-1', role: 'LEADER' }),
    );
    vi.mocked(prisma.groupMembership.count).mockResolvedValue(1);

    const req = await makeAuthRequest(
      'http://localhost:3000/api/groups/group-1/members/user-1',
      { method: 'DELETE' },
    );
    const res = await memberDelete(req, { params: { id: 'group-1', userId: 'user-1' } });
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.message).toContain('Último líder');
  });

  it('líder remove membro com sucesso', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue(makeStubGroup());
    // Requisitante é LEADER
    vi.mocked(prisma.groupMembership.findUnique).mockImplementation(async ({ where }: any) => {
      if (where.group_id_user_id?.user_id === 'user-1') {
        return makeStubMembership({ user_id: 'user-1', role: 'LEADER' });
      }
      if (where.group_id_user_id?.user_id === 'user-2') {
        return makeStubMembership({ user_id: 'user-2', role: 'MEMBER' });
      }
      return null;
    });
    vi.mocked(prisma.groupMembership.delete).mockResolvedValue(makeStubMembership());

    const req = await makeAuthRequest(
      'http://localhost:3000/api/groups/group-1/members/user-2',
      { method: 'DELETE' },
    );
    const res = await memberDelete(req, { params: { id: 'group-1', userId: 'user-2' } });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('não-líder não pode remover outro membro (403)', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue(makeStubGroup());
    // Requisitante é MEMBER
    vi.mocked(prisma.groupMembership.findUnique).mockImplementation(async ({ where }: any) => {
      if (where.group_id_user_id?.user_id === 'user-1') {
        return makeStubMembership({ user_id: 'user-1', role: 'MEMBER' });
      }
      if (where.group_id_user_id?.user_id === 'user-3') {
        return makeStubMembership({ user_id: 'user-3', role: 'MEMBER' });
      }
      return null;
    });

    const req = await makeAuthRequest(
      'http://localhost:3000/api/groups/group-1/members/user-3',
      { method: 'DELETE' },
    );
    const res = await memberDelete(req, { params: { id: 'group-1', userId: 'user-3' } });
    expect(res.status).toBe(403);
  });

  it('líder não pode remover outro líder (400)', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue(makeStubGroup());
    vi.mocked(prisma.groupMembership.findUnique).mockImplementation(async ({ where }: any) => {
      if (where.group_id_user_id?.user_id === 'user-1') {
        return makeStubMembership({ user_id: 'user-1', role: 'LEADER' });
      }
      if (where.group_id_user_id?.user_id === 'user-2') {
        return makeStubMembership({ user_id: 'user-2', role: 'LEADER' });
      }
      return null;
    });

    const req = await makeAuthRequest(
      'http://localhost:3000/api/groups/group-1/members/user-2',
      { method: 'DELETE' },
    );
    const res = await memberDelete(req, { params: { id: 'group-1', userId: 'user-2' } });
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.message).toContain('Não é possível remover um líder');
  });
});

// ===========================================================================
// Portfolio cross-user — GET /api/portfolio/summary?targetUserId=
// ===========================================================================

describe('GET /api/portfolio/summary cross-user', () => {
  it('AC-05: líder vê carteira de membro com targetUserId', async () => {
    // assertCanViewPortfolio chama groupMembership.findMany para verificar se viewer é LEADER
    vi.mocked(prisma.groupMembership.findMany).mockResolvedValue([
      { group_id: 'group-1' },
    ]);
    vi.mocked(prisma.groupMembership.findFirst).mockResolvedValue(
      makeStubMembership({ user_id: 'user-2', role: 'MEMBER' }),
    );

    // computePositions é chamado com targetUserId
    vi.mocked(computePositions).mockResolvedValue({
      positions: [],
      totalBrl: new Decimal('15000'),
      anyStale: false,
    });

    const req = await makeAuthRequest(
      'http://localhost:3000/api/portfolio/summary?targetUserId=user-2',
    );
    const res = await summaryGet(req);
    expect(res.status).toBe(200);

    expect(computePositions).toHaveBeenCalledWith('user-2');
  });

  it('AC-06: membro NÃO vê carteira de outro membro (403)', async () => {
    // viewer (user-1) não é LEADER de nenhum grupo onde user-2 está
    vi.mocked(prisma.groupMembership.findMany).mockResolvedValue([]);

    const req = await makeAuthRequest(
      'http://localhost:3000/api/portfolio/summary?targetUserId=user-2',
    );
    const res = await summaryGet(req);
    expect(res.status).toBe(403);

    // computePositions não deve ser chamado
    expect(computePositions).not.toHaveBeenCalled();
  });

  it('sem targetUserId usa user.id do JWT', async () => {
    vi.mocked(computePositions).mockResolvedValue({
      positions: [],
      totalBrl: new Decimal('10000'),
      anyStale: false,
    });

    const req = await makeAuthRequest('http://localhost:3000/api/portfolio/summary');
    const res = await summaryGet(req);
    expect(res.status).toBe(200);

    // Deve usar user.id (user-1)
    expect(computePositions).toHaveBeenCalledWith('user-1');
  });

  it('targetUserId igual a user.id não chama assertCanViewPortfolio', async () => {
    vi.mocked(computePositions).mockResolvedValue({
      positions: [],
      totalBrl: new Decimal('10000'),
      anyStale: false,
    });

    const req = await makeAuthRequest(
      'http://localhost:3000/api/portfolio/summary?targetUserId=user-1',
    );
    const res = await summaryGet(req);
    expect(res.status).toBe(200);

    // findMany não deve ser chamado (assertCanViewPortfolio não executa query)
    expect(prisma.groupMembership.findMany).not.toHaveBeenCalled();
    expect(computePositions).toHaveBeenCalledWith('user-1');
  });
});
