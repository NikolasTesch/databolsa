'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listWatch, addWatch, removeWatch } from '@/lib/api/portfolio';
import { Button } from '@/components/ui/Button';
import { queryKeys } from '@/lib/query-keys';
import type { AssetClass } from '@/types/api';

interface AddToWatchlistButtonProps {
  ticker: string;
  name?: string;
  assetClass?: AssetClass;
}

export function AddToWatchlistButton({ ticker, name, assetClass }: AddToWatchlistButtonProps) {
  const queryClient = useQueryClient();

  const { data: watchlist } = useQuery({
    queryKey: queryKeys.portfolio.watchList(),
    queryFn: listWatch,
  });

  const existing = watchlist?.watches?.find(
    (w) => w.ticker.toUpperCase() === ticker.toUpperCase(),
  );

  const addMutation = useMutation({
    mutationFn: () => addWatch({ ticker, name, asset_class: assetClass }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.watchList() });
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => removeWatch(existing!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.watchList() });
    },
  });

  if (existing) {
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={() => removeMutation.mutate()}
        loading={removeMutation.isPending}
      >
        <span className="material-symbols-outlined text-[16px] mr-1">star</span>
        Remover da Watchlist
      </Button>
    );
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => addMutation.mutate()}
      loading={addMutation.isPending}
    >
      <span className="material-symbols-outlined text-[16px] mr-1">star_outline</span>
      Adicionar à Watchlist
    </Button>
  );
}
