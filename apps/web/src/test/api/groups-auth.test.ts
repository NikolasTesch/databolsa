// @vitest-environment node
/**
 * SPEC-0037 — Grupos de investimento: autorização cross-user e guard de admin.
 *
 * Cobre: REQ-05, REQ-06, AC-01..AC-06
 * TC-01..TC-09
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import prisma from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  default: {
    groupMembership: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Importar após o mock para garantir que as funções usam o prisma mockado
import { assertCanViewPortfolio } from '@/lib/auth/groups';
import { assertIsAdmin } from '@/lib/auth/admin';

const mockGroupMembership = prisma.groupMembership as {
  findMany: ReturnType<typeof vi.fn>;
  findFirst: ReturnType<typeof vi.fn>;
};

const mockUser = prisma.user as {
  findUnique: ReturnType<typeof vi.fn>;
};

describe('assertCanViewPortfolio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TC-01: viewerId === targetUserId → resolve sem chamar o Prisma (AC-01)', async () => {
    await expect(assertCanViewPortfolio('user-1', 'user-1')).resolves.toBeUndefined();
    expect(mockGroupMembership.findMany).not.toHaveBeenCalled();
    expect(mockGroupMembership.findFirst).not.toHaveBeenCalled();
  });

  it('TC-02: viewer é LEADER do grupo X, target é MEMBER do grupo X → resolve (AC-02)', async () => {
    mockGroupMembership.findMany.mockResolvedValueOnce([
      { group_id: 'group-x' },
    ]);
    mockGroupMembership.findFirst.mockResolvedValueOnce({
      id: 'membership-1',
      group_id: 'group-x',
      user_id: 'target-1',
      role: 'MEMBER',
    });

    await expect(
      assertCanViewPortfolio('viewer-1', 'target-1')
    ).resolves.toBeUndefined();

    expect(mockGroupMembership.findMany).toHaveBeenCalledWith({
      where: { user_id: 'viewer-1', role: 'LEADER' },
      select: { group_id: true },
    });
    expect(mockGroupMembership.findFirst).toHaveBeenCalledWith({
      where: {
        group_id: { in: ['group-x'] },
        user_id: 'target-1',
      },
    });
  });

  it('TC-03: viewer é LEADER do grupo X, target NÃO está no grupo X → rejeita FORBIDDEN (AC-03)', async () => {
    mockGroupMembership.findMany.mockResolvedValueOnce([
      { group_id: 'group-x' },
    ]);
    mockGroupMembership.findFirst.mockResolvedValueOnce(null);

    await expect(
      assertCanViewPortfolio('viewer-1', 'target-1')
    ).rejects.toThrow('FORBIDDEN');
  });

  it('TC-04: viewer é MEMBER (não LEADER) do grupo X, target é membro → rejeita FORBIDDEN (AC-04)', async () => {
    // findMany retorna vazio porque viewer não é LEADER de nenhum grupo
    mockGroupMembership.findMany.mockResolvedValueOnce([]);

    await expect(
      assertCanViewPortfolio('viewer-1', 'target-1')
    ).rejects.toThrow('FORBIDDEN');

    // findFirst não deve ser chamado se não há grupos de liderança
    expect(mockGroupMembership.findFirst).not.toHaveBeenCalled();
  });

  it('TC-05: viewer sem nenhum grupo → rejeita FORBIDDEN (AC-03)', async () => {
    mockGroupMembership.findMany.mockResolvedValueOnce([]);

    await expect(
      assertCanViewPortfolio('viewer-sem-grupo', 'target-1')
    ).rejects.toThrow('FORBIDDEN');

    expect(mockGroupMembership.findFirst).not.toHaveBeenCalled();
  });

  it('TC-06: viewer é LEADER do grupo X e do grupo Y, target está só no grupo Y → resolve via grupo Y (AC-02)', async () => {
    mockGroupMembership.findMany.mockResolvedValueOnce([
      { group_id: 'group-x' },
      { group_id: 'group-y' },
    ]);
    // target está no grupo Y
    mockGroupMembership.findFirst.mockResolvedValueOnce({
      id: 'membership-2',
      group_id: 'group-y',
      user_id: 'target-1',
      role: 'MEMBER',
    });

    await expect(
      assertCanViewPortfolio('viewer-1', 'target-1')
    ).resolves.toBeUndefined();

    expect(mockGroupMembership.findFirst).toHaveBeenCalledWith({
      where: {
        group_id: { in: ['group-x', 'group-y'] },
        user_id: 'target-1',
      },
    });
  });

  it('TC-10: viewer é LEADER de X e Y mas target não está em nenhum dos dois → rejeita FORBIDDEN', async () => {
    mockGroupMembership.findMany.mockResolvedValueOnce([
      { group_id: 'group-x' },
      { group_id: 'group-y' },
    ]);
    // target não está em nenhum grupo liderado pelo viewer
    mockGroupMembership.findFirst.mockResolvedValueOnce(null);

    await expect(
      assertCanViewPortfolio('viewer-1', 'target-sem-grupo')
    ).rejects.toThrow('FORBIDDEN');

    expect(mockGroupMembership.findFirst).toHaveBeenCalledWith({
      where: {
        group_id: { in: ['group-x', 'group-y'] },
        user_id: 'target-sem-grupo',
      },
    });
  });

  it('TC-11: erro de DB em findMany propaga (fail-closed) → rejeita sem vazar acesso', async () => {
    mockGroupMembership.findMany.mockRejectedValueOnce(new Error('DB_ERROR'));

    await expect(
      assertCanViewPortfolio('viewer-1', 'target-1')
    ).rejects.toThrow('DB_ERROR');

    // findFirst não deve ser chamado: falha antes de avaliar target
    expect(mockGroupMembership.findFirst).not.toHaveBeenCalled();
  });
});

describe('assertIsAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TC-07: userId com role=ADMIN → resolve (AC-05)', async () => {
    mockUser.findUnique.mockResolvedValueOnce({ role: 'ADMIN' });

    await expect(assertIsAdmin('admin-user-1')).resolves.toBeUndefined();

    expect(mockUser.findUnique).toHaveBeenCalledWith({
      where: { id: 'admin-user-1' },
      select: { role: true },
    });
  });

  it('TC-08: userId com role=USER → rejeita FORBIDDEN (AC-06)', async () => {
    mockUser.findUnique.mockResolvedValueOnce({ role: 'USER' });

    await expect(assertIsAdmin('regular-user-1')).rejects.toThrow('FORBIDDEN');
  });

  it('TC-09: userId inexistente → rejeita FORBIDDEN (AC-06)', async () => {
    mockUser.findUnique.mockResolvedValueOnce(null);

    await expect(assertIsAdmin('nonexistent-user')).rejects.toThrow('FORBIDDEN');
  });

  it('TC-12: erro de DB em findUnique propaga (fail-closed) → rejeita sem conceder acesso', async () => {
    mockUser.findUnique.mockRejectedValueOnce(new Error('DB_ERROR'));

    await expect(assertIsAdmin('any-user')).rejects.toThrow('DB_ERROR');
  });
});
