'use client';

import type { MonthlyActivityDto } from '@/types/api';
import { formatBRL } from '@/lib/format';

interface Props {
  data: MonthlyActivityDto;
}

const metrics = [
  { key: 'total_bought_brl' as const, label: 'Compras', colorClass: 'text-blue-600' },
  { key: 'total_sold_brl' as const, label: 'Vendas', colorClass: 'text-orange-500' },
  { key: 'total_dividends_brl' as const, label: 'Proventos', colorClass: 'text-green-600' },
  { key: 'estimated_realized_gain_brl' as const, label: 'Ganho Realizado', colorClass: 'text-emerald-600' },
];

export function MonthlyActivityCard({ data }: Props) {
  const monthName = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div>
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-on-surface-variant">
        Atividade em {monthName}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map(({ key, label, colorClass }) => (
          <div key={key} className="rounded-lg border border-border bg-surface p-3">
            <p className="text-xs text-on-surface-variant">{label}</p>
            <p className={`mt-1 font-mono text-sm font-semibold ${colorClass}`}>
              {formatBRL(data[key])}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-on-surface-variant">
        {data.transaction_count} transaç{data.transaction_count !== 1 ? 'ões' : 'ão'} no período
      </p>
    </div>
  );
}
