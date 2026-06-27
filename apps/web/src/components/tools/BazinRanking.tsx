'use client';

import { useState } from 'react';

interface StockData {
  ticker: string;
  name: string;
  dy12m: number; // em percentual (ex.: 16.4 = 16,4%)
  currentPrice: number;
}

const STOCKS: StockData[] = [
  { ticker: 'PETR4', name: 'Petrobras', dy12m: 16.4, currentPrice: 38.5 },
  { ticker: 'BBAS3', name: 'Banco do Brasil', dy12m: 9.5, currentPrice: 55.2 },
  { ticker: 'ITUB4', name: 'Itaú Unibanco', dy12m: 6.5, currentPrice: 33.8 },
  { ticker: 'EGIE3', name: 'Engie Brasil', dy12m: 8.2, currentPrice: 44.1 },
  { ticker: 'TAEE11', name: 'Taesa', dy12m: 10.1, currentPrice: 35.4 },
  { ticker: 'KLBN11', name: 'Klabin', dy12m: 7.5, currentPrice: 24.3 },
];

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value) + '%';
}

export default function BazinRanking() {
  const [desiredYield, setDesiredYield] = useState('6');
  const [calculated, setCalculated] = useState(false);

  const desiredNum = parseFloat(desiredYield);

  function getCeilingPrice(stock: StockData): number | null {
    if (isNaN(desiredNum) || desiredNum <= 0) return null;
    return stock.currentPrice * (stock.dy12m / desiredNum);
  }

  function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    if (isNaN(desiredNum) || desiredNum <= 0) return;
    setCalculated(true);
  }

  const isValid = !isNaN(desiredNum) && desiredNum > 0;

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Title */}
      <div className="flex items-start gap-3 mb-4">
        <span className="material-symbols-outlined text-[28px] text-primary mt-0.5">
          savings
        </span>
        <div>
          <h3 className="text-base font-semibold text-on-surface">
            Ranking Bazin
          </h3>
          <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
            Desenvolvida pelo economista francês Bazin, esta estratégia calcula o
            preço-teto de um ativo com base nos dividendos pagos. A premissa é
            que o investidor busca um rendimento mínimo (yield) sobre o capital
            investido.
          </p>
        </div>
      </div>

      {/* Formula card */}
      <div className="glass-panel rounded-lg p-4 mb-5">
        <p className="text-sm text-on-surface-variant font-sans mb-1">
          Fórmula:
        </p>
        <p className="text-base font-mono text-on-surface">
          Preço-Teto = (Dividendo Anual ÷ Rendimento Desejado) × 100
        </p>
      </div>

      {/* Desired yield input */}
      <form onSubmit={handleCalculate} className="mb-5">
        <div className="flex items-end gap-3">
          <div className="w-48">
            <label
              htmlFor="desired-yield"
              className="block text-xs text-on-surface-variant mb-1 font-medium"
            >
              Rendimento desejado ao ano (%)
            </label>
            <input
              id="desired-yield"
              type="number"
              step="0.1"
              min="0.1"
              value={desiredYield}
              onChange={(e) => {
                setDesiredYield(e.target.value);
                setCalculated(false);
              }}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-on-surface w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="6"
            />
          </div>
          <button
            type="submit"
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Calcular
          </button>
        </div>
        {!isValid && (
          <p className="text-sm text-loss font-medium mt-2" role="alert">
            Informe um rendimento desejado válido (maior que zero).
          </p>
        )}
      </form>

      {/* Table */}
      {calculated && isValid && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-on-surface-variant font-sans uppercase tracking-wide border-b border-border">
                <th className="text-left pb-2 pr-3 font-medium">Ativo</th>
                <th className="text-left pb-2 pr-3 font-medium">
                  Dividend Yield (12m)
                </th>
                <th className="text-left pb-2 pr-3 font-medium">
                  Preço Atual
                </th>
                <th className="text-left pb-2 pr-3 font-medium">
                  Preço-Teto Bazin
                </th>
                <th className="text-left pb-2 font-medium">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {STOCKS.map((stock) => {
                const ceiling = getCeilingPrice(stock);
                const isBelow = ceiling !== null && stock.currentPrice < ceiling;
                const isAbove = ceiling !== null && stock.currentPrice > ceiling;

                return (
                  <tr key={stock.ticker} className="hover:bg-surface-muted/40 transition-colors">
                    <td className="py-3 pr-3">
                      <span className="font-semibold text-on-surface font-sans">
                        {stock.ticker}
                      </span>
                      <span className="text-on-surface-variant text-xs ml-1.5 font-sans">
                        {stock.name}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="font-mono text-on-surface">
                        {formatPercent(stock.dy12m)}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="font-mono text-on-surface">
                        {formatBRL(stock.currentPrice)}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      {ceiling !== null ? (
                        <span className="font-mono text-primary font-semibold">
                          {formatBRL(ceiling)}
                        </span>
                      ) : (
                        <span className="text-on-surface-variant">—</span>
                      )}
                    </td>
                    <td className="py-3">
                      {isBelow && (
                        <span className="inline-flex items-center rounded-full bg-profit-surface/20 text-profit text-xs font-medium px-2.5 py-0.5 font-sans">
                          Abaixo do teto
                        </span>
                      )}
                      {isAbove && (
                        <span className="inline-flex items-center rounded-full bg-loss-surface/20 text-loss text-xs font-medium px-2.5 py-0.5 font-sans">
                          Acima do teto
                        </span>
                      )}
                      {ceiling !== null && !isBelow && !isAbove && (
                        <span className="text-on-surface-variant text-xs font-sans">
                          No teto
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!calculated && isValid && (
        <div className="rounded-lg bg-surface-muted border border-border/50 p-4 text-center">
          <p className="text-sm text-on-surface-variant font-sans">
            Ajuste o rendimento desejado e clique em <strong>Calcular</strong>{' '}
            para ver o ranking.
          </p>
        </div>
      )}
    </div>
  );
}
