'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addWatch } from '@/lib/api/portfolio';
import { Button } from '@/components/ui/Button';
import { queryKeys } from '@/lib/query-keys';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function WishlistAddDialog({ open, onClose }: Props) {
  const [ticker, setTicker] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => addWatch({ ticker: ticker.trim().toUpperCase() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.watchList() });
      setTicker('');
      onClose();
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl bg-surface p-6 shadow-lg border border-border"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-on-surface mb-4">Adicionar à Watchlist</h2>

        <label className="block text-sm font-medium text-on-surface-variant mb-1">Ticker</label>
        <input
          type="text"
          value={ticker}
          onChange={e => setTicker(e.target.value)}
          placeholder="ex: PETR4"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary uppercase"
          onKeyDown={e => {
            if (e.key === 'Enter' && ticker.trim()) mutation.mutate();
          }}
          autoFocus
        />

        {mutation.isError && (
          <p className="mt-2 text-sm text-loss">
            {mutation.error instanceof Error ? mutation.error.message : 'Erro ao adicionar'}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!ticker.trim()}
          >
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
}
