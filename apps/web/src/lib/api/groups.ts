import { apiFetch } from './client';
import type {
  GroupListItem,
  GroupDetail,
  CreateGroupResponse,
  CreateInviteResponse,
  AcceptInviteResponse,
} from '@/types/api';

export async function createGroup(
  name: string,
  description?: string,
): Promise<CreateGroupResponse> {
  return apiFetch<CreateGroupResponse>('/groups', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  });
}

export async function listGroups(): Promise<GroupListItem[]> {
  return apiFetch<GroupListItem[]>('/groups');
}

export async function getGroup(id: string): Promise<GroupDetail> {
  return apiFetch<GroupDetail>(`/groups/${id}`);
}

export async function deleteGroup(id: string): Promise<void> {
  return apiFetch<void>(`/groups/${id}`, { method: 'DELETE' });
}

export async function createInvite(
  groupId: string,
  options?: { role?: string; expires_in_days?: number; max_uses?: number },
): Promise<CreateInviteResponse> {
  return apiFetch<CreateInviteResponse>(`/groups/${groupId}/invites`, {
    method: 'POST',
    body: JSON.stringify(options ?? {}),
  });
}

export async function acceptInvite(code: string): Promise<AcceptInviteResponse> {
  return apiFetch<AcceptInviteResponse>('/groups/invites/accept', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function revokeInvite(
  groupId: string,
  inviteId: string,
): Promise<void> {
  return apiFetch<void>(`/groups/${groupId}/invites/${inviteId}`, {
    method: 'DELETE',
  });
}

export async function removeMember(
  groupId: string,
  userId: string,
): Promise<void> {
  return apiFetch<void>(`/groups/${groupId}/members/${userId}`, {
    method: 'DELETE',
  });
}
