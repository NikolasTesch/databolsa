'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  monthKey: string; // YYYY-MM
  label: string;    // MMM/YY, e.g. "Ago/26"
  value: number;
}

interface DividendsChartProps {
  data: DataPoint[];
}

function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

export function DividendsChart({ data }: DividendsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-content-muted text-sm border border-dashed border-border rounded-lg bg-surface-muted/30">
        Nenhum provento recebido neste período.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e2e8f0)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fontFamily: 'sans-serif', fill: 'var(--color-content-muted, #6b7280)' }}
          tickLine={false}
          axisLine={{ stroke: 'var(--color-border, #e2e8f0)' }}
        />
        <YAxis
          tickFormatter={(val) => `R$ ${formatPrice(val)}`}
          tick={{ fontSize: 11, fontFamily: 'monospace', fill: 'var(--color-content-muted, #6b7280)' }}
          width={80}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(value: number) => [
            `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`,
            'Valor por Cota',
          ]}
          labelFormatter={(label: string) => `Mês: ${label}`}
          contentStyle={{
            background: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-border, #e2e8f0)',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            fontSize: 12,
            color: 'var(--color-content, #1e293b)'
          }}
        />
        <Bar
          dataKey="value"
          fill="#16a34a"
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
