'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Decimal } from 'decimal.js';
import { cn } from '@/components/ui/cn';
import type { AssetAnalysis } from '@/lib/analysis/asset-analysis.types';
import ComparatorPriceChart, { type PriceSeries } from './ComparatorPriceChart';
import ComparatorDividendsTable, { type DividendData } from './ComparatorDividendsTable';

/* ── Constants ── */

const MAX_TICKERS = 6;
const DEBOUNCE_MS = 300;
const DECIMAL_FIELDS = ['pe', 'pb', 'dy', 'roe', 'netMargin', 'debtToEquity'] as const;

interface RowDef {
  key: string;
  label: string;
  suffix: string;
  higherBetter: boolean | null;
}

const COMMON_ROWS: RowDef[] = [
  { key: 'score', label: 'Score', suffix: '', higherBetter: true },
  { key: 'pe', label: 'P/L', suffix: '', higherBetter: false },
  { key: 'pb', label: 'P/VP', suffix: '', higherBetter: false },
  { key: 'dy', label: 'DY', suffix: '%', higherBetter: true },
  { key: 'roe', label: 'ROE', suffix: '%', higherBetter: true },
  { key: 'netMargin', label: 'Margem', suffix: '%', higherBetter: true },
  { key: 'debtToEquity', label: 'Dívida/PL', suffix: '', higherBetter: false },
];

/* ── Helpers ── */

function formatValue(value: string | null, suffix: string): string {
  if (value === null || value === '' || value === 'NaN') return '—';
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  if (suffix === '%') return `${num.toFixed(1)}%`;
  return num.toFixed(num % 1 === 0 ? 1 : 2);
}

function parseNum(value: string | null): number | null {
  if (value === null || value === '') return null;
  const n = parseFloat(value);
  return isNaN(n) ? null : n;
}

/* ── Response type ── */

interface CompareResponse {
  items: AssetAnalysis[];
  failedTickers: string[];
  asOf: string;
}

interface HistoryResponse {
  ticker: string;
  range: string;
  series: Array<{ date: string; close: string }>;
}

/* ── Loading Skeleton ── */

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-10 w-48 rounded-lg bg-surface-muted animate-pulse" />
      <div className="h-64 rounded-lg bg-surface-muted animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-surface-muted animate-pulse" />
        ))}
      </div>
    </div>
  );
}

/* ── Component ── */

