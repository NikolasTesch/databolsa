'use client';

import { useState } from 'react';
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
}

interface RankingItem {
  ticker: string;
  value: string;
}

/* ── Mock data ── */

const NAV_TABS = [
  { label: 'Ações', key: 'acoes' },
  { label: 'Fundos Imobiliários', key: 'fii' },
  { label: 'Criptomoedas', key: 'cripto' },
  { label: 'Índices', key: 'indices' },
] as const;

const FILTERS = ['Todas', 'Ações', 'FIIs', 'BDRs', 'ETFs', 'Cripto'] as const;

const HEADER_TICKERS: TickerValue[] = [
  { name: 'IBOV', value: '128.452,10', changePercent: '+1,24%', trend: 'up' },
  { name: 'S&P500', value: '5.123,40', changePercent: '-0,52%', trend: 'down' },
  { name: 'USD/BRL', value: '4,9523', changePercent: '-0,18%', trend: 'down' },
  { name: 'BTC/BRL', value: '345.890', changePercent: '+2,45%', trend: 'up' },
  { name: 'DXY', value: '104,20', changePercent: '0,00%', trend: 'flat' },
];

const TABLE_ROWS: MarketRow[] = [
  { ticker: 'PETR4', fullName: 'Petrobras PN', price: 'R$ 39,45', changePercent: '+1,85%', trend: 'up', pl: '4,2', dy: '16,4%', volume: '2,1B', mktCap: '514B' },
  { ticker: 'VALE3', fullName: 'Vale ON', price: 'R$ 62,10', changePercent: '-0,75%', trend: 'down', pl: '6,8', dy: '8,2%', volume: '1,5B', mktCap: '280B' },
  { ticker: 'ITUB4', fullName: 'Itaú Unibanco PN', price: 'R$ 34,22', changePercent: '+0,42%', trend: 'up', pl: '8,1', dy: '6,5%', volume: '850M', mktCap: '335B' },
  { ticker: 'BBDC4', fullName: 'Bradesco PN', price: 'R$ 14,05', changePercent: '-1,20%', trend: 'down', pl: '10,5', dy: '7,1%', volume: '620M', mktCap: '149B' },
  { ticker: 'WEGE3', fullName: 'WEG ON', price: 'R$ 38,90', changePercent: '+2,10%', trend: 'up', pl: '32,4', dy: '1,8%', volume: '310M', mktCap: '163B' },
  { ticker: 'MGLU3', fullName: 'Magaz Luiza ON', price: 'R$ 1,85', changePercent: '-4,63%', trend: 'down', pl: '—', dy: '0,0%', volume: '120M', mktCap: '12B' },
  { ticker: 'EMBR3', fullName: 'Embraer ON', price: 'R$ 32,10', changePercent: '+5,42%', trend: 'up', pl: '15,2', dy: '2,1%', volume: '890M', mktCap: '58B' },
  { ticker: 'SUZB3', fullName: 'Suzano ON', price: 'R$ 52,40', changePercent: '+3,15%', trend: 'up', pl: '8,9', dy: '5,8%', volume: '420M', mktCap: '72B' },
  { ticker: 'BBAS3', fullName: 'Banco do Brasil ON', price: 'R$ 28,75', changePercent: '+0,85%', trend: 'up', pl: '5,1', dy: '9,5%', volume: '1,1B', mktCap: '82B' },
  { ticker: 'JBSS3', fullName: 'JBS ON', price: 'R$ 35,20', changePercent: '-0,28%', trend: 'down', pl: '10,2', dy: '4,2%', volume: '480M', mktCap: '95B' },
];

const NEWS_ITEMS: NewsEntry[] = [
  { time: '14:32', headline: 'COPOM mantém Selic em 14,25% ao ano, decisão unânime' },
  { time: '13:15', headline: 'Petrobras anuncia nova política de preços para diesel' },
  { time: '11:50', headline: 'Inflação IPCA-15 desacelera para 0,32% em maio' },
  { time: '10:05', headline: 'Dólar recua com fluxo de exportações recorde' },
];

