'use client';

import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { queryKeys } from '@/lib/query-keys';
import { getPortfolioSummary, getPortfolioHistory, getMonthlyActivity } from '@/lib/api/portfolio';
import { SummaryCards } from '@/components/portfolio/SummaryCards';
import { ConcentrationCards } from '@/components/portfolio/ConcentrationCards';
import { PositionTable } from '@/components/portfolio/PositionTable';
import { AllocationChartDynamic } from '@/components/portfolio/AllocationChartDynamic';
import { GrowthChartDynamic } from '@/components/portfolio/GrowthChartDynamic';
import { MonthlyActivityCard } from '@/components/portfolio/MonthlyActivityCard';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 animate-pulse">
      <div className="mb-3 h-3 w-24 rounded bg-surface-muted" />
      <div className="h-8 w-32 rounded bg-surface-muted" />
      <div className="mt-2 h-3 w-16 rounded bg-surface-muted" />
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
    queryFn: () => getPortfolioSummary(),
  });

  const { data: history } = useQuery({
    queryKey: queryKeys.portfolio.history(),
    queryFn: () => getPortfolioHistory(),
  });

  const { data: monthly } = useQuery({
    queryKey: queryKeys.portfolio.monthlyActivity(),
    queryFn: () => getMonthlyActivity(),
  });

  return (
    <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[28px] text-primary">dashboard</span>
          <h1 className="text-xl font-semibold text-on-surface">Dashboard</h1>
        </div>
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

            {/* Concentração */}
            <ConcentrationCards positions={data.positions} />

            {/* Crescimento Patrimonial */}
            <Card padding="md">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary">trending_up</span>
                <h2 className="text-sm font-medium text-on-surface-variant">Crescimento do Capital Investido</h2>
              </div>
              <GrowthChartDynamic dataPoints={history?.data_points ?? []} />
            </Card>

            {/* Atividade do Mês */}
            {monthly && (
              <Card padding="md">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary">calendar_month</span>
                  <h2 className="text-sm font-medium text-on-surface-variant">Atividade do Mês</h2>
                </div>
                <MonthlyActivityCard data={monthly} />
              </Card>
            )}

            {data.positions.filter((p) => p.valor_atual_brl !== null).length > 0 && (
              <Card padding="md">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary">pie_chart</span>
                  <h2 className="text-sm font-medium text-on-surface-variant">Alocação por Ativo</h2>
                </div>
                <AllocationChartDynamic positions={data.positions} />
              </Card>
            )}

            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary">account_balance</span>
                <h2 className="text-base font-semibold text-on-surface">Posições</h2>
              </div>
              <PositionTable positions={data.positions} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
