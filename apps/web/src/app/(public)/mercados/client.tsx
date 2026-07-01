'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@/components/ui/cn';

/* ── Types ── */

interface IndexItem {
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

interface HighlightItem {
  ticker: string;
  name: string;
  assetClass: string;
  price: string;
  changePercent: string;
  stale: boolean;
}

interface NewsArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
}

interface NewsEntry {
  time: string;
  headline: string;
}

interface MarketRow {
  ticker: string;
  fullName: string;
  price: string;
  changePercent: string;
  trend: 'up' | 'down' | 'flat';
  pl: string;
  dy: string;
  volume: string;
  mktCap: string;
}

/* ── Constants ── */

const ASSET_CLASSES = [
  { label: 'Ações', key: 'STOCK_BR' },
  { label: 'FIIs', key: 'FII' },
  { label: 'BDRs', key: 'BDR' },
  { label: 'ETFs', key: 'ETF' },
  { label: 'Cripto', key: 'CRYPTO' },
  { label: 'Stocks US', key: 'STOCK_US' },
] as const;

const SORT_OPTIONS = [
  { label: 'Maiores altas', value: 'change' },
  { label: 'Maiores baixas', value: 'change_asc' },
  { label: 'Nome (A-Z)', value: 'name' },
] as const;

const BADGE_BG = [
  'bg-blue-500/15',
  'bg-emerald-500/15',
  'bg-violet-500/15',
  'bg-amber-500/15',
  'bg-rose-500/15',
  'bg-cyan-500/15',
  'bg-orange-500/15',
  'bg-teal-500/15',
  'bg-indigo-500/15',
  'bg-pink-500/15',
];

const ITEMS_PER_PAGE = 20;

/* ── Helpers ── */

function detectTrend(change: string | null): 'up' | 'down' | 'flat' {
  if (change === null || change === '0' || change === '0,00%') return 'flat';
  return change.startsWith('+') ? 'up' : 'down';
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/* ── Sub-components ── */

function TrendBadge({
  trend,
  changePercent,
}: {
  trend: 'up' | 'down' | 'flat';
  changePercent: string;
}) {
  const color =
    trend === 'up'
      ? 'text-profit'
      : trend === 'down'
        ? 'text-loss'
        : 'text-neutralChange';
  return <span className={cn('font-mono text-sm', color)}>{changePercent}</span>;
}

function TrendIcon({
  trend,
  size = 'text-sm',
}: {
  trend: 'up' | 'down' | 'flat';
  size?: string;
}) {
  const icon =
    trend === 'up'
      ? 'trending_up'
      : trend === 'down'
        ? 'trending_down'
        : 'horizontal_rule';
  const color =
    trend === 'up'
      ? 'text-profit'
      : trend === 'down'
        ? 'text-loss'
        : 'text-neutralChange';
  return (
    <span className={cn('material-symbols-outlined', size, color)} aria-hidden="true">
      {icon}
    </span>
  );
}

function MarketHeaderCard({
  name,
  value,
  changePercent,
  trend,
}: IndexDisplay) {
  return (
    <div className="glass-panel p-4 rounded-lg min-w-[200px] flex-shrink-0 snap-start">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono uppercase tracking-wide text-outline">{name}</span>
        <TrendIcon trend={trend} size="text-[18px]" />
      </div>
      <div className="font-mono text-lg font-semibold text-on-surface">{value}</div>
      <div className="mt-0.5">
        <TrendBadge trend={trend} changePercent={changePercent} />
      </div>
    </div>
  );
}

function PillButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-shrink-0 snap-start rounded-full border px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
        isActive
          ? 'bg-primary/10 text-primary border-primary/30'
          : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-border hover:text-on-surface',
      )}
    >
      {label}
    </button>
  );
}

