'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  date: string;
  close: string;
}

interface PriceHistoryChartProps {
  series: DataPoint[];
  ticker: string;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } catch {
    return dateStr;
  }
}

function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function PriceHistoryChart({ series, ticker }: PriceHistoryChartProps) {
  if (!series || series.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-on-surface-variant text-sm">
        Histórico não disponível para {ticker}
      </div>
    );
  }

  // Recharts precisa de número para o gráfico — parseFloat é aceitável aqui
  // pois é apenas para renderização visual, não para lógica financeira
  const chartData = series.map((p) => ({
    date: p.date,
    close: parseFloat(p.close),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.15} />
            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e2e8f0)" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 11, fontFamily: 'monospace', fill: 'var(--color-text-muted, #6b7280)' }}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={formatPrice}
          tick={{ fontSize: 11, fontFamily: 'monospace', fill: 'var(--color-text-muted, #6b7280)' }}
          width={72}
        />
        <Tooltip
          formatter={(value: number) => [formatPrice(value), 'Preço']}
          labelFormatter={(label: string) => {
            try {
              const d = new Date(label + 'T00:00:00');
              return d.toLocaleDateString('pt-BR');
            } catch {
              return label;
            }
          }}
          contentStyle={{
            background: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-border, #e2e8f0)',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            fontFamily: 'monospace',
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="close"
          stroke="var(--color-primary)"
          strokeWidth={2}
          fill="url(#priceGradient)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
