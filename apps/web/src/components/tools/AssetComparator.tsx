'use client';

import { useState, useCallback } from 'react';
import type { NormalizedFundamentals } from '@/lib/fundamentals/fundamentals-adapter.interface';

interface TickerResult {
  ticker: string;
  indicators: NormalizedFundamentals | null;
  error?: string;
}

interface RowDef {
  key: keyof Pick<NormalizedFundamentals, 'pe' | 'pb' | 'dy' | 'roe' | 'netMargin' | 'debtToEquity'>;
  label: string;
  suffix: string;
  higherBetter: boolean | null;
}

const ROWS: RowDef[] = [
  { key: 'pe', label: 'P/L', suffix: '', higherBetter: false },
  { key: 'pb', label: 'P/VP', suffix: '', higherBetter: false },
  { key: 'dy', label: 'DY', suffix: '%', higherBetter: true },
  { key: 'roe', label: 'ROE', suffix: '%', higherBetter: true },
  { key: 'netMargin', label: 'Margem Líquida', suffix: '%', higherBetter: true },
  { key: 'debtToEquity', label: 'Dívida Líq./Patrimônio', suffix: '', higherBetter: false },
];

function parseNum(value: string | null): number | null {
  if (value === null || value === '') return null;
  const n = parseFloat(value);
  return isNaN(n) ? null : n;
}

function formatValue(value: string | null, suffix: string): string {
  const num = parseNum(value);
  if (num === null) return '—';
  if (suffix === '%') return `${num.toFixed(1)}%`;
  return num.toFixed(num % 1 === 0 ? 1 : 2);
}

function getGoodColor(value: string | null, higherBetter: boolean | null): string {
  const num = parseNum(value);
  if (num === null || higherBetter === null) return 'text-on-surface';
  const threshold = 15;
  const isGood = higherBetter ? num >= threshold : num <= threshold;
  if (isGood) return 'text-profit';
  return 'text-loss';
}

export default function AssetComparator() {
  const [tickers, setTickers] = useState<string[]>(['', '', '', '']);
  const [results, setResults] = useState<TickerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [compared, setCompared] = useState(false);

  function updateTicker(index: number, value: string) {
    const next = [...tickers];
    next[index] = value.toUpperCase();
    setTickers(next);
    setCompared(false);
    setResults([]);
  }

  const handleCompare = useCallback(async () => {
    const filled = tickers.filter((t) => t.trim().length > 0);
    if (filled.length < 2) return;

    setLoading(true);
    setCompared(true);

    const fetched = await Promise.all(
      filled.map(async (ticker) => {
        try {
          const res = await fetch(`/api/market/${ticker}/fundamentals`);
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            return { ticker, indicators: null, error: body.message ?? 'Não encontrado' };
          }
          const data = await res.json();
          return { ticker: data.ticker, indicators: data.indicators as NormalizedFundamentals };
        } catch {
          return { ticker, indicators: null, error: 'Erro ao buscar' };
        }
      }),
    );

    setResults(fetched);
    setLoading(false);
  }, [tickers]);

  const filledTickers = tickers.filter((t) => t.trim().length > 0);
  const canCompare = filledTickers.length >= 2;
  const validResults = results.filter((r) => r.indicators !== null);

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="material-symbols-outlined text-[28px] text-primary">
          compare_arrows
        </span>
        <h2 className="text-lg font-semibold text-on-surface">Comparador de Ativos</h2>
      </div>

      {/* Explanation */}
      <div className="glass-panel rounded-lg p-4 mb-6">
        <p className="text-sm text-on-surface-variant leading-relaxed">
          Compare indicadores fundamentalistas de até 4 ativos lado a lado para
          tomar decisões mais informadas.
        </p>
      </div>

      {/* Ticker inputs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {tickers.map((ticker, i) => (
          <div key={i}>
            <label className="block text-xs text-on-surface-variant mb-1 font-medium">
              Ativo {i + 1}
            </label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => updateTicker(i, e.target.value)}
              placeholder={['ex: PETR4', 'ex: VALE3', 'ex: ITUB4', 'ex: BBAS3'][i]}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-on-surface w-full font-mono placeholder:text-outline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleCompare}
        disabled={!canCompare || loading}
        className="w-full bg-primary text-white font-medium py-2.5 rounded-lg text-sm hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-lg">compare_arrows</span>
        {loading ? 'Buscando dados...' : 'Comparar'}
      </button>

      {/* Not enough tickers hint */}
      {compared && !canCompare && !loading && (
        <div className="mt-6 flex items-center justify-center gap-2 py-8 text-on-surface-variant">
          <span className="material-symbols-outlined text-base">info</span>
          <p className="text-sm">Adicione ao menos 2 ativos para comparar</p>
        </div>
      )}

      {/* Results table */}
      {compared && canCompare && !loading && results.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          {/* Ticker badges */}
          <div className="flex gap-3 mb-4 flex-wrap">
            {validResults.map((r) => (
              <span
                key={r.ticker}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-low border border-outline-variant px-3 py-1 text-xs font-semibold font-mono text-on-surface"
              >
                <span className="material-symbols-outlined text-sm text-primary">
                  candlestick_chart
                </span>
                {r.ticker}
              </span>
            ))}
            {results.filter((r) => r.error).map((r) => (
              <span
                key={r.ticker}
                className="inline-flex items-center rounded-full bg-loss-surface px-3 py-1 text-xs font-medium text-loss-content"
              >
                {r.ticker}: {r.error}
              </span>
            ))}
          </div>

          {validResults.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-8 text-on-surface-variant">
              <span className="material-symbols-outlined text-base">search_off</span>
              <p className="text-sm">Nenhum indicador encontrado para os tickers informados.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2.5 pr-4 text-xs text-on-surface-variant uppercase tracking-wider font-medium">
                    Indicador
                  </th>
                  {validResults.map((r) => (
                    <th
                      key={r.ticker}
                      className="text-center py-2.5 px-3 text-xs text-on-surface-variant uppercase tracking-wider font-mono font-semibold"
                    >
                      {r.ticker}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => {
                  const values = validResults.map((r) => r.indicators?.[row.key] ?? null);
                  const bestVal = row.higherBetter !== null
                    ? values.reduce<number | null>((best, v) => {
                        const n = parseNum(v);
                        if (n === null) return best;
                        if (best === null) return n;
                        return row.higherBetter ? Math.max(best, n) : Math.min(best, n);
                      }, null)
                    : null;

                  return (
                    <tr key={row.key} className="border-b border-border/50 last:border-b-0">
                      <td className="py-3 pr-4 text-on-surface-variant text-xs">
                        {row.label}
                      </td>
                      {validResults.map((r) => {
                        const val = r.indicators?.[row.key] ?? null;
                        const num = parseNum(val);
                        const isBest = bestVal !== null && num !== null && num === bestVal;

                        return (
                          <td
                            key={r.ticker}
                            className={`py-3 px-3 text-center font-mono text-sm ${getGoodColor(val, row.higherBetter)}`}
                          >
                            <span className={isBest && validResults.length > 1 ? 'font-bold' : ''}>
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
          )}
        </div>
      )}
    </div>
  );
}
