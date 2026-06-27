'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { queryKeys } from '@/lib/query-keys';
import { listAssets } from '@/lib/api/assets';
import { AssetList } from '@/components/assets/AssetList';
import { Spinner } from '@/components/ui/Spinner';

export default function AssetsPage() {
  const { data: assets, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.assets.list(),
    queryFn: listAssets,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-on-surface">Meus Ativos</h1>
        <Link
          href="/assets/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
        >
          + Novo Ativo
        </Link>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-danger bg-loss-surface p-4 text-sm text-loss">
          Erro ao carregar ativos:{' '}
          {error instanceof Error ? error.message : 'Tente novamente'}
        </div>
      )}

      {!isLoading && !isError && assets && (
        <AssetList assets={assets} />
      )}
    </div>
  );
}
