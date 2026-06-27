'use client';

import { cn } from '@/components/ui/cn';

/* ── Types ── */

interface IndexData {
  name: string;
  value: string;
  changePercent: string;
  trend: 'up' | 'down' | 'flat';
}

/* ── Mock data ── */

const INDICES: IndexData[] = [
  { name: 'IBOV', value: '128.452', changePercent: '+1,24%', trend: 'up' },
  { name: 'IFIX', value: '3.412', changePercent: '+0,15%', trend: 'up' },
  { name: 'S&P 500', value: '5.123', changePercent: '-0,52%', trend: 'down' },
  { name: 'NASDAQ', value: '16.210', changePercent: '-0,88%', trend: 'down' },
  { name: 'DOW JONES', value: '39.120', changePercent: '+0,10%', trend: 'up' },
  { name: 'NIKKEI', value: '38.450', changePercent: '+1,40%', trend: 'up' },
];

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

export default function GlobalIndices() {
  return (
    <section
      className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-6"
      aria-label="Índices globais"
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {INDICES.map((idx) => {
          const changeColor =
            idx.trend === 'up'
              ? 'text-profit'
              : idx.trend === 'down'
                ? 'text-loss'
                : 'text-neutralChange';

          return (
            <div key={idx.name} className="glass-panel p-3 rounded-lg text-center">
              {/* Index name */}
              <div className="text-caption text-outline mb-1">{idx.name}</div>

              {/* Value */}
              <div className="font-mono text-sm font-semibold text-on-surface mb-1">
                {idx.value}
              </div>

              {/* Change row with icon */}
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
