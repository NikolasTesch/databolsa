'use client';

import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { queryKeys } from '@/lib/query-keys';
import { getPortfolioSummary } from '@/lib/api/portfolio';
import { SummaryCards } from '@/components/portfolio/SummaryCards';
import { PositionTable } from '@/components/portfolio/PositionTable';
import { AllocationChartDynamic } from '@/components/portfolio/AllocationChartDynamic';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 animate-pulse">
      <div className="mb-3 h-3 w-24 rounded bg-neutral-200" />
      <div className="h-8 w-32 rounded bg-neutral-200" />
      <div className="mt-2 h-3 w-16 rounded bg-neutral-200" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <motion.div
      key="skeleton"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="rounded-xl border border-border bg-surface p-6 animate-pulse">
        <div className="h-48 rounded bg-neutral-200" />
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.portfolio.summary(),
    queryFn: getPortfolioSummary,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-content">Dashboard</h1>
        <Link
          href="/assets/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
        >
          + Novo Ativo
        </Link>
      </div>

      <AnimatePresence mode="wait">
        {isLoading && <DashboardSkeleton />}

        {isError && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-danger bg-loss-surface p-4 text-sm text-loss"
          >
            Erro ao carregar portfólio:{' '}
            {error instanceof Error ? error.message : 'Tente novamente'}
          </motion.div>
        )}

        {!isLoading && !isError && data && (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <SummaryCards data={data} />

            {data.positions.filter((p) => p.valor_atual_brl !== null).length > 0 && (
              <Card padding="md">
                <h2 className="mb-4 text-sm font-medium text-content-muted">
                  Alocação por Ativo
                </h2>
                <AllocationChartDynamic positions={data.positions} />
              </Card>
            )}

            <div>
              <h2 className="mb-3 text-base font-semibold text-content">Posições</h2>
              <PositionTable positions={data.positions} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
