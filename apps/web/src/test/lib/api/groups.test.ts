import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockApiFetch = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api/client', () => ({
  apiFetch: mockApiFetch,
}));

describe('groups API client', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('listGroups chama GET /groups', async () => {
    mockApiFetch.mockResolvedValue([{ id: '1', name: 'Grupo Teste', role: 'LEADER', memberCount: 3 }]);
    const { listGroups } = await import('@/lib/api/groups');
    const result = await listGroups();
    expect(mockApiFetch).toHaveBeenCalledWith('/groups');
    expect(result).toHaveLength(1);
  });

  it('createGroup chama POST /groups com body', async () => {
    mockApiFetch.mockResolvedValue({ id: '1', name: 'Novo Grupo', created_by: 'user1', created_at: '2024-01-01' });
    const { createGroup } = await import('@/lib/api/groups');
    const result = await createGroup('Novo Grupo', 'Descrição');
    expect(mockApiFetch).toHaveBeenCalledWith('/groups', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ name: 'Novo Grupo', description: 'Descrição' }),
    }));
    expect(result.name).toBe('Novo Grupo');
  });

  it('acceptInvite chama POST /groups/invites/accept', async () => {
    mockApiFetch.mockResolvedValue({ success: true, group_id: '1', role: 'MEMBER' });
    const { acceptInvite } = await import('@/lib/api/groups');
    const result = await acceptInvite('invite-code');
    expect(mockApiFetch).toHaveBeenCalledWith('/groups/invites/accept', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ code: 'invite-code' }),
    }));
    expect(result.success).toBe(true);
  });
});