function TableRow({
  row,
  index,
}: {
  row: MarketRow;
  index: number;
}) {
  const isPositive = row.trend === 'up';

  return (
    <tr className="border-b border-border/50 hover:bg-surface-muted/50 transition-colors">
      {/* Ativo */}
      <td className="py-3 px-2">
        <Link
          href={`/ativos/${row.ticker}?class=${row.fullName ? 'STOCK_BR' : ''}`}
          className="flex items-center gap-3"
        >
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm font-semibold text-on-surface',
              BADGE_BG[index % BADGE_BG.length],
            )}
          >
            {row.ticker.charAt(0)}
          </div>
          <div>
            <div className="font-mono font-semibold text-on-surface text-sm">{row.ticker}</div>
            <div className="text-caption text-on-surface-variant line-clamp-1">{row.fullName}</div>
          </div>
        </Link>
      </td>

      {/* Preço */}
      <td className="py-3 px-2 font-mono text-sm text-on-surface">{row.price}</td>

      {/* Var % */}
      <td className="py-3 px-2">
        <div className="flex items-center gap-1">
          <TrendIcon trend={row.trend} size="text-[16px]" />
          <TrendBadge trend={row.trend} changePercent={row.changePercent} />
        </div>
      </td>

      {/* P/L */}
      <td className="py-3 px-2 font-mono text-sm text-on-surface-variant">{row.pl}</td>

      {/* DY % */}
      <td className="py-3 px-2 font-mono text-sm text-on-surface-variant">{row.dy}</td>

      {/* Volume */}
      <td className="py-3 px-2 font-mono text-sm text-on-surface-variant">{row.volume}</td>

      {/* Mkt Cap */}
      <td className="py-3 px-2 font-mono text-sm text-on-surface-variant">{row.mktCap}</td>
    </tr>
  );
}

function NewsSidebar({ items }: { items: NewsEntry[] }) {
  if (items.length === 0) return null;

  return (
    <div className="glass-panel p-4 rounded-lg">
      <h3 className="text-sm font-semibold text-on-surface mb-3">Notícias Urgentes</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.headline} className="flex gap-2">
            <time className="font-mono text-xs text-outline flex-shrink-0 mt-0.5">{item.time}</time>
            <p className="text-xs text-on-surface-variant leading-snug line-clamp-2">{item.headline}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="h-14 rounded-lg bg-surface-muted animate-pulse" />
      ))}
    </div>
  );
}

/* ── Main Component ── */

