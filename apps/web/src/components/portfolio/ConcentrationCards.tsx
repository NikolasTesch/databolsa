'use client';

import { Decimal } from 'decimal.js';
import { Card } from '@/components/ui/Card';
import type { PositionSummaryDto } from '@/types/api';

interface Props {
  positions: PositionSummaryDto[];
}

export function ConcentrationCards({ positions }: Props) {
  const positionsWithAllocation = positions.filter(p => p.alocacao_pct !== null);

  if (positionsWithAllocation.length === 0) {
    return null;
  }

  const pcts = positionsWithAllocation.map(p => new Decimal(p.alocacao_pct!));

  // % Maior Ativo
  const maxPct = Decimal.max(...pcts);

  // % Top 3
  const sorted = [...pcts].sort((a, b) => b.comparedTo(a));
  const top3Pct = sorted.slice(0, 3).reduce((sum, v) => sum.add(v), new Decimal(0));

  // HHI = sum(pct²) for all positions, scaled 0-10000
  const hhi = pcts.reduce((sum, p) => sum.add(p.pow(2)), new Decimal(0));

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <p className="text-sm font-medium text-on-surface-variant">Maior Ativo</p>
        <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">{maxPct.toFixed(1)}%</p>
        <p className="mt-1 text-xs text-outline">Porcentagem do maior ativo na carteira</p>
      </Card>
      <Card>
        <p className="text-sm font-medium text-on-surface-variant">Top 3 Ativos</p>
        <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">{top3Pct.toFixed(1)}%</p>
        <p className="mt-1 text-xs text-outline">Soma dos 3 maiores ativos</p>
      </Card>
      <Card>
        <p className="text-sm font-medium text-on-surface-variant">Índice HHI</p>
        <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">{hhi.toFixed(0)}</p>
        <p className="mt-1 text-xs text-outline">
          {hhi.lt(1000)
            ? 'Carteira diversificada'
            : hhi.lt(2500)
              ? 'Concentração moderada'
              : 'Alta concentração'}
        </p>
      </Card>
    </div>
  );
}
