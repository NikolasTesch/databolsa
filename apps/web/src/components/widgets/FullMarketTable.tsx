'use client';

import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/components/ui/cn';

/* ── Types ── */

interface TickerValue {
  name: string;
  value: string;
  changePercent: string;
  trend: 'up' | 'down' | 'flat';
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

interface NewsEntry {
  time: string;
  headline: string;
  href?: string;
}

interface RankingItem {
  ticker: string;
  value: string;
}

interface IndexApiItem {
  id: string;
  label: string;
  value: string;
  changePercent: string | null;
  stale: boolean;
}

interface HighlightItem {
  ticker: string;
  name: string;
  price: string;
  changePercent: string;
}

interface NewsArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
}

const NAV_TABS = [
  { label: 'Ações', key: 'acoes' },
  { label: 'Fundos Imobiliários', key: 'fii' },
  { label: 'Criptomoedas', key: 'cripto' },
  { label: 'Índices', key: 'indices' },
] as const;

const FILTERS = ['Todas', 'Ações', 'FIIs', 'BDRs', 'ETFs', 'Cripto'] as const;

function detectTrend(change: string | null): 'up' | 'down' | 'flat' {
  if (change === null || change === '0' || change === '0,00%') return 'flat';
  return change.startsWith('+') ? 'up' : 'down';
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

/* ── Shared helpers ── */

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

function TrendBadge({ trend, changePercent }: { trend: 'up' | 'down' | 'flat'; changePercent: string }) {
  const color =
    trend === 'up' ? 'text-profit' : trend === 'down' ? 'text-loss' : 'text-neutralChange';
  return <span className={cn('font-mono text-sm', color)}>{changePercent}</span>;
}

function TrendIcon({ trend, size = 'text-sm' }: { trend: 'up' | 'down' | 'flat'; size?: string }) {
  const icon = trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'horizontal_rule';
  const color =
    trend === 'up' ? 'text-profit' : trend === 'down' ? 'text-loss' : 'text-neutralChange';
  return (
    <span className={cn('material-symbols-outlined', size, color)} aria-hidden="true">
      {icon}
    </span>
  );
}

/* ── Pill button ── */

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

/* ── Market header card ── */

function MarketHeaderCard({ name, value, changePercent, trend }: TickerValue) {
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

/* ── Table row ── */

function TableRow({ row, index }: { row: MarketRow; index: number }) {
  return (
    <tr className="border-b border-border/50 hover:bg-surface-muted/50 transition-colors">
      {/* Ativo */}
      <td className="py-3 px-2">
        <div className="flex items-center gap-3">
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
            <div className="text-caption text-on-surface-variant">{row.fullName}</div>
          </div>
        </div>
      </td>

      {/* Preço */}
      <td className="py-3 px-2 font-mono text-sm text-on-surface">{row.price}</td>

      {/* Var % */}
      <td className="py-3 px-2">
        <TrendBadge trend={row.trend} changePercent={row.changePercent} />
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

/* ── News sidebar ── */

function NewsSidebar({ items }: { items: NewsEntry[] }) {
  return (
    <div className="glass-panel p-4 rounded-lg">
      <h3 className="text-sm font-semibold text-on-surface mb-3">Notícias Urgentes</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.headline} className="flex gap-2">
            <time className="font-mono text-xs text-outline flex-shrink-0 mt-0.5">{item.time}</time>
            <p className="text-xs text-on-surface-variant leading-snug">{item.headline}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Ranking sub-table ── */

function RankingSubTable({
  title,
  items,
  accent,
}: {
  title: string;
  items: RankingItem[];
  accent?: string;
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">{title}</h4>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={item.ticker} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-outline w-4">{i + 1}</span>
              <span className="font-mono text-xs text-on-surface font-semibold">{item.ticker}</span>
            </div>
            <span className={cn('font-mono text-xs', accent)}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main component ── */

export default function FullMarketTable() {
  const [activeTab, setActiveTab] = useState('acoes');
  const [activeFilter, setActiveFilter] = useState('Todas');
  const [indices, setIndices] = useState<TickerValue[]>([]);
  const [highlightsGainers, setHighlightsGainers] = useState<HighlightItem[]>([]);
  const [highlightsLosers, setHighlightsLosers] = useState<HighlightItem[]>([]);
  const [news, setNews] = useState<NewsEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [indicesRes, highlightsRes, newsRes] = await Promise.all([
          fetch('/api/market/indices'),
          fetch('/api/market/highlights?type=STOCK_BR&limit=10'),
          fetch('/api/market/news?limit=4'),
        ]);

        if (indicesRes.ok) {
          const data = await indicesRes.json();
          if (data?.indices) {
            setIndices(
              data.indices.map((idx: IndexApiItem) => ({
                name: idx.label,
                value: idx.value,
                changePercent: idx.changePercent ?? '—',
                trend: detectTrend(idx.changePercent),
              })),
            );
          }
        }

        if (highlightsRes.ok) {
          const data = await highlightsRes.json();
          if (data?.gainers) setHighlightsGainers(data.gainers);
          if (data?.losers) setHighlightsLosers(data.losers);
        }

        if (newsRes.ok) {
          const data = await newsRes.json();
          if (data?.news) {
            setNews(
              data.news.slice(0, 4).map((article: NewsArticle) => ({
                time: formatTime(article.publishedAt),
                headline: article.title,
                href: article.url,
              })),
            );
          }
        }
      } catch {
        // Component will show empty state
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const tableRows = useMemo((): MarketRow[] => {
    const gainers = (highlightsGainers ?? []).map((h) => ({
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
    const losers = (highlightsLosers ?? []).map((h) => ({
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
    return [...gainers, ...losers].slice(0, 10);
  }, [highlightsGainers, highlightsLosers]);

  const topGainers = useMemo((): RankingItem[] => {
    return (highlightsGainers ?? []).slice(0, 4).map((h) => ({
      ticker: h.ticker,
      value: h.changePercent,
    }));
  }, [highlightsGainers]);

  return (
    <section
      className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-8 space-y-6"
      aria-label="Mercado completo"
    >
      <div
        className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory"
        role="tablist"
        aria-label="Categoria de ativos"
      >
        {NAV_TABS.map((tab) => (
          <PillButton
            key={tab.key}
            label={tab.label}
            isActive={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          />
        ))}
      </div>

      {indices.length > 0 && (
        <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory">
          {indices.map((idx) => (
            <MarketHeaderCard key={idx.name} {...idx} />
          ))}
        </div>
      )}

      {activeTab === 'acoes' && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                'flex-shrink-0 snap-start rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors',
                activeFilter === filter
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-border hover:text-on-surface',
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 overflow-x-auto">
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-surface-muted animate-pulse" />
              ))}
            </div>
          ) : tableRows.length === 0 ? (
            <p className="text-sm text-on-surface-variant py-8 text-center">Nenhum dado disponível no momento.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-caption text-on-surface-variant uppercase tracking-wide font-medium py-3 px-2 whitespace-nowrap">Ativo</th>
                  <th className="text-caption text-on-surface-variant uppercase tracking-wide font-medium py-3 px-2 whitespace-nowrap">Preço</th>
                  <th className="text-caption text-on-surface-variant uppercase tracking-wide font-medium py-3 px-2 whitespace-nowrap">Var %</th>
                  <th className="text-caption text-on-surface-variant uppercase tracking-wide font-medium py-3 px-2 whitespace-nowrap">P/L</th>
                  <th className="text-caption text-on-surface-variant uppercase tracking-wide font-medium py-3 px-2 whitespace-nowrap">DY %</th>
                  <th className="text-caption text-on-surface-variant uppercase tracking-wide font-medium py-3 px-2 whitespace-nowrap">Volume</th>
                  <th className="text-caption text-on-surface-variant uppercase tracking-wide font-medium py-3 px-2 whitespace-nowrap">Valor de Mercado</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, i) => (
                  <TableRow key={row.ticker} row={row} index={i} />
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="space-y-4">
          {/* Maiores Altas */}
          <div className="glass-panel p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-on-surface mb-3">Maiores Altas</h3>
            {topGainers.length > 0 ? (
              <div className="space-y-2">
                {topGainers.map((item, i) => (
                  <div key={item.ticker} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-outline w-4">{i + 1}</span>
                      <span className="font-mono text-xs text-on-surface font-semibold">{item.ticker}</span>
                    </div>
                    <span className="font-mono text-xs text-profit">{item.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant">Carregando...</p>
            )}
          </div>

          {/* Notícias Urgentes */}
          {news.length > 0 && <NewsSidebar items={news} />}
        </div>
      </div>
    </section>
  );
}
