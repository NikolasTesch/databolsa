'use client';

import { useState } from 'react';

type OperationType = 'SWING' | 'DAY_TRADE';

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function parseBRLInput(raw: string): number {
  const cleaned = raw.replace(/[R$\s.]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

interface TaxResult {
  profit: number;
  taxRate: number | null;
  taxDue: number;
  isExempt: boolean;
}

export default function IRCalculator() {
  const [operationType, setOperationType] = useState<OperationType>('SWING');
  const [saleValueRaw, setSaleValueRaw] = useState('');
  const [purchaseCostRaw, setPurchaseCostRaw] = useState('');
  const [monthlySalesRaw, setMonthlySalesRaw] = useState('');
  const [result, setResult] = useState<TaxResult | null>(null);
  const [calculated, setCalculated] = useState(false);

  function handleCalculate() {
    const sale = parseBRLInput(saleValueRaw);
    const cost = parseBRLInput(purchaseCostRaw);
    const monthly = parseBRLInput(monthlySalesRaw);
    const profit = sale - cost;

    if (sale <= 0 || cost <= 0) {
      return;
    }

    let taxRate: number | null;
    let taxDue: number;
    let isExempt = false;

    if (operationType === 'SWING' && monthly <= 20000) {
      isExempt = true;
      taxRate = null;
      taxDue = 0;
    } else if (profit <= 0) {
      taxRate = operationType === 'SWING' ? 15 : 20;
      taxDue = 0;
    } else if (operationType === 'SWING') {
      taxRate = 15;
      taxDue = profit * 0.15;
    } else {
      taxRate = 20;
      taxDue = profit * 0.2;
    }

    setResult({ profit, taxRate, taxDue, isExempt });
    setCalculated(true);
  }

  function formatTaxRate(rate: number | null): string {
    if (rate === null) return '—';
    return `${rate}%`;
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="material-symbols-outlined text-[28px] text-primary">
          balance
        </span>
        <h2 className="text-lg font-semibold text-on-surface">Calculadora de IR</h2>
      </div>

      {/* Explanation */}
      <div className="glass-panel rounded-lg p-4 mb-6">
        <p className="text-sm text-on-surface-variant leading-relaxed">
          Calcule o Imposto de Renda devido sobre operações na bolsa brasileira.
          Para ações, vendas mensais até R$ 20 mil são isentas. Alíquotas: 15%
          (swing trade), 20% (day trade).
        </p>
      </div>

      {/* Operation type toggle */}
      <div className="mb-6">
        <label className="block text-xs text-on-surface-variant mb-2 font-medium">
          Tipo de Operação
        </label>
        <div className="flex rounded-lg overflow-hidden border border-outline-variant w-fit">
          <button
            type="button"
            onClick={() => {
              setOperationType('SWING');
              setCalculated(false);
            }}
            className={`px-5 py-2 text-sm font-medium transition-colors ${
              operationType === 'SWING'
                ? 'bg-primary text-white'
                : 'bg-surface-container-low text-on-surface-variant'
            }`}
          >
            Swing Trade
          </button>
          <button
            type="button"
            onClick={() => {
              setOperationType('DAY_TRADE');
              setCalculated(false);
            }}
            className={`px-5 py-2 text-sm font-medium transition-colors ${
              operationType === 'DAY_TRADE'
                ? 'bg-primary text-white'
                : 'bg-surface-container-low text-on-surface-variant'
            }`}
          >
            Day Trade
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-xs text-on-surface-variant mb-1 font-medium">
            Valor da Venda
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={saleValueRaw}
            onChange={(e) => setSaleValueRaw(e.target.value)}
            placeholder="R$ 0,00"
            className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-on-surface w-full font-mono placeholder:text-outline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs text-on-surface-variant mb-1 font-medium">
            Custo de Aquisição
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={purchaseCostRaw}
            onChange={(e) => setPurchaseCostRaw(e.target.value)}
            placeholder="R$ 0,00"
            className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-on-surface w-full font-mono placeholder:text-outline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs text-on-surface-variant mb-1 font-medium">
            Total de Vendas no Mês
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={monthlySalesRaw}
            onChange={(e) => setMonthlySalesRaw(e.target.value)}
            placeholder="R$ 0,00"
            className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-on-surface w-full font-mono placeholder:text-outline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleCalculate}
        className="w-full bg-primary text-white font-medium py-2.5 rounded-lg text-sm hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-lg">calculate</span>
        Calcular
      </button>

      {/* Results */}
      {calculated && result && (
        <div className="mt-6 rounded-lg border border-border bg-surface-muted p-5">
          <h3 className="text-sm font-semibold text-on-surface mb-4">
            Resultado da Apuração
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Lucro / Prejuízo */}
            <div>
              <span className="text-xs text-on-surface-variant font-medium">
                Lucro / Prejuízo
              </span>
              <p
                className={`font-mono text-lg mt-1 ${
                  result.profit >= 0 ? 'text-profit' : 'text-loss'
                }`}
              >
                {result.profit >= 0 ? '+' : ''}
                {formatBRL(result.profit)}
              </p>
            </div>

            {/* Alíquota */}
            <div>
              <span className="text-xs text-on-surface-variant font-medium">
                Alíquota Aplicada
              </span>
              <p className="font-mono text-lg mt-1 text-on-surface">
                {result.isExempt ? (
                  <span className="inline-flex items-center gap-1 text-profit">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Isento
                  </span>
                ) : (
                  formatTaxRate(result.taxRate)
                )}
              </p>
            </div>

            {/* IR Devido */}
            <div>
              <span className="text-xs text-on-surface-variant font-medium">
                IR Devido
              </span>
              <p
                className={`font-mono text-xl font-bold mt-1 ${
                  result.isExempt || result.taxDue === 0
                    ? 'text-profit'
                    : 'text-primary'
                }`}
              >
                {result.isExempt || result.taxDue === 0
                  ? 'R$ 0,00'
                  : formatBRL(result.taxDue)}
              </p>
            </div>
          </div>

          {result.isExempt && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-profit-surface/50 p-3">
              <span className="material-symbols-outlined text-profit text-base mt-0.5">info</span>
              <p className="text-xs text-profit-content leading-relaxed">
                Vendas no mês abaixo de R$ 20.000,00. Operação isenta de IR para
                ações (Swing Trade).
              </p>
            </div>
          )}

          {result.profit < 0 && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-loss-surface/50 p-3">
              <span className="material-symbols-outlined text-loss text-base mt-0.5">info</span>
              <p className="text-xs text-loss-content leading-relaxed">
                Operação com prejuízo. Nenhum IR devido. Prejuízos podem ser
                compensados com lucros futuros.
              </p>
            </div>
          )}

          {result.taxDue > 0 && !result.isExempt && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-surface-container-low p-3">
              <span className="material-symbols-outlined text-primary text-base mt-0.5">receipt_long</span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                O DARF deve ser pago até o último dia útil do mês subsequente
                ao da operação.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <p className="mt-4 text-xs text-on-surface-variant leading-relaxed border-t border-border pt-4">
        Esta calculadora é uma ferramenta ilustrativa. Consulte um contador para
        o cálculo oficial do DARF.
      </p>
    </div>
  );
}
