'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { queryKeys } from '@/lib/query-keys';
import { getAsset } from '@/lib/api/assets';
import { listTransactions } from '@/lib/api/transactions';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { AssetClassBadge } from '@/components/assets/AssetClassBadge';
import { Spinner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';

interface AssetDetailPageProps {
  params: { id: string };
}

export default function AssetDetailPage({ params }: AssetDetailPageProps) {
  const { id } = params;

  const assetQuery = useQuery({
    queryKey: queryKeys.assets.detail(id),
    queryFn: () => getAsset(id),
    retry: false,
  });

  const txQuery = useQuery({
    queryKey: queryKeys.transactions.byAsset(id),
    queryFn: () => listTransactions(id),
    enabled: Boolean(assetQuery.data),
  });

  if (assetQuery.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (assetQuery.isError) {
    return (
      <div className="rounded-xl border border-danger bg-loss-surface p-4 text-sm text-loss">
        Ativo não encontrado.{' '}
        <Link href="/assets" className="underline">
          Voltar
        </Link>
      </div>
    );
  }

  const asset = assetQuery.data!;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/assets" className="text-on-surface-variant hover:text-on-surface">
            ← Ativos
          </Link>
          <h1 className="text-xl font-semibold text-on-surface">{asset.ticker}</h1>
          <AssetClassBadge assetClass={asset.asset_class} />
        </div>
        <Link
          href={`/assets/${id}/transactions/new`}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
        >
          + Nova Transação
        </Link>
      </div>

      <Card>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-outline">Nome</dt>
            <dd className="mt-1 text-sm text-on-surface">{asset.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-outline">Moeda</dt>
            <dd className="mt-1 font-mono text-sm text-on-surface">{asset.currency}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-outline">Fonte</dt>
            <dd className="mt-1 text-sm text-on-surface">{asset.data_source}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-outline">Cadastrado em</dt>
            <dd className="mt-1 text-sm text-on-surface">
              {new Date(asset.created_at).toLocaleDateString('pt-BR')}
            </dd>
          </div>
        </dl>
      </Card>

      <div>
        <h2 className="mb-3 text-base font-semibold text-on-surface">Transações</h2>
        {txQuery.isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <TransactionTable
            transactions={txQuery.data ?? []}
            assetId={id}
          />
        )}
      </div>
    </div>
  );
}