const TOP_GAINERS: RankingItem[] = [
  { ticker: 'EMBR3', value: '+5,42%' },
  { ticker: 'SUZB3', value: '+3,15%' },
  { ticker: 'WEGE3', value: '+2,10%' },
  { ticker: 'PRIO3', value: '+2,10%' },
  { ticker: 'JBSS3', value: '+2,88%' },
];

const DY_RANKING: RankingItem[] = [
  { ticker: 'PETR4', value: '16,4%' },
  { ticker: 'BBAS3', value: '9,5%' },
  { ticker: 'VALE3', value: '8,2%' },
  { ticker: 'BBDC4', value: '7,1%' },
  { ticker: 'ITUB4', value: '6,5%' },
];

const MKT_CAP_RANKING: RankingItem[] = [
  { ticker: 'PETR4', value: '514B' },
  { ticker: 'ITUB4', value: '335B' },
  { ticker: 'VALE3', value: '280B' },
  { ticker: 'WEGE3', value: '163B' },
  { ticker: 'BBDC4', value: '149B' },
];

const REVENUE_RANKING: RankingItem[] = [
  { ticker: 'PETR4', value: 'R$ 621B' },
  { ticker: 'VALE3', value: 'R$ 214B' },
  { ticker: 'JBSS3', value: 'R$ 178B' },
  { ticker: 'ITUB4', value: 'R$ 165B' },
  { ticker: 'BBAS3', value: 'R$ 132B' },
];

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

/* ── Rankings panel ── */

function RankingsPanel() {
  return (
    <div className="glass-panel p-4 rounded-lg">
      <h3 className="text-sm font-semibold text-on-surface mb-3">Rankings</h3>
      <div className="space-y-4">
        <RankingSubTable title="Maiores DY" items={DY_RANKING} accent="text-profit" />
        <div className="border-t border-border/40" />
        <RankingSubTable title="Maiores Mkt Cap" items={MKT_CAP_RANKING} accent="text-on-surface-variant" />
        <div className="border-t border-border/40" />
        <RankingSubTable title="Maiores Receitas" items={REVENUE_RANKING} accent="text-on-surface-variant" />
      </div>
    </div>
  );
}

/* ── Main component ── */

export default function FullMarketTable() {
  const [activeTab, setActiveTab] = useState('acoes');
  const [activeFilter, setActiveFilter] = useState('Todas');

  return (
    <section
      className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-8 space-y-6"
      aria-label="Mercado completo"
    >
      {/* ── 1. Quick Nav Menu ── */}
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

      {/* ── 2. Market Header Cards ── */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory">
        {HEADER_TICKERS.map((ticker) => (
          <MarketHeaderCard key={ticker.name} {...ticker} />
        ))}
      </div>

      {/* ── 3. Filter pills ── */}
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

      {/* ── 4. Main Data Table + 5. Sidebar ── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Table ─ 3/4 width */}
        <div className="xl:col-span-3 overflow-x-auto">
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
                  Mkt Cap
                </th>
              </tr>
            </thead>
            <tbody>
              {TABLE_ROWS.map((row, i) => (
                <TableRow key={row.ticker} row={row} index={i} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Sidebar ─ 1/4 width */}
        <div className="space-y-4">
          {/* Maiores Altas */}
          <div className="glass-panel p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-on-surface mb-3">Maiores Altas</h3>
            <div className="space-y-2">
              {TOP_GAINERS.slice(0, 4).map((item) => (
                <div key={item.ticker} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-outline w-4">
                      {TOP_GAINERS.indexOf(item) + 1}
                    </span>
                    <span className="font-mono text-xs text-on-surface font-semibold">
                      {item.ticker}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-profit">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notícias Urgentes */}
          <NewsSidebar items={NEWS_ITEMS} />

          {/* Rankings */}
          <RankingsPanel />
        </div>
      </div>
    </section>
  );
}
