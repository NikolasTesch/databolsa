'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/components/ui/cn';

/* ── Types ── */

interface IndexApiData {
  id: string;
  label: string;
  value: string;
  changePercent: string | null;
  stale: boolean;
}

interface IndexDisplay {
  name: string;
  value: string;
  changePercent: string;
  trend: 'up' | 'down' | 'flat';
}

/* ── Helper ── */

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  const icon =
    trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'horizontal_rule';
  const color =
    trend === 'up'
      ? 'text-profit'
      : trend === 'down'
        ? 'text-loss'
        : 'text-neutralChange';

  return (
    <span className={cn('material-symbols-outlined text-sm', color)} aria-hidden="true">
      {icon}
    </span>
  );
}

/* ── Main component ── */

function detectTrend(change: string | null): 'up' | 'down' | 'flat' {
  if (change === null || change === '0') return 'flat';
  return change.startsWith('+') ? 'up' : 'down';
}

export default function GlobalIndices() {
  const [indices, setIndices] = useState<IndexDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/market/indices')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.indices) {
          setIndices(
            data.indices.map((idx: IndexApiData) => ({
              name: idx.label,
              value: idx.value,
              changePercent: idx.changePercent ?? '—',
              trend: detectTrend(idx.changePercent),
            })),
          );
        }
      })
      .catch(() => setIndices([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-panel p-3 rounded-lg text-center h-[84px] animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (indices.length === 0) return null;

  return (
    <section
      className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-6"
      aria-label="Índices globais"
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {indices.map((idx) => {
          const changeColor =
            idx.trend === 'up'
              ? 'text-profit'
              : idx.trend === 'down'
                ? 'text-loss'
                : 'text-neutralChange';

          return (
            <div key={idx.name} className="glass-panel p-3 rounded-lg text-center">
              <div className="text-caption text-outline mb-1">{idx.name}</div>
              <div className="font-mono text-sm font-semibold text-on-surface mb-1">
                {idx.value}
              </div>
              <div className={cn('font-mono text-xs inline-flex items-center gap-0.5', changeColor)}>
                <TrendIcon trend={idx.trend} />
                {idx.changePercent}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