export default function AdvancedComparator() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [debouncedInput, setDebouncedInput] = useState('');
  const [data, setData] = useState<CompareResponse | null>(null);
  const [priceSeries, setPriceSeries] = useState<PriceSeries[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 300ms debounce on input
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedInput(input.trim().toUpperCase());
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input]);

  // Add ticker from debounced input
  useEffect(() => {
    if (!debouncedInput) return;
    if (tickers.length >= MAX_TICKERS) return;
    if (tickers.includes(debouncedInput)) {
      setInput('');
      return;
    }
    setTickers((prev) => [...prev, debouncedInput]);
    setInput('');
    setData(null);
    setPriceSeries([]);
  }, [debouncedInput, tickers]);

  function removeTicker(ticker: string) {
    setTickers((prev) => prev.filter((t) => t !== ticker));
    setData(null);
    setPriceSeries([]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && input.trim()) {
      const val = input.trim().toUpperCase();
      if (tickers.length < MAX_TICKERS && !tickers.includes(val)) {
        setTickers((prev) => [...prev, val]);
        setInput('');
        setData(null);
        setPriceSeries([]);
      }
    }
    if (e.key === 'Backspace' && !input && tickers.length > 0) {
      removeTicker(tickers[tickers.length - 1]);
    }
  }

  const fetchComparison = useCallback(async () => {
    if (tickers.length === 0) return;
    setLoading(true);
    setError(null);
    setData(null);
    setPriceSeries([]);

    try {
      // Fetch analysis data
      const params = new URLSearchParams({ tickers: tickers.join(',') });
      const res = await fetch(`/api/market/compare?${params.toString()}`);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ message: 'Erro ao carregar dados.' }));
        setError(errBody.message ?? 'Erro ao carregar dados.');
        setLoading(false);
        return;
      }
      const json: CompareResponse = await res.json();
      setData(json);

      // Fetch price history for each ticker
      const historyResults = await Promise.allSettled(
        tickers.map(async (ticker) => {
          const histRes = await fetch(`/api/market/${ticker}/history?range=1y`);
          if (!histRes.ok) return null;
          const histJson: HistoryResponse = await histRes.json();
          if (!histJson.series || histJson.series.length === 0) return null;
          return { ticker, series: histJson.series };
        }),
      );

      const series = historyResults.flatMap((r) =>
        r.status === 'fulfilled' && r.value !== null ? [r.value] : [],
      );
      setPriceSeries(series);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [tickers]);

  // Auto-fetch on mount (no)
  // Only fetch when button is clicked

  const validItems = data?.items ?? [];
  const failedTickers = data?.failedTickers ?? [];
  const indicatorData = validItems;

  // Build dividend data for table
  const dividendData: DividendData[] = validItems.map((item) => ({
    ticker: item.ticker,
    dy: item.fundamentals.dy,
    lastDividend: item.fundamentals.lastDividend,
    totalScore: item.totalScore,
    pe: item.fundamentals.pe,
    pb: item.fundamentals.pb,
    roe: item.fundamentals.roe,
    netMargin: item.fundamentals.netMargin,
    debtToEquity: item.fundamentals.debtToEquity,
  }));

  // Determine best/worst for each row
  function getBestWorst(rows: AssetAnalysis[], key: string, higherBetter: boolean | null): { best: number | null; worst: number | null } {
    if (key === 'score') {
      const scores = rows.map((r) => parseNum(r.totalScore));
      return {
        best: scores.reduce<number | null>((best, v) => {
          if (v === null) return best;
          if (best === null) return v;
          return higherBetter ? Math.max(best, v) : Math.min(best, v);
        }, null),
        worst: scores.reduce<number | null>((worst, v) => {
          if (v === null) return worst;
          if (worst === null) return v;
          return higherBetter ? Math.min(worst, v) : Math.max(worst, v);
        }, null),
      };
    }
    const values = rows.map((r) => {
      const f = r.fundamentals as unknown as Record<string, string | null>;
      return f[key] !== undefined ? parseNum(f[key]) : null;
    });
    return {
      best: values.reduce<number | null>((best, v) => {
        if (v === null) return best;
        if (best === null) return v;
        return higherBetter ? Math.max(best, v) : Math.min(best, v);
      }, null),
      worst: values.reduce<number | null>((worst, v) => {
        if (v === null) return worst;
        if (worst === null) return v;
        return higherBetter ? Math.min(worst, v) : Math.max(worst, v);
      }, null),
    };
  }

  function getScoreColor(score: string | null): string {
    const num = parseNum(score);
    if (num === null) return '';
    if (num >= 70) return 'text-profit';
    if (num >= 45) return 'text-neutralChange';
    return 'text-loss';
  }

  function getIndicatorColor(key: string, value: string | null): string {
    if (key === 'dy') {
      const num = parseNum(value);
      if (num === null) return 'text-on-surface';
      if (num >= 3 && num <= 12) return 'text-profit';
      if (num > 12) return 'text-attention';
      return 'text-on-surface';
    }
    return 'text-on-surface';
  }

  return (
    <div className="space-y-6">
      {/* Search input */}
      <div>
        <label htmlFor="ticker-search" className="block text-xs text-on-surface-variant mb-1.5 font-medium">
          Adicionar ativos (máx. {MAX_TICKERS})
        </label>
        <div className="flex flex-wrap gap-2 p-2.5 rounded-lg border border-border bg-surface min-h-[44px] items-center">
          {tickers.map((ticker) => (
            <span
              key={ticker}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/30 px-3 py-1 text-xs font-mono font-semibold text-primary"
            >
              {ticker}
              <button
                type="button"
                onClick={() => removeTicker(ticker)}
                className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-primary/20 transition-colors"
                aria-label={`Remover ${ticker}`}
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </span>
          ))}
          {tickers.length < MAX_TICKERS && (
            <input
              id="ticker-search"
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={tickers.length === 0 ? 'Digite um ticker e pressione Enter...' : 'Adicionar mais...'}
              className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm text-on-surface placeholder:text-outline font-mono"
              disabled={loading}
            />
          )}
        </div>
        {tickers.length >= MAX_TICKERS && (
          <p className="text-xs text-on-surface-variant mt-1">Máximo de {MAX_TICKERS} ativos atingido.</p>
        )}
      </div>

      {/* Compare button */}
      <button
        type="button"
        onClick={fetchComparison}
        disabled={tickers.length < 2 || loading}
        className={cn(
          'w-full rounded-lg py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2',
          tickers.length >= 2 && !loading
            ? 'bg-primary text-white hover:bg-primary-hover'
            : 'bg-surface-muted text-on-surface-variant cursor-not-allowed',
        )}
      >
        <span className="material-symbols-outlined text-lg">compare_arrows</span>
        {loading ? 'Comparando...' : 'Comparar'}
      </button>

      {/* Error state */}
      {error && !loading && (
        <div className="rounded-lg border border-border bg-surface p-4 text-center">
          <p className="text-sm text-on-surface-variant">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && <LoadingSkeleton />}

      {/* Results */}
      {!loading && validItems.length > 0 && (
        <div className="space-y-8">
          {/* Failed tickers notice */}
          {failedTickers.length > 0 && (
            <div className="rounded-lg bg-stale-surface/20 border border-stale/30 px-4 py-2 text-sm text-stale">
              Não foi possível carregar dados para: {failedTickers.join(', ')}.
            </div>
          )}

          {/* Comparison grid */}
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full border-collapse text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-border bg-surface-muted">
                  <th className="px-4 py-3 text-left text-xs text-on-surface-variant uppercase tracking-wide font-medium">
                    Indicador
                  </th>
                  {validItems.map((item) => (
                    <th
                      key={item.ticker}
                      className="px-4 py-3 text-center text-xs text-on-surface-variant uppercase tracking-wide font-mono font-semibold"
                    >
                      {item.ticker}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMMON_ROWS.map((row) => {
                  const { best, worst } = getBestWorst(validItems, row.key, row.higherBetter);

                  return (
                    <tr key={row.key} className="border-b border-border/50 last:border-b-0 hover:bg-surface-muted/30 transition-colors">
                      <td className="px-4 py-3 text-xs text-on-surface-variant font-medium">
                        {row.label}
                      </td>
                      {validItems.map((item) => {
                        let val: string | null;
                        if (row.key === 'score') {
                          val = item.totalScore;
                        } else {
                          const f = item.fundamentals as unknown as Record<string, string | null>;
                          val = f[row.key] ?? null;
                        }
                        const num = parseNum(val);
                        const isBest = num !== null && best !== null && num === best && best !== worst;
                        const isWorst = num !== null && worst !== null && num === worst && best !== worst;

                        return (
                          <td
                            key={item.ticker}
                            className={cn(
                              'px-4 py-3 text-center font-mono text-sm tabular-nums',
                              row.key === 'score' ? getScoreColor(val) : getIndicatorColor(row.key, val),
                            )}
                          >
                            <span
                              className={cn(
                                isBest && validItems.length > 1 ? 'ring-1 ring-profit/40 bg-profit/10 rounded px-1.5 py-0.5' : '',
                                isWorst && validItems.length > 1 ? 'ring-1 ring-loss/40 bg-loss/10 rounded px-1.5 py-0.5' : '',
                              )}
                            >
                              {formatValue(val, row.suffix)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Price chart */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-on-surface mb-4">
              Histórico de Preços Normalizado (Base 100)
            </h3>
            <ComparatorPriceChart series={priceSeries} />
          </div>

          {/* Dividends table */}
          <ComparatorDividendsTable data={dividendData} />
        </div>
      )}

      {/* Empty state */}
      {!loading && tickers.length === 0 && !data && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-3">compare_arrows</span>
          <p className="text-sm text-on-surface-variant">
            Adicione ao menos 2 ativos para iniciar a comparação.
          </p>
        </div>
      )}

      {/* Insufficient tickers after previous comparison */}
      {!loading && tickers.length > 0 && tickers.length < 2 && !data && !error && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">info</span>
          <p className="text-sm text-on-surface-variant">
            Adicione ao menos mais {2 - tickers.length} ativo{tickers.length === 0 ? '' : 's'} para comparar.
          </p>
        </div>
      )}
    </div>
  );
}
