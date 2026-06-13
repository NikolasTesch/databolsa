'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { formatBRL, formatQty } from '@/lib/format';
import { deleteTransaction } from '@/lib/api/transactions';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/Button';
import { cn } from '@/components/ui/cn';
import type { Transaction } from '@/types/api';

interface TransactionTableProps {
  transactions: Transaction[];
  assetId: string;
}

export function TransactionTable({ transactions, assetId }: TransactionTableProps) {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta transação?')) return;
    setDeletingId(id);
    try {
      await deleteTransaction(id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.transactions.byAsset(assetId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.summary() });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir');
    } finally {
      setDeletingId(null);
    }
  };

  if (transactions.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-content-muted">
        Nenhuma transação registrada.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm" aria-label="Transações do ativo">
        <thead>
          <tr className="border-b border-border bg-surface-muted text-xs font-medium uppercase tracking-wider text-content-subtle">
            <th className="px-4 py-3 text-left">Tipo</th>
            <th className="px-4 py-3 text-left">Data</th>
            <th className="px-4 py-3 text-right">Qtd</th>
            <th className="px-4 py-3 text-right">Preço Unit.</th>
            <th className="px-4 py-3 text-right">Taxas</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {transactions.map((tx) => (
            <tr key={tx.id} className="hover:bg-surface-muted">
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                    tx.type === 'BUY'
                      ? 'bg-profit-surface text-profit-content'
                      : 'bg-loss-surface text-loss-content',
                  )}
                >
                  {tx.type === 'BUY' ? 'Compra' : 'Venda'}
                </span>
              </td>
              <td className="px-4 py-3 text-content">
                {new Date(tx.date).toLocaleDateString('pt-BR')}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-content">
                {formatQty(tx.quantity)}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-content">
                {formatBRL(tx.unit_price)}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-content-muted">
                {tx.fees ? formatBRL(tx.fees) : '—'}
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  loading={deletingId === tx.id}
                  onClick={() => handleDelete(tx.id)}
                  className="text-danger hover:text-danger"
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
