'use client';

import { useState } from 'react';

interface FundamentalData {
  pl: number;
  pvp: number;
  dy: number;
  roe: number;
  margem: number;
  divida: number;
}

const MOCK_DATA: Record<string, FundamentalData> = {
  PETR4: { pl: 4.2, pvp: 1.8, dy: 16.4, roe: 22.1, margem: 18.5, divida: 0.45 },
  VALE3: { pl: 6.8, pvp: 2.1, dy: 8.2, roe: 31.4, margem: 24.2, divida: 0.32 },
  ITUB4: { pl: 8.1, pvp: 1.5, dy: 6.5, roe: 18.7, margem: 26.8, divida: 2.1 },
  BBAS3: { pl: 5.1, pvp: 1.2, dy: 9.5, roe: 20.3, margem: 24.1, divida: 3.8 },
  WEGE3: { pl: 32.4, pvp: 6.8, dy: 1.8, roe: 21.0, margem: 16.2, divida: 0.15 },
  ABEV3: { pl: 14.2, pvp: 2.8, dy: 5.2, roe: 19.8, margem: 22.4, divida: 0.28 },
};

interface RowDef {
  key: keyof FundamentalData;
  label: string;
  suffix: string;
  higherBetter: boolean | null;
}

const ROWS: RowDef[] = [
  { key: 'pl', label: 'P/L', suffix: '', higherBetter: false },
  { key: 'pvp', label: 'P/VP', suffix: '', higherBetter: false },
  { key: 'dy', label: 'DY', suffix: '%', higherBetter: true },
  { key: 'roe', label: 'ROE', suffix: '%', higherBetter: true },
  { key: 'margem', label: 'Margem Líquida', suffix: '%', higherBetter: true },
  { key: 'divida', label: 'Dívida Líquida/Patrimônio', suffix: '', higherBetter: false },
];

function formatValue(value: number, suffix: string): string {
  if (suffix === '%') return `${value.toFixed(1)}%`;
  return value.toFixed(value % 1 === 0 ? 1 : 2);
}

function isGood(value: number, higherBetter: boolean | null): boolean | null {
  if (higherBetter === null) return null;
  const threshold = 15;
  if (higherBetter) return value >= threshold;
  return value <= threshold;
}

export default function AssetComparator() {
  const [tickers, setTickers] = useState<string[]>(['', '', '', '']);
  const [compared, setCompared] = useState(false);

  function updateTicker(index: number, value: string) {
    const next = [...tickers];
    next[index] = value.toUpperCase();
    setTickers(next);
    setCompared(false);
  }

  function handleCompare() {
    setCompared(true);
  }

  const filledTickers = tickers.filter((t) => t.trim().length > 0);
  const validTickers = filledTickers.filter((t) => MOCK_DATA[t.toUpperCase()]);
  const canCompare = filledTickers.length >= 2;

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
              placeholder={
                ['ex: PETR4', 'ex: VALE3', 'ex: ITUB4', 'ex: BBAS3'][i]
              }
              className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-on-surface w-full font-mono placeholder:text-outline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleCompare}
        disabled={!canCompare}
        className="w-full bg-primary text-white font-medium py-2.5 rounded-lg text-sm hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-lg">compare_arrows</span>
        Comparar
      </button>

      {/* Not enough tickers hint */}
      {compared && !canCompare && (
        <div className="mt-6 flex items-center justify-center gap-2 py-8 text-on-surface-variant">
          <span className="material-symbols-outlined text-base">info</span>
          <p className="text-sm">Adicione ao menos 2 ativos para comparar</p>
        </div>
      )}

      {/* Results table */}
      {compared && canCompare && (
        <div className="mt-6 overflow-x-auto">
          {/* Ticker badges */}
          <div className="flex gap-3 mb-4">
            {validTickers.map((ticker) => (
              <span
                key={ticker}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-low border border-outline-variant px-3 py-1 text-xs font-semibold font-mono text-on-surface"
              >
                <span className="material-symbols-outlined text-sm text-primary">
                  candlestick_chart
                </span>
                {ticker.toUpperCase()}
              </span>
            ))}
            {validTickers.length < filledTickers.length && (
              <span className="inline-flex items-center rounded-full bg-loss-surface px-3 py-1 text-xs font-medium text-loss-content">
                {filledTickers
                  .filter((t) => !MOCK_DATA[t.toUpperCase()])
                  .join(', ')}{' '}
                não encontrado
              </span>
            )}
          </div>

          {validTickers.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-8 text-on-surface-variant">
              <span className="material-symbols-outlined text-base">search_off</span>
              <p className="text-sm">Nenhum ativo reconhecido. Verifique os tickers informados.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2.5 pr-4 text-xs text-on-surface-variant uppercase tracking-wider font-medium">
                    Indicador
                  </th>
                  {validTickers.map((ticker) => (
                    <th
                      key={ticker}
                      className="text-center py-2.5 px-3 text-xs text-on-surface-variant uppercase tracking-wider font-mono font-semibold"
                    >
                      {ticker}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => {
                  const values = validTickers.map(
                    (t) => MOCK_DATA[t.toUpperCase()]?.[row.key],
                  );
                  const best = row.higherBetter !== null
                    ? Math[row.higherBetter ? 'max' : 'min'](...values)
                    : null;

                  return (
                    <tr
                      key={row.key}
                      className="border-b border-border/50 last:border-b-0"
                    >
                      <td className="py-3 pr-4 text-on-surface-variant text-xs">
                        {row.label}
                      </td>
                      {validTickers.map((ticker) => {
                        const data = MOCK_DATA[ticker.toUpperCase()];
                        if (!data) return null;
                        const val = data[row.key];
                        const good = isGood(val, row.higherBetter);

                        let colorClass = 'text-on-surface';
                        if (good === true) colorClass = 'text-profit';
                        else if (good === false) colorClass = 'text-loss';

                        const isBest = best !== null && val === best;

                        return (
                          <td
                            key={ticker}
                            className={`py-3 px-3 text-center font-mono text-sm ${colorClass}`}
                          >
                            <span className={isBest && validTickers.length > 1 ? 'font-bold' : ''}>
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
