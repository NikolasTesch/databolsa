'use client';

import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/components/ui/cn';
import Link from 'next/link';

/* ── Types ── */

type AssetClassKey = 'STOCK_BR' | 'FII' | 'ETF' | 'BDR' | 'STOCK_US' | 'CRYPTO';
type PresetKey = 'dividends' | 'graham' | 'quality' | 'low-debt' | 'liquidity';
type SortKey = 'score' | 'dy' | 'roe' | 'liquidity' | 'change';

interface ScreenerItem {
  ticker: string;
  name: string;
  assetClass: string;
  totalScore: string;
  scoreLevel: string;
  fundamentals: {
    dy: string | null;
    pe: string | null;
    pb: string | null;
    roe: string | null;
    dailyLiquidity: string | null;
  };
  stale: boolean;
  asOf: string;
}

interface ScreenerResponse {
  items: ScreenerItem[];
  total: number;
  partial: boolean;
  failedTickers: string[];
  asOf: string;
}

/* ── Constants ── */

const ASSET_CLASSES: { label: string; key: AssetClassKey }[] = [
  { label: 'Ações', key: 'STOCK_BR' },
  { label: 'FIIs', key: 'FII' },
  { label: 'ETFs', key: 'ETF' },
  { label: 'BDRs', key: 'BDR' },
  { label: 'Stocks', key: 'STOCK_US' },
  { label: 'Cripto', key: 'CRYPTO' },
];

const PRESETS: { label: string; key: PresetKey }[] = [
  { label: 'Dividendos', key: 'dividends' },
  { label: 'Graham', key: 'graham' },
  { label: 'Qualidade', key: 'quality' },
  { label: 'Baixa dívida', key: 'low-debt' },
  { label: 'Liquidez', key: 'liquidity' },
];

const SORT_OPTIONS: { label: string; key: SortKey }[] = [
  { label: 'Score', key: 'score' },
  { label: 'DY', key: 'dy' },
  { label: 'ROE', key: 'roe' },
  { label: 'Liquidez', key: 'liquidity' },
];

/* ── Helpers ── */

function formatIndicator(value: string | null): string {
  if (value === null || value === '' || value === 'NaN') return '-';
  const num = Number(value);
  if (!Number.isFinite(num)) return '-';
  return value;
}

/* ── Component ── */

