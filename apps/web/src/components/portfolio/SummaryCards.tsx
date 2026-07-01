'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Decimal } from 'decimal.js';
import { Card } from '@/components/ui/Card';
import { formatBRL, formatPLBRL } from '@/lib/format';
import type { PortfolioSummaryDto } from '@/types/api';

interface SummaryCardsProps {
  data: PortfolioSummaryDto;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

function AnimatedValue({ target, fallback }: { target: number; fallback: string }) {
  const motionValue = useMotionValue(0);
  const displayed = useTransform(motionValue, (v) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(v);
  });
  const displayRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(motionValue, target, {
      duration: 1.2,
      ease: 'easeOut',
    });
    return controls.stop;
  }, [target, motionValue]);

  useEffect(() => {
    const unsubscribe = displayed.on('change', (v) => {
      if (displayRef.current) displayRef.current.textContent = v;
    });
    return unsubscribe;
  }, [displayed]);

  return (
    <span
      ref={displayRef}
      className="font-mono text-2xl font-semibold tabular-nums"
    >
      {fallback}
    </span>
  );
}

export function SummaryCards({ data }: SummaryCardsProps) {
  const patrimonio = new Decimal(data.patrimonio_total_brl).toNumber();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <motion.div variants={cardVariants}>
        <Card>
          <p className="text-sm font-medium text-on-surface-variant">Patrimônio Total</p>
          <div className="mt-1">
            <AnimatedValue target={patrimonio} fallback={formatBRL(data.patrimonio_total_brl)} />
          </div>
          <p className="mt-1 text-xs text-outline">
            {data.positions.filter((p) => p.valor_atual_brl !== null).length} posições com cotação
          </p>
        </Card>
      </motion.div>

      <motion.div variants={cardVariants}>
        <Card>
          <p className="text-sm font-medium text-on-surface-variant">Ativos na Carteira</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
            {data.positions.length}
          </p>
          <p className="mt-1 text-xs text-outline">
            {data.positions.filter((p) => p.is_stale).length > 0
              ? `${data.positions.filter((p) => p.is_stale).length} com cotação desatualizada`
              : 'Todas as cotações atualizadas'}
          </p>
        </Card>
      </motion.div>

      <motion.div variants={cardVariants}>
        <Card>
          <p className="text-sm font-medium text-on-surface-variant">Yield on Cost Médio</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
            {(() => {
              const totalDivs = data.positions.reduce(
                (sum, p) => sum.add(new Decimal(p.total_dividends_brl || '0')), new Decimal(0),
              );
              const totalInv = data.positions.reduce(
                (sum, p) => sum.add(new Decimal(p.invested_value)), new Decimal(0),
              );
              if (totalInv.isZero() || totalDivs.isZero()) return '—';
              return `${totalDivs.div(totalInv).mul(100).toFixed(2)}%`;
            })()}
          </p>
          <p className="mt-1 text-xs text-outline">Dividendos / Capital Investido</p>
        </Card>
      </motion.div>

      <motion.div variants={cardVariants}>
        <Card>
          <p className="text-sm font-medium text-on-surface-variant">Retorno Total</p>
          <p
            className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${
              (() => {
                const totalRet = data.positions.reduce(
                  (sum, p) => sum.add(new Decimal(p.total_return_brl || '0')), new Decimal(0),
                );
                return totalRet.isNegative() ? 'text-tertiary' : 'text-secondary';
              })()
            }`}
          >
            {(() => {
              const totalRet = data.positions.reduce(
                (sum, p) => sum.add(new Decimal(p.total_return_brl || '0')), new Decimal(0),
              );
              return formatPLBRL(totalRet.toFixed(2));
            })()}
          </p>
          <p className="mt-1 text-xs text-outline">Valorização + Proventos</p>
        </Card>
      </motion.div>
    </motion.div>
  );
}
