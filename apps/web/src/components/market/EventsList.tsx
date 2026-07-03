'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/components/ui/cn';

interface CorporateEvent {
  symbol: string;
  event_type: string;
  event_date: string;
  description: string | null;
  data: Record<string, unknown> | null;
}

interface EventsResponse {
  data: CorporateEvent[];
  total: number;
  asOf: string;
  stale: boolean;
}

interface EventsListProps {
  ticker: string;
  limit?: number;
}

const EVENT_TYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  DIVIDEND_EX: { icon: 'payments', color: 'text-primary', label: 'Data Ex' },
  DIVIDEND_PAYMENT: { icon: 'payments', color: 'text-primary', label: 'Pagamento' },
  EARNINGS: { icon: 'monitoring', color: 'text-secondary', label: 'Resultados' },
  MEETING: { icon: 'groups', color: 'text-tertiary', label: 'Assembleia' },
  SPLIT: { icon: 'swap_horiz', color: 'text-warning', label: 'Desdobramento' },
};

function getTypeConfig(type: string) {
  return EVENT_TYPE_CONFIG[type] ?? { icon: 'event', color: 'text-on-surface-variant', label: type };
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

function SkeletonCards() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-border bg-surface p-4"
        >
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-surface-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 rounded bg-surface-muted" />
              <div className="h-4 w-full rounded bg-surface-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EventsList({ ticker, limit = 5 }: EventsListProps) {
  const [events, setEvents] = useState<CorporateEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/market/${encodeURIComponent(ticker)}/events?limit=${limit}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<EventsResponse>;
      })
      .then((json) => {
        if (!cancelled) {
          setEvents(json.data ?? []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar eventos');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ticker, limit]);

  if (loading) {
    return <SkeletonCards />;
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface p-4 text-sm text-on-surface-variant">
        <span className="material-symbols-outlined text-base text-on-surface-variant">info</span>
        <span>Eventos temporariamente indisponíveis.</span>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface p-6 text-center gap-2">
        <span className="material-symbols-outlined text-[2rem] text-on-surface-variant/50">
          event_busy
        </span>
        <p className="text-sm text-on-surface-variant">
          Nenhum evento encontrado para os próximos dias.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event, idx) => {
        const config = getTypeConfig(event.event_type);
        return (
          <div
            key={`${event.event_type}-${event.event_date}-${idx}`}
            className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary/20"
          >
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted', config.color)}>
              <span className="material-symbols-outlined text-base">{config.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono text-xs text-on-surface-variant tabular-nums">
                  {formatDate(event.event_date)}
                </span>
                <span className={cn('text-xs font-medium', config.color)}>
                  {config.label}
                </span>
              </div>
              <p className="text-sm text-on-surface leading-snug line-clamp-2">
                {event.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Compact variant — used on dashboard.
 * Shows only date + ticker + type, no description.
 */
interface CompactEventsListProps {
  events: CorporateEvent[];
  max?: number;
}

export function CompactEventsList({ events, max = 5 }: CompactEventsListProps) {
  const limited = events.slice(0, max);

  if (limited.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {limited.map((event, idx) => {
        const config = getTypeConfig(event.event_type);
        return (
          <Link
            key={`${event.event_type}-${event.event_date}-${idx}`}
            href={`/ativos/${event.symbol}`}
            className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 transition-colors hover:border-primary/20"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={cn('material-symbols-outlined text-sm', config.color)}>
                {config.icon}
              </span>
              <span className="font-mono text-xs text-on-surface-variant tabular-nums">
                {formatDate(event.event_date)}
              </span>
              <span className="text-xs font-medium text-on-surface truncate">
                {event.symbol}
              </span>
            </div>
            <span className={cn('text-xs font-medium shrink-0 ml-2', config.color)}>
              {config.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