export function MercadosClient() {
  const [activeTab, setActiveTab] = useState<string>('STOCK_BR');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('change');
  const [page, setPage] = useState(1);

  const [allItems, setAllItems] = useState<HighlightItem[]>([]);
  const [indices, setIndices] = useState<IndexDisplay[]>([]);
  const [news, setNews] = useState<NewsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  /* ── Fetch highlights for active tab ── */
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(false);

      try {
        const [highlightsRes, newsRes] = await Promise.all([
          fetch(`/api/market/highlights?type=${activeTab}&limit=50`),
          fetch('/api/market/news?limit=4'),
        ]);

        if (cancelled) return;

        if (highlightsRes.ok) {
          const data = await highlightsRes.json();
          const combined = [...(data.gainers ?? []), ...(data.losers ?? [])];
          setAllItems(combined);
        } else {
          setAllItems([]);
          setError(true);
        }

        if (newsRes.ok) {
          const data = await newsRes.json();
          if (data?.news) {
            setNews(
              data.news.map((a: NewsArticle) => ({
                time: formatTime(a.publishedAt),
                headline: a.title,
              })),
            );
          }
        }
      } catch {
        if (!cancelled) {
          setAllItems([]);
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [activeTab]);

  /* ── Fetch indices once ── */
  useEffect(() => {
    async function fetchIndices() {
      try {
        const res = await fetch('/api/market/indices');
        if (res.ok) {
          const data = await res.json();
          if (data?.indices) {
            setIndices(
              data.indices.map((idx: IndexItem) => ({
                name: idx.label,
                value: idx.value,
                changePercent: idx.changePercent ?? '—',
                trend: detectTrend(idx.changePercent),
              })),
            );
          }
        }
      } catch {
        // silently fail — component shows empty indices row
      }
    }

    fetchIndices();
  }, []);

  /* ── Reset page on filter change ── */
  useEffect(() => {
    setPage(1);
  }, [activeTab, search, sort]);

  /* ── Process items: filter + sort + paginate ── */
  const { rows, totalPages } = useMemo(() => {
    const q = search.toLowerCase().trim();

    let filtered = allItems;
    if (q) {
      filtered = allItems.filter(
        (i) =>
          i.ticker.toLowerCase().includes(q) ||
          i.name.toLowerCase().includes(q),
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      const aVal = parseFloat(a.changePercent);
      const bVal = parseFloat(b.changePercent);
      if (sort === 'change_asc') return aVal - bVal;
      if (sort === 'name') return a.ticker.localeCompare(b.ticker);
      return bVal - aVal;
    });

    const total = Math.ceil(sorted.length / ITEMS_PER_PAGE);
    const paged = sorted.slice(
      (page - 1) * ITEMS_PER_PAGE,
      page * ITEMS_PER_PAGE,
    );

    const rows: MarketRow[] = paged.map((h) => ({
      ticker: h.ticker,
      fullName: h.name,
      price: h.price,
      changePercent: h.changePercent,
      trend: detectTrend(h.changePercent) as 'up' | 'down' | 'flat',
      pl: '—',
      dy: '—',
      volume: '—',
      mktCap: '—',
    }));

    return { rows, totalPages: total };
  }, [allItems, search, sort, page]);

  /* ── Top gainers / losers for sidebar ── */
  const topGainers = useMemo(() => {
    return [...allItems]
      .filter((i) => parseFloat(i.changePercent) >= 0)
      .sort((a, b) => parseFloat(b.changePercent) - parseFloat(a.changePercent))
      .slice(0, 4);
  }, [allItems]);

  const topLosers = useMemo(() => {
    return [...allItems]
      .filter((i) => parseFloat(i.changePercent) < 0)
      .sort((a, b) => parseFloat(a.changePercent) - parseFloat(b.changePercent))
      .slice(0, 4);
  }, [allItems]);

  const activeClassLabel =
    ASSET_CLASSES.find((c) => c.key === activeTab)?.label ?? 'Ativos';

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-background">
      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden py-20 border-b border-border/40">
        {/* Grid mesh background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(var(--color-primary) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Gradient orbs */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div
            className="absolute -left-48 -top-48 h-[540px] w-[540px] rounded-full blur-3xl opacity-[0.08]"
            style={{ backgroundColor: 'var(--color-primary)' }}
          />
          <div
            className="absolute -right-28 top-1/4 h-[380px] w-[380px] rounded-full blur-3xl opacity-[0.06]"
            style={{ backgroundColor: 'var(--color-secondary)' }}
          />
        </div>

        <div className="relative mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
          <div className="max-w-2xl space-y-6">
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-4 py-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-secondary" />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-secondary">
                Mercado em tempo real
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-on-surface">
              Mercado{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                Overview
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-on-surface-variant leading-relaxed max-w-xl">
              Acompanhe cotações, variações e notícias do mercado financeiro em
              tempo real. Ações, FIIs, BDRs, ETFs, criptomoedas e stocks
              americanos.
            </p>

            {/* Indices stats */}
            {indices.length > 0 && (
              <div className="flex flex-wrap items-center gap-4">
                {indices.slice(0, 4).map((idx) => (
                  <div key={idx.name} className="flex items-center gap-2">
                    <span className="font-mono text-xs text-outline uppercase">
                      {idx.name}
                    </span>
                    <span className="font-mono text-sm font-semibold text-on-surface tabular-nums">
                      {idx.value}
                    </span>
                    <TrendBadge trend={idx.trend} changePercent={idx.changePercent} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Content ─── */}
      <section className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-8 space-y-6">
        {/* ── Tabs ── */}
        <div
          className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory"
          role="tablist"
          aria-label="Classe de ativo"
        >
          {ASSET_CLASSES.map((tab) => (
            <PillButton
              key={tab.key}
              label={tab.label}
              isActive={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
            />
          ))}
        </div>

        {/* ── Search + Sort ── */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full md:w-72">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-lg pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Buscar em ${activeClassLabel}...`}
              className="w-full bg-surface-container-low border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <span className="text-on-surface-variant">Ordenar:</span>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={cn(
                  'px-2 py-0.5 rounded transition-colors',
                  sort === opt.value
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-on-surface-variant hover:text-on-surface',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table + Sidebar ── */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Table area */}
          <div className="xl:col-span-3 overflow-x-auto">
            {loading ? (
              <SkeletonRows />
            ) : error || rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
                <span className="material-symbols-outlined text-[48px] mb-4">
                  {search ? 'search_off' : 'finance_mode'}
                </span>
                <p className="text-sm font-medium">
                  {search
                    ? 'Nenhum ativo encontrado'
                    : 'Nenhum dado disponível no momento.'}
                </p>
                <p className="text-xs mt-1">
                  {search
                    ? 'Tente ajustar a busca ou o filtro.'
                    : 'Tente novamente em instantes.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-caption text-on-surface-variant uppercase tracking-wide font-medium py-3 px-2 whitespace-nowrap">
                      Ativo
                    </th>
                    <th className="text-caption text-on-surface-variant uppercase tracking-wide font-medium py-3 px-2 whitespace-nowrap">
                      Preço
                    </th>
                    <th className="text-caption text-on-surface-variant uppercase tracking-wide font-medium py-3 px-2 whitespace-nowrap">
                      Var %
                    </th>
                    <th className="text-caption text-on-surface-variant uppercase tracking-wide font-medium py-3 px-2 whitespace-nowrap">
                      P/L
                    </th>
                    <th className="text-caption text-on-surface-variant uppercase tracking-wide font-medium py-3 px-2 whitespace-nowrap">
                      DY %
                    </th>
                    <th className="text-caption text-on-surface-variant uppercase tracking-wide font-medium py-3 px-2 whitespace-nowrap">
                      Volume
                    </th>
                    <th className="text-caption text-on-surface-variant uppercase tracking-wide font-medium py-3 px-2 whitespace-nowrap">
                      Valor de Mercado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <TableRow key={row.ticker} row={row} index={i} />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Maiores Altas */}
            <div className="glass-panel p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-on-surface mb-3">Maiores Altas</h3>
              {topGainers.length > 0 ? (
                <div className="space-y-2">
                  {topGainers.map((item, i) => (
                    <Link
                      key={item.ticker}
                      href={`/ativos/${item.ticker}?class=${item.assetClass}`}
                      className="flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-outline w-4">{i + 1}</span>
                        <span className="font-mono text-xs text-on-surface font-semibold group-hover:text-primary transition-colors">
                          {item.ticker}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-profit">{item.changePercent}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant">Carregando...</p>
              )}
            </div>

            {/* Maiores Baixas */}
            <div className="glass-panel p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-on-surface mb-3">Maiores Baixas</h3>
              {topLosers.length > 0 ? (
                <div className="space-y-2">
                  {topLosers.map((item, i) => (
                    <Link
                      key={item.ticker}
                      href={`/ativos/${item.ticker}?class=${item.assetClass}`}
                      className="flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-outline w-4">{i + 1}</span>
                        <span className="font-mono text-xs text-on-surface font-semibold group-hover:text-primary transition-colors">
                          {item.ticker}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-loss">{item.changePercent}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant">Carregando...</p>
              )}
            </div>

            {/* Notícias */}
            <NewsSidebar items={news} />
          </div>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  'px-3 py-1 rounded text-sm transition-colors',
                  p === page
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface text-on-surface-variant hover:bg-surface-muted',
                )}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
