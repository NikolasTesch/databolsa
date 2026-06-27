'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { listGroups, createGroup } from '@/lib/api/groups';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';

export default function GroupsListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [createError, setCreateError] = useState('');

  const { data: groups, isLoading, error } = useQuery({
    queryKey: queryKeys.groups.list(),
    queryFn: listGroups,
  });

  const createMutation = useMutation({
    mutationFn: () => createGroup(newName, newDescription || undefined),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
      setShowCreateModal(false);
      setNewName('');
      setNewDescription('');
      setCreateError('');
      router.push(`/portfolio/groups/${result.id}`);
    },
    onError: (err: Error) => {
      setCreateError(err.message);
    },
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) {
      setCreateError('Nome do grupo é obrigatório');
      return;
    }
    createMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Grupos</h1>
        <Button onClick={() => setShowCreateModal(true)}>Criar Grupo</Button>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-danger bg-danger/10 p-4 text-sm text-danger">
          Erro ao carregar grupos: {error.message}
        </div>
      ) : !groups || groups.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-on-surface-variant">Nenhum grupo ainda</p>
          <p className="text-sm text-outline">
            Crie um grupo para compartilhar sua carteira com outras pessoas.
          </p>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="mt-2"
          >
            Criar Primeiro Grupo
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Link key={group.id} href={`/portfolio/groups/${group.id}`}>
              <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-on-surface">
                      {group.name}
                    </h3>
                    {group.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant">
                        {group.description}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={group.role === 'LEADER' ? 'info' : 'neutral'}
                  >
                    {group.role === 'LEADER' ? 'Líder' : 'Membro'}
                  </Badge>
                </div>
                <p className="mt-3 text-xs text-outline">
                  {group.memberCount} {group.memberCount === 1 ? 'membro' : 'membros'}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <h2 className="mb-4 text-lg font-semibold">Criar Grupo</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Nome do grupo"
                placeholder="Ex: Família Silva"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                error={createError}
              />
              <Input
                label="Descrição (opcional)"
                placeholder="Ex: Investimentos da família"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError('');
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" loading={createMutation.isPending}>
                  Criar
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
