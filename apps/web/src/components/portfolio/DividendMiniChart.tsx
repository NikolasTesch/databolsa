'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { getDividends, getDividendProjection } from '@/lib/api/portfolio';
import type { DividendsResponse, DividendProjectionResponse } from '@/types/api';
import { formatBRL } from '@/lib/format';
import { Spinner } from '@/components/ui/Spinner';

export function DividendMiniChart() {
  const { data: divs, isLoading: loadingDivs } = useQuery<DividendsResponse>({
    queryKey: ['portfolio', 'dividends'],
    queryFn: () => getDividends(),
  });

  const { data: proj, isLoading: loadingProj } = useQuery<DividendProjectionResponse>({
    queryKey: ['portfolio', 'dividends', 'projection'],
    queryFn: () => getDividendProjection(),
  });

  const isLoading = loadingDivs || loadingProj;

  if (isLoading) {
    return (
      <Card padding="md">
        <div className="flex h-[200px] items-center justify-center">
          <Spinner />
        </div>
      </Card>
    );
  }

  // Last 12 months of dividend data
  const monthlyData = (divs?.by_month ?? [])
    .slice(-12)
    .map((m) => ({
      month: m.key.slice(5), // "2025-01" -> "01"
      value: parseFloat(m.value_brl),
    }));

  return (
    <Card padding="md">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary">payments</span>
        <h2 className="text-sm font-medium text-on-surface-variant">Dividendos</h2>
      </div>

      {/* Projection cards */}
      {proj && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg border border-border bg-surface p-3">
            <p className="text-xs text-on-surface-variant">Projeção Anual</p>
            <p className="mt-1 font-mono text-lg font-semibold text-green-600">
              {formatBRL(proj.annual_projection_brl)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-3">
            <p className="text-xs text-on-surface-variant">Média Mensal</p>
            <p className="mt-1 font-mono text-lg font-semibold text-green-600">
              {formatBRL(proj.monthly_avg_brl)}
            </p>
            <p className="text-xs text-on-surface-variant">{proj.basis_months} mês(es) de base</p>
          </div>
        </div>
      )}

      {/* Bar chart */}
      {monthlyData.length === 0 ? (
        <p className="text-sm text-on-surface-variant text-center py-8">
          Nenhum dividendo registrado nos últimos 12 meses.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} />
            <YAxis
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <Tooltip
              formatter={(v: number) => [formatBRL(String(v)), 'Dividendos']}
            />
            <Bar dataKey="value" fill="#16a34a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
