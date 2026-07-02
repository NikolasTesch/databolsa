'use client';

import { useState, useEffect } from 'react';
import { PriceHistoryChart } from './PriceHistoryChartDynamic';
import { cn } from '@/components/ui/cn';

type Range = '1d' | '1w' | '15d' | '1m' | '6m' | '1y' | '5y';

const RANGE_OPTIONS: { label: string; value: Range }[] = [
  { label: '1D', value: '1d' },
  { label: '1S', value: '1w' },
  { label: '15D', value: '15d' },
  { label: '1M', value: '1m' },
  { label: '6M', value: '6m' },
  { label: '1A', value: '1y' },
  { label: '5A', value: '5y' },
];

interface DataPoint {
  date: string;
  close: string;
}

interface PriceHistorySectionProps {
  ticker: string;
  initialRange?: Range;
}

export function PriceHistorySection({ ticker, initialRange = '1y' }: PriceHistorySectionProps) {
  const [range, setRange] = useState<Range>(initialRange);
  const [series, setSeries] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/market/${ticker}/history?range=${range}`)
      .then((r) => r.json())
      .then((data) => {
        setSeries(data.series ?? []);
        setLoading(false);
      })
      .catch(() => {
        setSeries([]);
        setLoading(false);
      });
  }, [ticker, range]);

  return (
    <div className="mx-4 md:mx-8 mb-8">
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide">
            Histórico de Preços
          </h2>
          <div className="flex items-center gap-2">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={cn(
                  'text-xs px-3 py-1 rounded transition-colors',
                  range === opt.value
                    ? 'bg-primary text-white'
                    : 'bg-surface-muted text-on-surface-variant hover:bg-primary/10',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-[280px] text-on-surface-variant text-sm animate-pulse">
            Carregando...
          </div>
        ) : (
          <PriceHistoryChart series={series} ticker={ticker} />
        )}
      </div>
    </div>
  );
}
