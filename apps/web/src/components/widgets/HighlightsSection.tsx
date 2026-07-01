'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/components/ui/cn';

interface AssetItem {
  ticker: string;
  name: string;
  price: string;
  changePercent: string;
  assetClass?: string;
}

interface HighlightItem {
  ticker: string;
  name: string;
  price: string;
  changePercent: string;
}

interface HighlightsResponse {
  gainers: HighlightItem[];
  losers: HighlightItem[];
  type: string;
}

const ASSET_CLASSES = [
  { label: 'Ações', key: 'STOCK_BR' },
  { label: 'FIIs', key: 'FII' },
  { label: 'BDRs', key: 'BDR' },
  { label: 'ETFs', key: 'ETF' },
  { label: 'Cripto', key: 'CRYPTO' },
] as const;

function AssetCard({ ticker, name, price, changePercent, assetClass }: AssetItem) {
  const isPositive = changePercent.startsWith('+');

  return (
    <Link
      href={`/ativos/${ticker}?class=${assetClass ?? 'STOCK_BR'}`}
      className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 hover:bg-surface-muted transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
    >
      {/* Ticker circle */}
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-surface-muted font-mono text-xs font-semibold text-on-surface">
        {ticker.slice(0, 2)}
      </div>

      {/* Name + price */}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-mono text-sm font-semibold text-on-surface">
          {ticker}
        </span>
        <span className="truncate text-xs text-on-surface-variant">
          {name} &middot; {price}
        </span>
      </div>

      {/* Change percent */}
      <span
        className={cn(
          'flex-shrink-0 font-mono text-sm font-medium tabular-nums',
          isPositive ? 'text-profit' : 'text-loss',
        )}
      >
        {changePercent}
      </span>
    </Link>
  );
}

export default function HighlightsSection() {
  const [activeTab, setActiveTab] = useState<string>('STOCK_BR');
  const [data, setData] = useState<HighlightsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/market/highlights?type=${activeTab}&limit=4`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [activeTab]);

  const gainers = data?.gainers ?? [];
  const losers = data?.losers ?? [];

  return (
    <section
      id="mercados"
      className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-10"
      aria-label="Destaques do mercado"
    >
      {/* Tab bar */}
      <div
        className="mb-6 flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory"
        role="tablist"
        aria-label="Classe de ativo"
      >
        {ASSET_CLASSES.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-shrink-0 snap-start rounded-full border px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
                isActive
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-surface text-on-surface-variant border-border/50 hover:border-border hover:text-on-surface',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[68px] rounded-lg bg-surface-muted animate-pulse" />
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[68px] rounded-lg bg-surface-muted animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* Two-column grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gainers */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-profit" aria-hidden="true">
                  trending_up
                </span>
                <h3 className="text-base font-semibold text-on-surface">Maiores Altas</h3>
              </div>
              <Link
                href={`/mercados?classe=${activeTab}`}
                className="text-sm text-primary hover:underline"
              >
                Ver todos
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              {gainers.length > 0 ? gainers.map((asset) => (
                <AssetCard key={asset.ticker} ticker={asset.ticker} name={asset.name} price={asset.price} changePercent={asset.changePercent} assetClass={data?.type ?? 'STOCK_BR'} />
              )) : (
                <p className="text-sm text-on-surface-variant py-4 text-center">Nenhum dado disponível.</p>
              )}
            </div>
          </div>

          {/* Losers */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-loss" aria-hidden="true">
                  trending_down
                </span>
                <h3 className="text-base font-semibold text-on-surface">Maiores Baixas</h3>
              </div>
              <Link
                href={`/mercados?sort=change_asc`}
                className="text-sm text-primary hover:underline"
              >
                Ver todos
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              {losers.length > 0 ? losers.map((asset) => (
                <AssetCard key={asset.ticker} ticker={asset.ticker} name={asset.name} price={asset.price} changePercent={asset.changePercent} assetClass={data?.type ?? 'STOCK_BR'} />
              )) : (
                <p className="text-sm text-on-surface-variant py-4 text-center">Nenhum dado disponível.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
