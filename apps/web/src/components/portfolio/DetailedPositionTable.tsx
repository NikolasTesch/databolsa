'use client';

import Link from 'next/link';
import { Decimal } from 'decimal.js';
import type { PositionSummaryDto } from '@/types/api';
import { formatBRL, formatQty, formatAllocationPct, getValueSign } from '@/lib/format';
import { StaleBadge } from './StaleBadge';
import { cn } from '@/components/ui/cn';

interface Props {
  positions: PositionSummaryDto[];
}

function calcDiff(currentPrice: string | null, avgPrice: string) {
  if (!currentPrice) return null;
  const diff = new Decimal(currentPrice).minus(new Decimal(avgPrice));
  const pct = new Decimal(avgPrice).isZero()
    ? new Decimal(0)
    : diff.div(new Decimal(avgPrice)).times(100);
  return { diff, pct };
}

function signClass(value: string | null) {
  if (!value) return 'text-content-muted';
  const sign = getValueSign(value);
  if (sign === 'positive') return 'text-green-600';
  if (sign === 'negative') return 'text-red-600';
  return 'text-content-muted';
}

export function DetailedPositionTable({ positions }: Props) {
  if (positions.length === 0) {
    return (
      <p className="text-sm text-content-muted">Nenhuma posição em aberto.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-content-muted">
            <th className="pb-2 pr-4">Ativo</th>
            <th className="pb-2 pr-4 text-right">Preço Médio</th>
            <th className="pb-2 pr-4 text-right">Preço Atual</th>
            <th className="pb-2 pr-4 text-right">Diff R$</th>
            <th className="pb-2 pr-4 text-right">Diff %</th>
            <th className="pb-2 pr-4 text-right">Qtd</th>
            <th className="pb-2 pr-4 text-right">Patrimônio</th>
            <th className="pb-2 pr-4 text-right">P/L R$</th>
            <th className="pb-2 pr-4 text-right">P/L %</th>
            <th className="pb-2 text-right">% Carteira</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos) => {
            const diffData = calcDiff(pos.current_price_brl, pos.average_price);
            const diffStr = diffData ? diffData.diff.toString() : null;
            const diffPctStr = diffData ? diffData.pct.toString() : null;

            return (
              <tr key={pos.asset_id} className="border-b border-border/50 last:border-0">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/assets/${pos.asset_id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {pos.ticker}
                    </Link>
                    {pos.is_stale && <StaleBadge />}
                  </div>
                </td>
                <td className="py-3 pr-4 text-right font-mono">
                  {formatBRL(pos.average_price)}
                </td>
                <td className="py-3 pr-4 text-right font-mono">
                  {pos.current_price_brl ? formatBRL(pos.current_price_brl) : '—'}
                </td>
                <td className={cn('py-3 pr-4 text-right font-mono', signClass(diffStr))}>
                  {diffStr ? formatBRL(diffStr) : '—'}
                </td>
                <td className={cn('py-3 pr-4 text-right font-mono', signClass(diffPctStr))}>
                  {diffPctStr
                    ? `${new Decimal(diffPctStr).toFixed(2).replace('.', ',')}%`
                    : '—'}
                </td>
                <td className="py-3 pr-4 text-right font-mono">
                  {formatQty(pos.current_quantity)}
                </td>
                <td className="py-3 pr-4 text-right font-mono">
                  {pos.valor_atual_brl ? formatBRL(pos.valor_atual_brl) : '—'}
                </td>
                <td className={cn('py-3 pr-4 text-right font-mono', signClass(pos.lucro_prejuizo_brl))}>
                  {pos.lucro_prejuizo_brl ? formatBRL(pos.lucro_prejuizo_brl) : '—'}
                </td>
                <td className={cn('py-3 pr-4 text-right font-mono', signClass(pos.lucro_prejuizo_pct))}>
                  {pos.lucro_prejuizo_pct
                    ? `${new Decimal(pos.lucro_prejuizo_pct).toFixed(2).replace('.', ',')}%`
                    : '—'}
                </td>
                <td className="py-3 text-right font-mono text-content-muted">
                  {pos.alocacao_pct ? formatAllocationPct(pos.alocacao_pct) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
