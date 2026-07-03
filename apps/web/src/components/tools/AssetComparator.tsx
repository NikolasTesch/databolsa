'use client';

import { useState, useCallback, useMemo, Fragment } from 'react';
import type { NormalizedFundamentals } from '@/lib/fundamentals/fundamentals-adapter.interface';
import { Tooltip } from '@/components/ui/Tooltip';

interface TickerResult {
  ticker: string;
  indicators: NormalizedFundamentals | null;
  error?: string;
}

interface RowDef {
  key: keyof NormalizedFundamentals;
  label: string;
  format?: 'number' | 'percent' | 'money' | 'integer';
  higherBetter: boolean | null;
  description: string;
}

interface CategoryDef {
  title: string;
  icon: string;
  indicators: RowDef[];
}

const CATEGORIES: CategoryDef[] = [
  {
    title: 'Valuation',
    icon: 'monitoring',
    indicators: [
      { key: 'pe', label: 'P/L (Preço/Lucro)', higherBetter: false, description: 'Preço atual dividido pelo lucro por ativo. Representa o tempo (em anos) para reaver o capital investido via lucros.' },
      { key: 'pb', label: 'P/VP (Preço/Valor Patrimonial)', higherBetter: false, description: 'Preço atual dividido pelo valor patrimonial por ativo. Indica se o ativo está caro ou barato frente ao seu patrimônio líquido.' },
      { key: 'evEbitda', label: 'EV/EBITDA', higherBetter: false, description: 'Enterprise Value dividido pelo EBITDA. Avalia o valor da empresa sobre o seu potencial de geração de caixa operacional.' },
    ],
  },
  {
    title: 'Rentabilidade',
    icon: 'trending_up',
    indicators: [
      { key: 'dy', label: 'Dividend Yield', format: 'percent', higherBetter: true, description: 'Rendimento percentual distribuído em proventos no acumulado dos últimos 12 meses.' },
      { key: 'roe', label: 'ROE (Retorno sobre PL)', format: 'percent', higherBetter: true, description: 'Lucro líquido dividido pelo patrimônio líquido. Mede a eficiência operacional na rentabilização do capital próprio.' },
      { key: 'netMargin', label: 'Margem Líquida', format: 'percent', higherBetter: true, description: 'Percentual de lucro que resta de cada unidade de receita após deduzidos todos os custos e tributos.' },
      { key: 'eps', label: 'LPA (Lucro por Ação)', format: 'money', higherBetter: true, description: 'Lucro líquido distribuível dividido pelo número total de ações/cotas.' },
    ],
  },
  {
    title: 'Porte & Estrutura',
    icon: 'shield',
    indicators: [
      { key: 'debtToEquity', label: 'Dívida Líquida/Patrimônio', higherBetter: false, description: 'Relação entre as obrigações líquidas e o patrimônio líquido. Mede a alavancagem financeira.' },
      { key: 'marketCap', label: 'Valor de Mercado', format: 'money', higherBetter: true, description: 'Valor total do ativo calculado pela multiplicação de sua quantidade total pelo preço corrente.' },
    ],
  },
  {
    title: 'Fundos Imobiliários (FIIs)',
    icon: 'domain',
    indicators: [
      { key: 'vacancyRate', label: 'Taxa de Vacância', format: 'percent', higherBetter: false, description: 'Percentual de área física desocupada do portfólio de imóveis do fundo.' },
      { key: 'lastDividend', label: 'Último Rendimento', format: 'money', higherBetter: true, description: 'Valor distribuído por cota referente ao fechamento do último período apurado.' },
      { key: 'netWorth', label: 'Patrimônio Líquido', format: 'money', higherBetter: true, description: 'Valor contábil total de todos os bens e investimentos que compõem o patrimônio do fundo.' },
      { key: 'dailyLiquidity', label: 'Liquidez Diária Média', format: 'money', higherBetter: true, description: 'Média diária negociada das cotas, representando a facilidade de compra/venda do ativo.' },
      { key: 'adminFee', label: 'Taxa de Administração', format: 'percent', higherBetter: false, description: 'Taxa cobrada para o custeio operacional e gestão fiduciária do fundo.' },
    ],
  },
  {
    title: 'Criptoativos',
    icon: 'currency_bitcoin',
    indicators: [
      { key: 'volume24h', label: 'Volume 24h', format: 'money', higherBetter: true, description: 'Volume total de capitais transacionados nas últimas 24 horas.' },
      { key: 'circulatingSupply', label: 'Supply Circulante', format: 'integer', higherBetter: true, description: 'Quantidade de moedas ou tokens atualmente em circulação ativa no mercado.' },
      { key: 'maxSupply', label: 'Supply Máximo', format: 'integer', higherBetter: true, description: 'Quantidade máxima pré-estabelecida de moedas ou tokens que podem ser emitidos.' },
      { key: 'change7d', label: 'Variação (7 dias)', format: 'percent', higherBetter: true, description: 'Variação percentual acumulada de preço nos últimos 7 dias.' },
      { key: 'change30d', label: 'Variação (30 dias)', format: 'percent', higherBetter: true, description: 'Variação percentual acumulada de preço nos últimos 30 dias.' },
    ],
  },
  {
    title: 'Performance',
    icon: 'show_chart',
    indicators: [
      { key: 'change52w', label: 'Variação (52 semanas)', format: 'percent', higherBetter: true, description: 'Variação de preço percentual acumulada nas últimas 52 semanas.' },
    ],
  },
];

