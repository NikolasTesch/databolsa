'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatBRL, formatPLBRL, formatPct, formatQty, formatAllocationPct, getValueSign } from '@/lib/format';
import { StaleBadge } from './StaleBadge';
import { cn } from '@/components/ui/cn';
import type { PositionSummaryDto } from '@/types/api';

interface PositionTableProps {
  positions: PositionSummaryDto[];
}

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04, duration: 0.3, ease: 'easeOut' },
  }),
};

export function PositionTable({ positions }: PositionTableProps) {
  if (positions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface py-12 text-center">
        <p className="text-content-muted">Nenhuma posição ainda.</p>
        <p className="mt-1 text-sm text-content-subtle">
          <Link href="/assets/new" className="text-primary hover:underline">
            Adicione um ativo
          </Link>{' '}
          para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm" aria-label="Posições do portfólio">
        <thead>
          <tr className="border-b border-border bg-surface-muted text-xs font-medium uppercase tracking-wider text-content-subtle">
            <th className="px-4 py-3 text-left">Ativo</th>
            <th className="px-4 py-3 text-right">Qtd</th>
            <th className="px-4 py-3 text-right">Preço Médio</th>
            <th className="px-4 py-3 text-right">Valor Investido</th>
            <th className="px-4 py-3 text-right">Valor Atual</th>
            <th className="px-4 py-3 text-right">P/L (R$)</th>
            <th className="px-4 py-3 text-right">P/L (%)</th>
            <th className="px-4 py-3 text-right">Alocação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {positions.map((pos, i) => {
            const plSign = getValueSign(pos.lucro_prejuizo_brl);

            return (
              <motion.tr
                key={pos.asset_id}
                custom={i}
                variants={rowVariants}
                initial="hidden"
                animate="visible"
                className="hover:bg-surface-muted"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/assets/${pos.asset_id}`}
                      className="font-medium text-content hover:text-primary"
                    >
                      {pos.ticker}
                    </Link>
                    {pos.is_stale && <StaleBadge />}
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-content">
                  {formatQty(pos.current_quantity)}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-content">
                  {formatBRL(pos.average_price)}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-content">
                  {formatBRL(pos.invested_value)}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-content">
                  {pos.valor_atual_brl !== null ? formatBRL(pos.valor_atual_brl) : '—'}
                </td>
                <td
                  className={cn('px-4 py-3 text-right font-mono tabular-nums', {
                    'text-profit': plSign === 'positive',
                    'text-loss': plSign === 'negative',
                    'text-neutralChange': plSign === 'neutral',
                  })}
                >
                  {pos.lucro_prejuizo_brl !== null ? formatPLBRL(pos.lucro_prejuizo_brl) : '—'}
                </td>
                <td
                  className={cn('px-4 py-3 text-right font-mono tabular-nums', {
                    'text-profit': plSign === 'positive',
                    'text-loss': plSign === 'negative',
                    'text-neutralChange': plSign === 'neutral',
                  })}
                >
                  {pos.lucro_prejuizo_pct !== null ? formatPct(pos.lucro_prejuizo_pct) : '—'}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-content">
                  {pos.alocacao_pct !== null ? formatAllocationPct(pos.alocacao_pct) : '—'}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
