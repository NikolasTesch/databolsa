'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
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

type FilterType = 'all' | 'DIVIDEND_EX' | 'DIVIDEND_PAYMENT' | 'EARNINGS' | 'MEETING' | 'SPLIT';

const TYPE_PILLS: Array<{ value: FilterType; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'DIVIDEND_EX', label: 'Dividendos' },
  { value: 'DIVIDEND_PAYMENT', label: 'Pagamentos' },
  { value: 'EARNINGS', label: 'Resultados' },
  { value: 'MEETING', label: 'Assembleias' },
];

const EVENT_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  DIVIDEND_EX: { icon: 'payments', color: 'text-primary', label: 'Data Ex' },
  DIVIDEND_PAYMENT: { icon: 'payments', color: 'text-primary', label: 'Pagamento' },
  EARNINGS: { icon: 'monitoring', color: 'text-secondary', label: 'Resultados' },
  MEETING: { icon: 'groups', color: 'text-tertiary', label: 'Assembleia' },
  SPLIT: { icon: 'swap_horiz', color: 'text-warning', label: 'Desdobramento' },
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

function getMonthLabel(dateStr: string): string {
  try {
    const [year, month] = dateStr.split('-');
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];
    const monthIdx = parseInt(month, 10) - 1;
    return `${monthNames[monthIdx]} de ${year}`;
  } catch {
    return dateStr;
  }
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg border border-border bg-surface p-4">
          <div className="h-3 w-20 rounded bg-surface-muted mb-2" />
          <div className="h-4 w-32 rounded bg-surface-muted mb-1" />
          <div className="h-3 w-full rounded bg-surface-muted" />
        </div>
      ))}
    </div>
  );
}

export function CalendarClient() {
  const [events, setEvents] = useState<CorporateEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch events for the next 60 days
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    const now = new Date();
    const future = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const from = now.toISOString().split('T')[0];
    const to = future.toISOString().split('T')[0];
    const limit = 100;

    try {
      const url = `/api/market/events?from=${from}&to=${to}&limit=${limit}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: EventsResponse = await res.json();
      setEvents(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (activeFilter !== 'all') {
      filtered = filtered.filter((e) => e.event_type === activeFilter);
    }

    if (debouncedSearch) {
      const q = debouncedSearch.toUpperCase();
      filtered = filtered.filter(
        (e) =>
          e.symbol.includes(q) ||
          (e.description ?? '').toUpperCase().includes(q),
      );
    }

    return filtered;
  }, [events, activeFilter, debouncedSearch]);

  // Group by month
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, CorporateEvent[]> = {};
    for (const event of filteredEvents) {
      const monthKey = event.event_date.slice(0, 7); // YYYY-MM
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(event);
    }
    // Sort months ascending
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredEvents]);

  if (error) {
    return (
      <div className="rounded-xl border border-danger bg-loss-surface p-4 text-sm text-loss">
        Erro ao carregar eventos: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por ticker ou descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
          />
        </div>

        {/* Type pills */}
        <div className="flex flex-wrap gap-2">
          {TYPE_PILLS.map((pill) => (
            <button
              key={pill.value}
              onClick={() => setActiveFilter(pill.value)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                activeFilter === pill.value
                  ? 'bg-primary text-white'
                  : 'bg-surface-muted text-on-surface-variant hover:bg-primary/10',
              )}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Eventos */}
      {loading ? (
        <SkeletonGrid />
      ) : groupedByMonth.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <span className="material-symbols-outlined text-[3rem] text-on-surface-variant/40">
            event_busy
          </span>
          <p className="text-sm text-on-surface-variant">
            Nenhum evento encontrado para este período.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedByMonth.map(([monthKey, monthEvents]) => (
            <section key={monthKey}>
              <h2 className="text-base font-semibold text-on-surface mb-3">
                {getMonthLabel(monthKey)}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {monthEvents.map((event, idx) => {
                  const cfg = EVENT_CONFIG[event.event_type] ?? {
                    icon: 'event',
                    color: 'text-on-surface-variant',
                    label: event.event_type,
                  };
                  return (
                    <div
                      key={`${event.event_type}-${event.event_date}-${idx}`}
                      className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary/20"
                    >
                      <div className={cn('flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted', cfg.color)}>
                        <span className="material-symbols-outlined text-base">{cfg.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Link
                            href={`/ativos/${event.symbol}`}
                            className="font-mono text-xs font-bold text-on-surface hover:text-primary transition-colors"
                          >
                            {event.symbol}
                          </Link>
                          <span className="font-mono text-xs text-on-surface-variant tabular-nums">
                            {formatDate(event.event_date)}
                          </span>
                          <span className={cn('text-xs font-medium', cfg.color)}>
                            {cfg.label}
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
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
