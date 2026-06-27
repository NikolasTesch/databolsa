'use client';

import { useState } from 'react';

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function GrahamAnalysis() {
  const [lpa, setLpa] = useState('');
  const [vpa, setVpa] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const lpaNum = parseFloat(lpa);
    const vpaNum = parseFloat(vpa);

    if (isNaN(lpaNum) || lpaNum <= 0) {
      setError('O LPA deve ser um valor positivo.');
      return;
    }

    if (isNaN(vpaNum) || vpaNum <= 0) {
      setError('O VPA deve ser um valor positivo.');
      return;
    }

    const grahamPrice = Math.sqrt(22.5 * lpaNum * vpaNum);
    setResult(grahamPrice);
  }

  const currentPriceNum = parseFloat(currentPrice);
  const hasCurrentPrice = !isNaN(currentPriceNum) && currentPriceNum > 0;

  function getVerdict(): { label: string; color: string } | null {
    if (result === null) return null;
    if (!hasCurrentPrice) return { label: 'Informe o preço atual', color: 'text-outline' };
    if (currentPriceNum < result) return { label: 'Subvalorizado', color: 'text-profit' };
    return { label: 'Supervalorizado', color: 'text-loss' };
  }

  const verdict = getVerdict();

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Title */}
      <div className="flex items-start gap-3 mb-4">
        <span className="material-symbols-outlined text-[28px] text-primary mt-0.5">
          monitoring
        </span>
        <div>
          <h3 className="text-base font-semibold text-on-surface">
            Fórmula de Graham
          </h3>
          <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
            Criada por Benjamin Graham, a fórmula calcula o preço-teto de uma
            ação com base no Lucro por Ação (LPA) e no Valor Patrimonial por
            Ação (VPA). O múltiplo 22,5 (15 × 1,5) representa o limite máximo de
            P/L e P/VP considerados por Graham.
          </p>
        </div>
      </div>

      {/* Formula card */}
      <div className="glass-panel rounded-lg p-4 mb-5">
        <p className="text-sm text-on-surface-variant font-sans mb-1">
          Fórmula:
        </p>
        <p className="text-base font-mono text-on-surface">
          preço_teto = √(22,5 × LPA × VPA)
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleCalculate} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="lpa"
              className="block text-xs text-on-surface-variant mb-1 font-medium"
            >
              LPA (Lucro por Ação)
            </label>
            <input
              id="lpa"
              type="number"
              step="any"
              value={lpa}
              onChange={(e) => setLpa(e.target.value)}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-on-surface w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="Ex.: 5,50"
            />
          </div>

          <div>
            <label
              htmlFor="vpa"
              className="block text-xs text-on-surface-variant mb-1 font-medium"
            >
              VPA (Valor Patrimonial por Ação)
            </label>
            <input
              id="vpa"
              type="number"
              step="any"
              value={vpa}
              onChange={(e) => setVpa(e.target.value)}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-on-surface w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="Ex.: 12,00"
            />
          </div>
        </div>

        <div className="sm:w-1/2">
          <label
            htmlFor="current-price"
            className="block text-xs text-on-surface-variant mb-1 font-medium"
          >
            Preço atual (opcional)
          </label>
          <input
            id="current-price"
            type="number"
            step="any"
            value={currentPrice}
            onChange={(e) => setCurrentPrice(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-on-surface w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            placeholder="Ex.: 45,00"
          />
        </div>

        {error && (
          <p className="text-sm text-loss font-medium" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity self-start"
        >
          Calcular
        </button>
      </form>

      {/* Result */}
      {result !== null && !error && (
        <div className="mt-5 space-y-3">
          <div className="rounded-lg bg-surface-muted border border-border/50 p-4">
            <p className="text-xs text-on-surface-variant font-sans mb-1">
              Preço-teto Graham
            </p>
            <p className="text-2xl font-bold text-primary font-mono">
              {formatBRL(result)}
            </p>
          </div>

          {verdict && (
            <div
              className={`rounded-lg border bg-surface-muted/50 px-4 py-3 border-border/30`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-on-surface-variant font-sans">
                  Margem de segurança:
                </span>
                <span
                  className={`text-sm font-semibold font-sans ${verdict.color}`}
                >
                  {verdict.label}
                </span>
              </div>
              {hasCurrentPrice && (
                <p className="text-xs text-on-surface-variant font-sans mt-1">
                  Preço atual:{' '}
                  <span className="font-mono">
                    {formatBRL(currentPriceNum)}
                  </span>
                  {' · '}Diferença:{' '}
                  <span className="font-mono">
                    {currentPriceNum < result ? '+' : ''}
                    {formatBRL(
                      ((result - currentPriceNum) / result) * 100,
                    ).replace(/[A-Z$]\s?/, '')}
                    %
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
