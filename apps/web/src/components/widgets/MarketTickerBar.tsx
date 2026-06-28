'use client';

import { useQuery } from '@tanstack/react-query';

interface IndexData {
  id: string;
  label: string;
  value: string;
  changePercent: string | null;
  stale: boolean;
}

interface IndicesResponse {
  indices: IndexData[];
  asOf: string;
}

async function fetchIndices(): Promise<IndexData[]> {
  const res = await fetch('/api/market/indices');
  if (!res.ok) return [];
  const data: IndicesResponse = await res.json();
  return data.indices ?? [];
}

function detectTrend(change: string | null): 'up' | 'down' | 'flat' {
  if (change === null || change === '0') return 'flat';
  return change.startsWith('+') ? 'up' : 'down';
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  const icon = trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'horizontal_rule';
  const color =
    trend === 'up'
      ? 'text-profit'
      : trend === 'down'
        ? 'text-loss'
        : 'text-neutralChange';

  return (
    <span className={`material-symbols-outlined text-[18px] ${color}`} aria-hidden="true">
      {icon}
    </span>
  );
}

export default function MarketTickerBar() {
  const { data: indices } = useQuery({
    queryKey: ['market-indices'],
    queryFn: fetchIndices,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  if (!indices || indices.length === 0) return null;

  return (
    <section className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop" aria-label="Cotações de mercado">
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory">
        {indices.map((idx) => {
          const trend = detectTrend(idx.changePercent);
          return (
            <div
              key={idx.id}
              className="glass-panel p-4 rounded-lg min-w-[200px] flex-shrink-0 snap-start"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-wide text-outline">
                  {idx.label}
                </span>
                <TrendIcon trend={trend} />
              </div>
              <div className="font-mono text-lg font-semibold text-on-surface">
                {idx.value}
              </div>
              <div
                className={`font-mono text-sm mt-0.5 ${
                  trend === 'up'
                    ? 'text-profit'
                    : trend === 'down'
                      ? 'text-loss'
                      : 'text-neutralChange'
                }`}
              >
                {idx.changePercent ?? '—'}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
