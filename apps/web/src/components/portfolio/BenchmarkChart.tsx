'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { cn } from '@/components/ui/cn';
import { Spinner } from '@/components/ui/Spinner';
import { queryKeys } from '@/lib/query-keys';
import { getBenchmark } from '@/lib/api/portfolio';

const PERIODS = ['1M', '3M', '6M', '1Y', 'ALL'] as const;
const BENCHMARKS = ['IBOVESPA', 'CDI', 'IPCA', 'SP500'] as const;

interface Props {
  targetUserId?: string;
  defaultPeriod?: string;
}

export function BenchmarkChart({ targetUserId, defaultPeriod = '1Y' }: Props) {
  const [period, setPeriod] = useState(defaultPeriod);
  const [benchmark, setBenchmark] = useState('IBOVESPA');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.portfolio.benchmark(benchmark, period, targetUserId),
    queryFn: () => getBenchmark(benchmark, period, targetUserId),
  });

  const chartData =
    data?.portfolio_series?.map((p, i) => ({
      date: p.date,
      Carteira: p.value,
      [data.benchmark]: data.benchmark_series?.[i]?.value ?? null,
    })) ?? [];

  if (isLoading) {
    return (
      <Card padding="md">
        <div className="flex h-[250px] items-center justify-center">
          <Spinner />
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card padding="md">
        <p className="text-sm text-loss">
          Erro ao carregar benchmark:{' '}
          {error instanceof Error ? error.message : 'Tente novamente'}
        </p>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card padding="md">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary">trending_up</span>
        <h2 className="text-sm font-medium text-on-surface-variant">
          Benchmark vs Carteira
        </h2>
      </div>

      {/* Period + Benchmark selector */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                period === p
                  ? 'bg-primary text-white'
                  : 'bg-surface-muted text-on-surface-variant hover:bg-surface-dim',
              )}
            >
              {p}
            </button>
          ))}
        </div>
        <select
          value={benchmark}
          onChange={(e) => setBenchmark(e.target.value)}
          className="ml-auto rounded-md border border-border bg-surface px-3 py-1 text-xs font-medium text-on-surface"
        >
          {BENCHMARKS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {/* Chart */}
      {chartData.length === 0 ? (
        <div className="flex h-[220px] items-center justify-center text-sm text-on-surface-variant">
          Sem dados históricos para este período.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(0,0,0,0.06)"
              />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={60}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Carteira"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey={data.benchmark}
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Comparison cards */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="rounded-lg border border-border bg-surface p-3 text-center">
              <p className="text-xs text-on-surface-variant">Carteira</p>
              <p
                className={`mt-1 font-mono text-sm font-bold ${
                  parseFloat(data.portfolio_return_pct) >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {parseFloat(data.portfolio_return_pct) >= 0 ? '+' : ''}
                {parseFloat(data.portfolio_return_pct).toFixed(2)}%
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3 text-center">
              <p className="text-xs text-on-surface-variant">
                {data.benchmark}
              </p>
              <p
                className={`mt-1 font-mono text-sm font-bold ${
                  parseFloat(data.benchmark_return_pct) >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {parseFloat(data.benchmark_return_pct) >= 0 ? '+' : ''}
                {parseFloat(data.benchmark_return_pct).toFixed(2)}%
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3 text-center">
              <p className="text-xs text-on-surface-variant">Diferença</p>
              <p
                className={`mt-1 font-mono text-sm font-bold ${
                  parseFloat(data.portfolio_return_pct) >=
                  parseFloat(data.benchmark_return_pct)
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {parseFloat(data.portfolio_return_pct) -
                  parseFloat(data.benchmark_return_pct) >=
                0
                  ? '+'
                  : ''}
                {(
                  parseFloat(data.portfolio_return_pct) -
                  parseFloat(data.benchmark_return_pct)
                ).toFixed(2)}
                %
              </p>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