function parseNum(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === '' || value === 'NaN') return null;
  const n = parseFloat(value);
  return isNaN(n) ? null : n;
}

function formatValue(value: string | null | undefined, format?: 'number' | 'percent' | 'money' | 'integer'): string {
  const num = parseNum(value);
  if (num === null) return '—';

  if (format === 'money' && num >= 1e6) {
    if (num >= 1e12) return `R$ ${(num / 1e12).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} Tri`;
    if (num >= 1e9) return `R$ ${(num / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} Bi`;
    return `R$ ${(num / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} Mi`;
  }
  if (format === 'integer') {
    if (num >= 1e12) return `${(num / 1e12).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} Tri`;
    if (num >= 1e9) return `${(num / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} Bi`;
    if (num >= 1e6) return `${(num / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} Mi`;
    return num.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  }

  if (format === 'percent') return `${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  if (format === 'money') return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AssetComparator() {
  const [tickers, setTickers] = useState<string[]>(['', '', '', '']);
  const [results, setResults] = useState<TickerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [compared, setCompared] = useState(false);

  const updateTicker = (index: number, value: string) => {
    const next = [...tickers];
    next[index] = value.toUpperCase();
    setTickers(next);
    setCompared(false);
    setResults([]);
  };

  const handleClear = () => {
    setTickers(['', '', '', '']);
    setResults([]);
    setCompared(false);
  };

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
  const validResults = useMemo(() => results.filter((r) => r.indicators !== null), [results]);

  const visibleCategories = useMemo(() => {
    return CATEGORIES.filter((cat) =>
      cat.indicators.some((ind) =>
        validResults.some((r) => {
          const val = r.indicators?.[ind.key] ?? null;
          return val !== null && val !== '' && val !== 'NaN';
        }),
      ),
    );
  }, [validResults]);

  const scores = useMemo(() => {
    const s: Record<string, number> = {};
    validResults.forEach((r) => {
      s[r.ticker] = 0;
    });

    if (validResults.length < 2) return s;

    visibleCategories.forEach((cat) => {
      cat.indicators.forEach((row) => {
        const parsedValues = validResults.map((r) => parseNum(r.indicators?.[row.key]));
        
        let bestVal: number | null = null;
        parsedValues.forEach((n) => {
          if (n === null) return;
          if (bestVal === null) {
            bestVal = n;
          } else {
            bestVal = row.higherBetter ? Math.max(bestVal, n) : Math.min(bestVal, n);
          }
        });

        if (bestVal !== null) {
          validResults.forEach((r) => {
            const num = parseNum(r.indicators?.[row.key]);
            if (num !== null && num === bestVal) {
              s[r.ticker] = (s[r.ticker] || 0) + 1;
            }
          });
        }
      });
    });

    return s;
  }, [validResults, visibleCategories]);

  const winnerTicker = useMemo(() => {
    if (validResults.length < 2) return null;
    let max = -1;
    let winner: string | null = null;
    let tie = false;

    Object.entries(scores).forEach(([ticker, score]) => {
      if (score > max) {
        max = score;
        winner = ticker;
        tie = false;
      } else if (score === max) {
        tie = true;
      }
    });

    return tie ? null : winner;
  }, [scores, validResults]);

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[28px] text-primary">
            compare_arrows
          </span>
          <h2 className="text-lg font-semibold text-on-surface">Comparador de Ativos</h2>
        </div>
        {compared && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs font-medium text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-muted/40 hover:bg-surface-muted transition-colors"
          >
            <span className="material-symbols-outlined text-sm">clear_all</span>
            Limpar
          </button>
        )}
      </div>

      <div className="glass-panel rounded-lg p-4 mb-6">
        <p className="text-sm text-on-surface-variant leading-relaxed">
          Compare múltiplos ativos fundamentalistas lado a lado. A ferramenta oculta automaticamente seções
          sem dados para as classes pesquisadas e elege o líder comparativo com base no melhor desempenho de cada indicador.
        </p>
      </div>

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
              placeholder={['ex: PETR4', 'ex: VALE3', 'ex: MXRF11', 'ex: BTC'][i]}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-on-surface w-full font-mono placeholder:text-outline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleCompare}
          disabled={!canCompare || loading}
          className="flex-1 bg-primary text-white font-medium py-2.5 rounded-lg text-sm hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">compare_arrows</span>
          {loading ? 'Buscando dados...' : 'Comparar Ativos'}
        </button>
      </div>

      {compared && !canCompare && !loading && (
        <div className="mt-6 flex items-center justify-center gap-2 py-8 text-on-surface-variant">
          <span className="material-symbols-outlined text-base">info</span>
          <p className="text-sm">Adicione ao menos 2 ativos para comparar</p>
        </div>
      )}

      {compared && validResults.length >= 2 && !loading && (
        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-3">
            Desempenho Geral
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {validResults.map((r) => {
              const score = scores[r.ticker] || 0;
              const isWinner = winnerTicker === r.ticker;
              return (
                <div
                  key={r.ticker}
                  className={`p-4 rounded-xl border bg-surface transition-all duration-300 ${
                    isWinner
                      ? 'border-amber-500/40 bg-amber-500/5 shadow-sm'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-sm font-bold text-on-surface">
                      {r.ticker}
                    </span>
                    {isWinner && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500 border border-amber-500/20">
                        LÍDER
                      </span>
                    )}
                  </div>
                  <div className="text-xl font-mono font-bold text-on-surface">
                    {score} <span className="text-xs font-sans font-normal text-on-surface-variant">pontos</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {compared && canCompare && !loading && results.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          {results.some((r) => r.error) && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {results.filter((r) => r.error).map((r) => (
                <span
                  key={r.ticker}
                  className="inline-flex items-center rounded-full bg-danger/10 border border-danger/20 px-3 py-1 text-xs font-medium text-danger"
                >
                  {r.ticker}: {r.error}
                </span>
              ))}
            </div>
          )}

          {validResults.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-8 text-on-surface-variant">
              <span className="material-symbols-outlined text-base">search_off</span>
              <p className="text-sm">Nenhum indicador encontrado para os tickers informados.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 pr-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Indicador
                  </th>
                  {validResults.map((r) => (
                    <th
                      key={r.ticker}
                      className="text-center py-3 px-4 font-mono font-bold text-on-surface uppercase tracking-wider"
                    >
                      {r.ticker}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleCategories.map((cat) => (
                  <Fragment key={cat.title}>
                    <tr className="bg-surface-muted/30">
                      <td
                        colSpan={validResults.length + 1}
                        className="py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-primary border-y border-border"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                          {cat.title}
                        </div>
                      </td>
                    </tr>
                    {cat.indicators.map((row) => {
                      const parsedValues = validResults.map((r) => parseNum(r.indicators?.[row.key]));
                      
                      let bestVal: number | null = null;
                      parsedValues.forEach((n) => {
                        if (n === null) return;
                        if (bestVal === null) {
                          bestVal = n;
                        } else {
                          bestVal = row.higherBetter ? Math.max(bestVal, n) : Math.min(bestVal, n);
                        }
                      });

                      return (
                        <tr key={row.key} className="border-b border-border/50 last:border-b-0 hover:bg-surface-muted/20 transition-colors">
                          <td className="py-3 px-4 text-xs text-on-surface-variant">
                            <Tooltip content={row.description}>
                              <span className="flex items-center gap-1.5 cursor-help hover:text-on-surface transition-colors select-none">
                                {row.label}
                                <span className="material-symbols-outlined text-[14px] text-on-surface-variant/40">
                                  info
                                </span>
                              </span>
                            </Tooltip>
                          </td>
                          {validResults.map((r) => {
                            const val = r.indicators?.[row.key] ?? null;
                            const num = parseNum(val);
                            const isBest = bestVal !== null && num !== null && num === bestVal;

                            return (
                              <td
                                key={r.ticker}
                                className="py-3 px-4 text-center"
                              >
                                <span
                                  className={
                                    isBest && validResults.length > 1
                                      ? 'bg-success/10 text-profit font-semibold px-2 py-0.5 rounded border border-success/20 inline-block text-xs font-mono'
                                      : 'text-on-surface font-mono text-sm'
                                  }
                                >
                                  {formatValue(val, row.format)}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
