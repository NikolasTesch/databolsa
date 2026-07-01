'use client';

import { formatBRL } from '@/lib/format';
import type { DividendProjectionResponse } from '@/types/api';

interface Props {
  data: DividendProjectionResponse;
}

export function DividendProjectionCard({ data }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-sm text-on-surface-variant">Projeção Anual</p>
        <p className="mt-2 font-mono text-2xl font-bold text-green-600">
          {formatBRL(data.annual_projection_brl)}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-sm text-on-surface-variant">Média Mensal</p>
        <p className="mt-2 font-mono text-2xl font-bold text-green-600">
          {formatBRL(data.monthly_avg_brl)}
        </p>
        <p className="mt-1 text-xs text-on-surface-variant">
          Base: {data.basis_months} mês(es) com proventos
        </p>
      </div>
    </div>
  );
}
