'use client';

import { useState, useEffect, useCallback } from 'react';

interface AssetItem {
  ticker: string;
  name: string;
  price: string;
  changePercent: string;
}

interface HighlightsResponse {
  gainers: AssetItem[];
  losers: AssetItem[];
  type: string;
}

const ASSET_CLASSES = [
  { label: 'Ações', key: 'STOCK_BR' },
  { label: 'FIIs', key: 'FII' },
  { label: 'ETFs', key: 'ETF' },
  { label: 'BDRs', key: 'BDR' },
  { label: 'Cripto', key: 'CRYPTO' },
];

export default function ScreenerAvaliador() {
  const [activeTab, setActiveTab] = useState('STOCK_BR');
  const [data, setData] = useState<HighlightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async (type: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/market/highlights?type=${type}&limit=20`);
      if (res.ok) {
        const json: HighlightsResponse = await res.json();
        setData(json);
      } else {
        setData(null);
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, fetchData]);

  const allAssets = data
    ? [...(data.gainers ?? []), ...(data.losers ?? [])]
    : [];

  const filtered = search
    ? allAssets.filter(
        (a) =>
          a.ticker.toLowerCase().includes(search.toLowerCase()) ||
          a.name.toLowerCase().includes(search.toLowerCase()),
      )
    : allAssets;

  return (
    <div>
      {/* Search + Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por ticker ou nome..."
            className="w-full rounded-lg border border-border bg-surface py-2 pl-10 pr-3 text-sm text-on-surface placeholder:text-on-surface-variant outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

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
              onClick={() => { setActiveTab(tab.key); setSearch(''); }}
              className={`flex-shrink-0 snap-start rounded-full border px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-surface text-on-surface-variant border-border/50 hover:border-border hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-surface-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-3">
            search_off
          </span>
          <p className="text-sm text-on-surface-variant">
            {search ? 'Nenhum ativo encontrado para esta busca.' : 'Nenhum dado disponível.'}
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted text-xs text-on-surface-variant uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-medium w-12">#</th>
                <th className="px-4 py-3 text-left font-medium">Ticker</th>
                <th className="px-4 py-3 text-left font-medium">Nome</th>
                <th className="px-4 py-3 text-right font-medium">Preço</th>
                <th className="px-4 py-3 text-right font-medium">Variação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((asset, idx) => {
                const isPositive = asset.changePercent.startsWith('+');
                return (
                  <tr
                    key={asset.ticker}
                    className="border-b border-border/50 last:border-b-0 hover:bg-surface-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-on-surface-variant">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-semibold text-on-surface">{asset.ticker}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-on-surface-variant max-w-[200px] truncate">
                      {asset.name}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-on-surface tabular-nums">
                      {asset.price}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-sm font-medium tabular-nums ${
                          isPositive ? 'text-profit' : 'text-loss'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isPositive ? 'trending_up' : 'trending_down'}
                        </span>
                        {asset.changePercent}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-on-surface-variant mt-3 text-center">
        Exibindo {filtered.length} ativo{filtered.length !== 1 ? 's' : ''} • Dados atualizados em tempo real
      </p>
    </div>
  );
}
