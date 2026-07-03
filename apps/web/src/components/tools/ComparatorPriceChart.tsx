'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const CHART_COLORS = ['#adc6ff', '#4edea3', '#ffb786', '#ff8a8a', '#a78bfa', '#fbbf24'];

export interface PriceSeries {
  ticker: string;
  series: Array<{ date: string; close: string }>;
}

interface ComparatorPriceChartProps {
  series: PriceSeries[];
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } catch {
    return dateStr;
  }
}

function formatValue(value: number): string {
  return value.toFixed(1);
}

export default function ComparatorPriceChart({ series }: ComparatorPriceChartProps) {
  const nonEmpty = series.filter((s) => s.series.length > 0);

  if (nonEmpty.length === 0) {
    return <div className="flex items-center justify-center h-64 text-sm text-on-surface-variant">Dados de preço não disponíveis</div>;
  }

  // Build normalized chart data: find all unique dates, normalize to base 100
  const allDates = new Set<string>();
  const seriesMap = new Map<string, Map<string, number>>();

  for (const item of nonEmpty) {
    const values = new Map<string, number>();
    for (const point of item.series) {
      values.set(point.date, parseFloat(point.close));
      allDates.add(point.date);
    }
    seriesMap.set(item.ticker, values);
  }

  const sortedDates = Array.from(allDates).sort();

  // Normalize each series to base 100 (first value = 100)
  const baseValues = new Map<string, number>();
  for (const [ticker, values] of seriesMap) {
    const firstVal = values.get(sortedDates[0]);
    baseValues.set(ticker, firstVal ?? 1);
  }

  const chartData = sortedDates.map((date) => {
    const entry: Record<string, string | number> = { date };
    for (const item of nonEmpty) {
      const values = seriesMap.get(item.ticker);
      const base = baseValues.get(item.ticker) ?? 1;
      const raw = values?.get(date);
      entry[item.ticker] = raw !== undefined ? ((raw / base) * 100) : null!;
    }
    return entry;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 11, fontFamily: 'monospace', fill: 'var(--color-on-surface-variant)' }}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(v: number) => `${v.toFixed(0)}`}
          tick={{ fontSize: 11, fontFamily: 'monospace', fill: 'var(--color-on-surface-variant)' }}
          width={52}
          domain={['auto', 'auto']}
        />
        <Tooltip
          formatter={(value: number, name: string) => [`${value.toFixed(1)}`, name]}
          labelFormatter={(label: string) => {
            try {
              const d = new Date(label + 'T00:00:00');
              return d.toLocaleDateString('pt-BR');
            } catch {
              return label;
            }
          }}
          contentStyle={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            fontFamily: 'monospace',
            fontSize: 12,
          }}
        />
        <Legend
          formatter={(value: string) => (
            <span style={{ color: 'var(--color-on-surface)', fontSize: 12 }}>{value}</span>
          )}
        />
        {nonEmpty.map((item, i) => (
          <Line
            key={item.ticker}
            type="monotone"
            dataKey={item.ticker}
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
