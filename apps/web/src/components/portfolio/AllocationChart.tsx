'use client';

import { Decimal } from 'decimal.js';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PositionSummaryDto } from '@/types/api';

// Cores de gráfico do design system (M3 palette)
const CHART_COLORS = [
  '#adc6ff', // primary M3
  '#4edea3', // secondary M3
  '#ffb786', // tertiary M3
  '#6b9aff', // primary alt
  '#2bbf7a', // secondary alt
  '#fc9a4f', // tertiary alt
  '#86a8ff', // primary light
  '#7ae6b7', // secondary light
  '#fec89a', // tertiary light
  '#4d7cff', // primary deep
];

interface AllocationChartProps {
  positions: PositionSummaryDto[];
}

export function AllocationChart({ positions }: AllocationChartProps) {
  // Filtra apenas posições com valor atual disponível
  const data = positions
    .filter((p) => p.valor_atual_brl !== null && p.alocacao_pct !== null)
    .map((p) => ({
      name: p.ticker,
      value: new Decimal(p.alocacao_pct!).toNumber(),
    }));

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-surface">
        <p className="text-sm text-on-surface-variant">Sem dados de alocação disponíveis</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={90}
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Alocação']}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