export default function FundamentalScreener() {
  const [activeClass, setActiveClass] = useState<AssetClassKey>('STOCK_BR');
  const [activePreset, setActivePreset] = useState<PresetKey | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('score');
  const [minDy, setMinDy] = useState('');
  const [maxPe, setMaxPe] = useState('');
  const [maxPb, setMaxPb] = useState('');
  const [minRoe, setMinRoe] = useState('');
  const [minLiquidity, setMinLiquidity] = useState('');
  const [data, setData] = useState<ScreenerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set('class', activeClass);
    if (activePreset) params.set('preset', activePreset);
    params.set('sort', sortBy);
    if (minDy) params.set('minDy', minDy);
    if (maxPe) params.set('maxPe', maxPe);
    if (maxPb) params.set('maxPb', maxPb);
    if (minRoe) params.set('minRoe', minRoe);
    if (minLiquidity) params.set('minLiquidity', minLiquidity);
    params.set('limit', '30');
    return params;
  }, [activeClass, activePreset, sortBy, minDy, maxPe, maxPb, minRoe, minLiquidity]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams();
      const res = await fetch(`/api/market/screener?${params.toString()}`);
      if (res.ok) {
        const json: ScreenerResponse = await res.json();
        setData(json);
      } else {
        const err = await res.json().catch(() => ({ message: 'Erro ao carregar dados.' }));
        setData(null);
        setError(err.message ?? 'Erro ao carregar dados.');
      }
    } catch {
      setData(null);
      setError('Erro de conexao. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handlePreset(preset: PresetKey) {
    setActivePreset(activePreset === preset ? null : preset);
  }

  function handleClassChange(cls: AssetClassKey) {
    setActiveClass(cls);
    setActivePreset(null);
    setMinDy('');
    setMaxPe('');
    setMaxPb('');
    setMinRoe('');
    setMinLiquidity('');
  }

  return (
    <div className="space-y-6">
      {/* Class segmented control */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory" role="tablist" aria-label="Classe de ativo">
        {ASSET_CLASSES.map((cls) => {
          const isActive = activeClass === cls.key;
          return (
            <button
              key={cls.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleClassChange(cls.key)}
              className={cn(
                'flex-shrink-0 snap-start rounded-full border px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
                isActive
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-surface text-on-surface-variant border-border/50 hover:border-border hover:text-on-surface',
              )}
            >
              {cls.label}
            </button>
          );
        })}
      </div>

      {/* Preset chips */}
      <div className="flex gap-2 flex-wrap">
        {PRESETS.map((preset) => {
          const isActive = activePreset === preset.key;
          return (
            <button
              key={preset.key}
              onClick={() => handlePreset(preset.key)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-secondary-container text-on-secondary-container border-secondary-container'
                  : 'bg-surface text-on-surface-variant border-border/50 hover:border-border hover:text-on-surface',
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-3 items-end">
        <FilterInput label="DY min" value={minDy} onChange={setMinDy} placeholder="0" />
        <FilterInput label="P/L max" value={maxPe} onChange={setMaxPe} placeholder="15" />
        <FilterInput label="P/VP max" value={maxPb} onChange={setMaxPb} placeholder="2.5" />
        <FilterInput label="ROE min" value={minRoe} onChange={setMinRoe} placeholder="10" />
        <FilterInput label="Liq. min" value={minLiquidity} onChange={setMinLiquidity} placeholder="1000000" />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary transition-colors"
          aria-label="Ordenar por"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-surface-muted animate-pulse" />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="rounded-lg border border-border bg-surface p-4 text-center">
          <p className="text-sm text-on-surface-variant">{error}</p>
        </div>
      )}

      {data && data.items.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-3">search_off</span>
          <p className="text-sm text-on-surface-variant">Nenhum ativo encontrado para estes filtros.</p>
        </div>
      )}

      {data && data.items.length > 0 && !loading && (
        <>
          {data.partial && (
            <div className="rounded-lg bg-stale-surface/20 border border-stale/30 px-4 py-2 text-sm text-stale">
              Alguns ativos nao puderam ser carregados. Exibindo resultados parciais.
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-xs text-on-surface-variant uppercase tracking-wide">
                  <th className="px-4 py-3 text-left font-medium">Ticker</th>
                  <th className="px-4 py-3 text-right font-medium">Score</th>
                  <th className="px-4 py-3 text-right font-medium">DY</th>
                  <th className="px-4 py-3 text-right font-medium">P/L</th>
                  <th className="px-4 py-3 text-right font-medium">P/VP</th>
                  <th className="px-4 py-3 text-right font-medium">ROE</th>
                  <th className="px-4 py-3 text-right font-medium">Liquidez</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 text-center font-medium">Acao</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => {
                  const scoreNum = Number(item.totalScore);
                  const scoreColor = scoreNum >= 70 ? 'text-profit' : scoreNum >= 45 ? 'text-neutralChange' : 'text-loss';

                  return (
                    <tr key={item.ticker} className="border-b border-border/50 last:border-b-0 hover:bg-surface-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-semibold text-on-surface">{item.ticker}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn('font-mono text-sm font-medium', scoreColor)}>{item.totalScore}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-on-surface tabular-nums">
                        {formatIndicator(item.fundamentals.dy)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-on-surface tabular-nums">
                        {formatIndicator(item.fundamentals.pe)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-on-surface tabular-nums">
                        {formatIndicator(item.fundamentals.pb)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-on-surface tabular-nums">
                        {formatIndicator(item.fundamentals.roe)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-on-surface tabular-nums">
                        {formatIndicator(item.fundamentals.dailyLiquidity)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.stale ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-stale">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            Stale
                          </span>
                        ) : (
                          <span className="text-xs text-on-surface-variant">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/ativos/${item.ticker}?class=${item.assetClass}`}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          Abrir analise
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-on-surface-variant text-center">
            Exibindo {data.items.length} de {data.total} ativo{data.total !== 1 ? 's' : ''}
            {data.failedTickers.length > 0 && ` (${data.failedTickers.length} falhas)`}
          </p>
        </>
      )}
    </div>
  );
}

/* ── Filter Input ── */

function FilterInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-on-surface-variant">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-24 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant outline-none focus:border-primary transition-colors font-mono"
      />
    </div>
  );
}
