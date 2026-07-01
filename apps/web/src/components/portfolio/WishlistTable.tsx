'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeWatch } from '@/lib/api/portfolio';
import { formatBRL, formatPct } from '@/lib/format';
import { AssetClassBadge } from '@/components/assets/AssetClassBadge';
import { Button } from '@/components/ui/Button';
import { WishlistPriceChartDynamic } from './WishlistPriceChartDynamic';
import { queryKeys } from '@/lib/query-keys';
import type { AssetClass } from '@/types/api';

interface WatchItem {
  id: string;
  ticker: string;
  name: string | null;
  asset_class: string;
  current_price_brl: string | null;
  price_change_pct: string | null;
  added_at: string;
}

interface Props {
  items: WatchItem[];
}

export function WishlistTable({ items }: Props) {
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeWatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.watchList() });
    },
  });

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface py-12 text-center">
        <p className="text-on-surface-variant">Nenhum ativo na watchlist</p>
        <p className="mt-1 text-sm text-outline">Adicione ativos para acompanhar seus preços</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted text-xs font-medium uppercase tracking-wider text-outline">
              <th className="px-4 py-3 text-left">Ativo</th>
              <th className="px-4 py-3 text-left">Nome</th>
              <th className="px-4 py-3 text-left">Classe</th>
              <th className="px-4 py-3 text-right">Preço Atual</th>
              <th className="px-4 py-3 text-right">Variação</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {items.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-surface-muted cursor-pointer"
                onClick={() =>
                  setSelectedTicker(
                    selectedTicker === item.ticker ? null : item.ticker,
                  )
                }
              >
                <td className="px-4 py-3 font-medium text-primary">{item.ticker}</td>
                <td className="px-4 py-3 text-on-surface">{item.name || '—'}</td>
                <td className="px-4 py-3">
                  <AssetClassBadge assetClass={item.asset_class as AssetClass} />
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {item.current_price_brl ? formatBRL(item.current_price_brl) : '—'}
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono ${
                    item.price_change_pct
                      ? parseFloat(item.price_change_pct) >= 0
                        ? 'text-gain'
                        : 'text-loss'
                      : 'text-on-surface-variant'
                  }`}
                >
                  {item.price_change_pct ? formatPct(item.price_change_pct) : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMutation.mutate(item.id);
                    }}
                    loading={removeMutation.isPending}
                  >
                    Remover
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Price chart for selected ticker */}
      {selectedTicker && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-on-surface">
              Histórico de Preço — {selectedTicker}
            </p>
            <button
              onClick={() => setSelectedTicker(null)}
              className="text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <WishlistPriceChartDynamic ticker={selectedTicker} />
        </div>
      )}
    </div>
  );
}
