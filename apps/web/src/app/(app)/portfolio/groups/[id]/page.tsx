'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import {
  getGroup,
  deleteGroup,
  createInvite,
  revokeInvite,
  removeMember,
} from '@/lib/api/groups';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'LEADER'>('MEMBER');
  const [expiresDays, setExpiresDays] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [lastInviteCode, setLastInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: group, isLoading, error } = useQuery({
    queryKey: queryKeys.groups.detail(id),
    queryFn: () => getGroup(id),
  });

  const createInviteMutation = useMutation({
    mutationFn: () =>
      createInvite(id, {
        role: inviteRole,
        expires_in_days: expiresDays ? Number(expiresDays) : undefined,
        max_uses: maxUses ? Number(maxUses) : undefined,
      }),
    onSuccess: (result) => {
      setLastInviteCode(result.code);
      setInviteError('');
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(id) });
    },
    onError: (err: Error) => {
      setInviteError(err.message);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (inviteId: string) => revokeInvite(id, inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(id) });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeMember(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(id) });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: () => deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
      router.push('/portfolio/groups');
    },
  });

  function handleCreateInvite(e: React.FormEvent) {
    e.preventDefault();
    createInviteMutation.mutate();
  }

  function handleCopyCode(code: string) {
    const inviteUrl = `${window.location.origin}/portfolio/groups/join?code=${code}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-danger bg-danger/10 p-4 text-sm text-danger">
        Erro ao carregar grupo: {error.message}
      </div>
    );
  }

  if (!group) {
    return (
      <div className="rounded-xl border border-danger bg-danger/10 p-4 text-sm text-danger">
        Grupo não encontrado.
      </div>
    );
  }

  // API only includes invites when the current user is LEADER
  const isLeader = Array.isArray(group.invites);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{group.name}</h1>
          {group.description && (
            <p className="mt-1 text-on-surface-variant">{group.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => router.push('/portfolio/groups')}
          >
            Voltar
          </Button>
          {deleteGroupMutation.isPending ? (
            <Button variant="danger" loading>
              Excluindo...
            </Button>
          ) : (
            <Button
              variant="danger"
              onClick={() => {
                if (window.confirm('Tem certeza que deseja excluir este grupo?')) {
                  deleteGroupMutation.mutate();
                }
              }}
            >
              Excluir Grupo
            </Button>
          )}
        </div>
      </div>

      {/* Members Section */}
      <Card>
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-lg font-semibold">Membros</h2>
          <span className="text-sm text-on-surface-variant">
            {group.members.length} {group.members.length === 1 ? 'membro' : 'membros'}
          </span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-on-surface-variant">
                <th className="pb-2 pr-4 font-medium">Email</th>
                <th className="pb-2 pr-4 font-medium">Papel</th>
                <th className="pb-2 pr-4 font-medium">Membro desde</th>
                <th className="pb-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {group.members.map((member) => (
                <tr key={member.user_id} className="border-b border-border/50">
                  <td className="py-3 pr-4 text-on-surface">{member.email}</td>
                  <td className="py-3 pr-4">
                    <Badge
                      variant={member.role === 'LEADER' ? 'info' : 'neutral'}
                    >
                      {member.role === 'LEADER' ? 'Líder' : 'Membro'}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 text-on-surface-variant">
                    {new Date(member.joined_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/portfolio?targetUserId=${member.user_id}&userEmail=${encodeURIComponent(member.email)}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Ver carteira
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invites Section — only for leaders */}
      {isLeader && (
        <Card>
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-lg font-semibold">Convites</h2>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setLastInviteCode(null);
                setShowInviteModal(true);
              }}
            >
              Gerar Convite
            </Button>
          </div>

          {group.invites && group.invites.length > 0 ? (
            <div className="mt-4 space-y-3">
              {group.invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface-muted/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={invite.role === 'LEADER' ? 'info' : 'neutral'}
                    >
                      {invite.role === 'LEADER' ? 'Líder' : 'Membro'}
                    </Badge>
                    <span className="font-mono text-xs text-on-surface-variant">
                      {invite.code.slice(0, 8)}...
                    </span>
                    {invite.expires_at && (
                      <span className="text-xs text-outline">
                        Expira em{' '}
                        {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    {invite.max_uses !== null && (
                      <span className="text-xs text-outline">
                        {invite.uses}/{invite.max_uses} usos
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyCode(invite.code)}
                    >
                      Copiar link
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeMutation.mutate(invite.id)}
                      loading={revokeMutation.isPending}
                      className="text-danger hover:text-danger"
                    >
                      Revogar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-on-surface-variant">
              Nenhum convite ativo no momento.
            </p>
          )}
        </Card>
      )}

      {/* Not leader: show "Sair do Grupo" */}
      {!isLeader && (
        <div className="flex justify-center">
          <Button
            variant="danger"
            onClick={() => {
              if (window.confirm('Tem certeza que deseja sair deste grupo?')) {
                router.push('/portfolio/groups');
              }
            }}
          >
            Sair do Grupo
          </Button>
        </div>
      )}

      {/* Copied toast */}
      {copied && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-content px-4 py-2 text-sm text-background shadow-lg">
          Link copiado!
        </div>
      )}

      {/* Create Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <h2 className="mb-4 text-lg font-semibold">Gerar Convite</h2>

            {lastInviteCode ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-info bg-info/10 p-4 text-sm text-info">
                  Convite criado com sucesso!
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-on-surface">
                    Link do convite
                  </label>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/portfolio/groups/join?code=${lastInviteCode}`}
                      className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <Button
                      variant="primary"
                      onClick={() => handleCopyCode(lastInviteCode)}
                    >
                      Copiar
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowInviteModal(false);
                      setLastInviteCode(null);
                    }}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-on-surface">
                    Papel do convidado
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) =>
                      setInviteRole(e.target.value as 'MEMBER' | 'LEADER')
                    }
                    className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-on-surface"
                  >
                    <option value="MEMBER">Membro</option>
                    <option value="LEADER">Líder</option>
                  </select>
                </div>
                <Input
                  label="Expira em (dias, opcional)"
                  type="number"
                  min={1}
                  placeholder="Ex: 30"
                  value={expiresDays}
                  onChange={(e) => setExpiresDays(e.target.value)}
                />
                <Input
                  label="Usos máximos (opcional)"
                  type="number"
                  min={1}
                  placeholder="Ex: 10"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                />
                {inviteError && (
                  <p className="text-xs text-danger">{inviteError}</p>
                )}
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowInviteModal(false);
                      setInviteError('');
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" loading={createInviteMutation.isPending}>
                    Criar Convite
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
