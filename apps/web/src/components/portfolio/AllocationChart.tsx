'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PositionSummaryDto } from '@/types/api';

// Cores de gráfico do design system
const CHART_COLORS = [
  '#2756A4', // navy-600
  '#4EC3E4', // cyan accent
  '#16A34A', // profit
  '#D97706', // amber/stale
  '#5E8AD0', // navy-400
  '#87C6E9', // navy-300
  '#22C55E', // green lighter
  '#F59E0B', // amber lighter
  '#3A6BBE', // navy-500
  '#234080', // navy-700
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
      value: parseFloat(p.alocacao_pct!),
    }));

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-surface">
        <p className="text-sm text-content-muted">Sem dados de alocação disponíveis</p>
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
