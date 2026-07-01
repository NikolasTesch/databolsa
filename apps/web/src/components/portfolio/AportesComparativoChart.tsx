'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { getAportesComparativo } from '@/lib/api/portfolio';
import { formatBRL } from '@/lib/format';
import { Spinner } from '@/components/ui/Spinner';

const MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

const CHART_COLORS = ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#dc2626', '#0891b2'];

export function AportesComparativoChart() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['portfolio', 'aportes'],
    queryFn: () => getAportesComparativo(),
  });

  if (isLoading) {
    return (
      <Card padding="md">
        <div className="flex h-[250px] items-center justify-center">
          <Spinner />
        </div>
      </Card>
    );
  }

  if (isError || !data || Object.keys(data.by_year).length === 0) {
    return null;
  }

  // Build chart data: one entry per month, with each year as a series
  const years = Object.keys(data.by_year).sort();
  const chartData = MONTHS.map((month, idx) => {
    const key = String(idx + 1).padStart(2, '0');
    const entry: Record<string, string | number> = { month };
    for (const year of years) {
      entry[year] = data.by_year[year][key] ? parseFloat(data.by_year[year][key]) : 0;
    }
    return entry;
  });

  return (
    <Card padding="md">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary">savings</span>
        <h2 className="text-sm font-medium text-on-surface-variant">Aportes por Mês</h2>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <Tooltip
            formatter={(value: number) => [formatBRL(String(value)), 'Aporte']}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Legend />
          {years.map((year, i) => (
            <Bar
              key={year}
              dataKey={year}
              fill={CHART_COLORS[i % CHART_COLORS.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      <p className="mt-2 text-xs text-on-surface-variant">
        Aportes mensais (compras) por ano
      </p>
    </Card>
  );
}
