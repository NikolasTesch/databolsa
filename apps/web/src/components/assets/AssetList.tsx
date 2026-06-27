'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AssetClassBadge } from './AssetClassBadge';
import { Button } from '@/components/ui/Button';
import { queryKeys } from '@/lib/query-keys';
import { deleteAsset } from '@/lib/api/assets';
import type { Asset } from '@/types/api';

interface AssetListProps {
  assets: Asset[];
}

export function AssetList({ assets }: AssetListProps) {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, ticker: string) => {
    if (!confirm(`Excluir o ativo ${ticker}? Esta ação não pode ser desfeita.`)) return;
    setDeletingId(id);
    try {
      await deleteAsset(id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.assets.list() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.summary() });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir');
    } finally {
      setDeletingId(null);
    }
  };

  if (assets.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface py-12 text-center">
        <p className="text-on-surface-variant">Nenhum ativo registrado ainda</p>
        <p className="mt-2">
          <Link href="/assets/new" className="text-sm font-medium text-primary hover:underline">
            Adicionar primeiro ativo
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm" aria-label="Lista de ativos">
        <thead>
          <tr className="border-b border-border bg-surface-muted text-xs font-medium uppercase tracking-wider text-outline">
            <th className="px-4 py-3 text-left">Ticker</th>
            <th className="px-4 py-3 text-left">Nome</th>
            <th className="px-4 py-3 text-left">Categoria</th>
            <th className="px-4 py-3 text-left">Moeda</th>
            <th className="px-4 py-3 text-left">Fonte</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {assets.map((asset) => (
            <tr key={asset.id} className="hover:bg-surface-muted">
              <td className="px-4 py-3 font-medium">
                <Link href={`/assets/${asset.id}`} className="text-primary hover:underline">
                  {asset.ticker}
                </Link>
              </td>
              <td className="px-4 py-3 text-on-surface">{asset.name}</td>
              <td className="px-4 py-3">
                <AssetClassBadge assetClass={asset.asset_class} />
              </td>
              <td className="px-4 py-3 font-mono text-on-surface-variant">{asset.currency}</td>
              <td className="px-4 py-3 text-outline">{asset.data_source}</td>
              <td className="px-4 py-3 text-right">
                <Button
                  variant="danger"
                  size="sm"
                  loading={deletingId === asset.id}
                  onClick={() => handleDelete(asset.id, asset.ticker)}
                >
                  Excluir
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
