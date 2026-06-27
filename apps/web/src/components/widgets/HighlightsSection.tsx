'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/components/ui/cn';

interface AssetItem {
  ticker: string;
  name: string;
  price: string;
  changePercent: string;
}

const ASSET_CLASSES = [
  { label: 'Ações', key: 'STOCK_BR' },
  { label: 'FIIs', key: 'FII' },
  { label: 'BDRs', key: 'BDR' },
  { label: 'ETFs', key: 'ETF' },
  { label: 'Cripto', key: 'CRYPTO' },
] as const;

const MOCK_GAINERS: AssetItem[] = [
  { ticker: 'PETR4', name: 'Petrobras', price: 'R$ 38,45', changePercent: '+3,24%' },
  { ticker: 'VALE3', name: 'Vale', price: 'R$ 67,80', changePercent: '+2,18%' },
  { ticker: 'EMBR3', name: 'Embraer', price: 'R$ 32,10', changePercent: '+5,42%' },
];

const MOCK_LOSERS: AssetItem[] = [
  { ticker: 'MGLU3', name: 'Magazine Luiza', price: 'R$ 1,75', changePercent: '-5,42%' },
  { ticker: 'COGN3', name: 'Cogna Educação', price: 'R$ 2,46', changePercent: '-3,15%' },
  { ticker: 'BBDC4', name: 'Bradesco', price: 'R$ 14,05', changePercent: '-1,20%' },
];

function AssetCard({ ticker, name, price, changePercent }: AssetItem) {
  const isPositive = changePercent.startsWith('+');

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 hover:bg-surface-muted transition-colors">
      {/* Ticker circle */}
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-surface-muted font-mono text-sm text-content">
        {ticker}
      </div>

      {/* Name + price */}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-mono text-sm font-semibold text-content">
          {ticker}
        </span>
        <span className="truncate text-xs text-content-muted">
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
    </div>
  );
}

export default function HighlightsSection() {
  const [activeTab, setActiveTab] = useState<string>('STOCK_BR');

  return (
    <section
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
                  : 'bg-surface text-content-muted border-border/50 hover:border-border hover:text-content',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gainers */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-profit" aria-hidden="true">
                trending_up
              </span>
              <h3 className="text-base font-semibold text-content">Maiores Altas</h3>
            </div>
            <Link
              href={`/ativos?sort=change`}
              className="text-sm text-primary hover:underline"
            >
              Ver todos
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {MOCK_GAINERS.map((asset) => (
              <AssetCard key={asset.ticker} {...asset} />
            ))}
          </div>
        </div>

        {/* Losers */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-loss" aria-hidden="true">
                trending_down
              </span>
              <h3 className="text-base font-semibold text-content">Maiores Baixas</h3>
            </div>
            <Link
              href={`/ativos?sort=change_asc`}
              className="text-sm text-primary hover:underline"
            >
              Ver todos
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {MOCK_LOSERS.map((asset) => (
              <AssetCard key={asset.ticker} {...asset} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
