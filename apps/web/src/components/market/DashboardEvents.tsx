'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { CompactEventsList } from '@/components/market/EventsList';

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

interface DashboardEventsProps {
  tickers: string[];
}

export function DashboardEvents({ tickers }: DashboardEventsProps) {
  const [events, setEvents] = useState<CorporateEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tickers || tickers.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      const from = new Date().toISOString().split('T')[0];
      // Próximos 90 dias
      const future = new Date();
      future.setDate(future.getDate() + 90);
      const to = future.toISOString().split('T')[0];

      const results: CorporateEvent[] = [];

      // Busca eventos para cada ticker em paralelo (lotes)
      const batchSize = 3;
      for (let i = 0; i < tickers.length; i += batchSize) {
        const batch = tickers.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(
          batch.map((ticker) =>
            fetch(`/api/market/${encodeURIComponent(ticker)}/events?from=${from}&to=${to}&limit=5`)
              .then((r) => (r.ok ? r.json() : null) as Promise<EventsResponse | null>)
              .then((d) => d?.data ?? []),
          ),
        );

        for (const r of batchResults) {
          if (r.status === 'fulfilled') {
            results.push(...r.value);
          }
        }
      }

      if (!cancelled) {
        // Ordenar por data
        results.sort((a, b) => a.event_date.localeCompare(b.event_date));
        // Pegar os 5 mais próximos
        const now = new Date().toISOString().split('T')[0];
        const upcoming = results.filter((e) => e.event_date >= now);
        setEvents(upcoming.slice(0, 5));
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [tickers]);

  if (loading) {
    return (
      <Card padding="md">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary">event</span>
          <h2 className="text-sm font-medium text-on-surface-variant">Próximos Eventos</h2>
        </div>
        <div className="space-y-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg bg-surface-muted h-10" />
          ))}
        </div>
      </Card>
    );
  }

  if (events.length === 0) {
    return null; // Only visible when there are events
  }

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">event</span>
          <h2 className="text-sm font-medium text-on-surface-variant">Próximos Eventos</h2>
        </div>
        <a
          href="/calendario-eventos"
          className="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
        >
          Ver todos
        </a>
      </div>
      <CompactEventsList events={events} max={5} />
    </Card>
  );
}
