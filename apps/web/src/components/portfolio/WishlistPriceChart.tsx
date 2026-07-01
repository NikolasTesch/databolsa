'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';

interface Props {
  ticker: string;
}

export function WishlistPriceChart({ ticker }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['market', 'history', ticker],
    queryFn: async () => {
      const res = await fetch(`/api/market/history?ticker=${encodeURIComponent(ticker)}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: Boolean(ticker),
  });

  const series = data?.series ?? [];

  if (isLoading) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-on-surface-variant animate-pulse">
        Carregando...
      </div>
    );
  }

  if (series.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-on-surface-variant">
        Histórico não disponível
      </div>
    );
  }

  const chartData = series.map((p: { date: string; close: string }) => ({
    date: p.date,
    close: parseFloat(p.close),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={60} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Area
          type="monotone"
          dataKey="close"
          stroke="#2563eb"
          strokeWidth={2}
          fill="url(#priceGrad)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
