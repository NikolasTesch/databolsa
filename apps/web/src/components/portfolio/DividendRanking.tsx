'use client';

import { formatBRL } from '@/lib/format';
import type { DividendsResponse } from '@/types/api';

interface Props {
  data: DividendsResponse;
}

export function DividendRanking({ data }: Props) {
  const total = parseFloat(data.total_brl);
  const sorted = [...data.by_asset].sort((a, b) => parseFloat(b.value_brl) - parseFloat(a.value_brl));

  if (sorted.length === 0) return null;

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">Ranking por Ativo</h3>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted text-xs font-medium uppercase tracking-wider text-outline">
              <th className="px-4 py-3 text-left">Ativo</th>
              <th className="px-4 py-3 text-right">Total Recebido</th>
              <th className="px-4 py-3 text-right">% do Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((item) => (
              <tr key={item.key} className="hover:bg-surface-muted">
                <td className="px-4 py-3 font-medium">{item.key}</td>
                <td className="px-4 py-3 text-right font-mono text-green-600">{formatBRL(item.value_brl)}</td>
                <td className="px-4 py-3 text-right font-mono text-on-surface-variant">
                  {total > 0 ? ((parseFloat(item.value_brl) / total) * 100).toFixed(1) + '%' : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
