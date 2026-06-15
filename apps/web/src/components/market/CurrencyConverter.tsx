'use client';

import { useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';

const FIAT_OPTIONS = ['USD', 'EUR', 'GBP'] as const;
type FiatFrom = (typeof FIAT_OPTIONS)[number];

interface ConvertResult {
  from: string;
  to: string;
  amount: string;
  rate: string;
  result: string;
  updatedAt: string;
  stale: boolean;
}

export function CurrencyConverter() {
  const [from, setFrom] = useState<FiatFrom>('USD');
  const [amount, setAmount] = useState('100');
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const params = new URLSearchParams({ from, to: 'BRL', amount });
      const res = await fetch(`/api/market/tools/convert?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? 'Erro ao converter.');
        setResult(null);
      } else {
        setResult(data as ConvertResult);
      }
    } catch {
      setError('Falha de conexão. Tente novamente.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function formatBrl(value: string): string {
    try {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(parseFloat(value));
    } catch {
      return `R$ ${value}`;
    }
  }

  function formatTime(iso: string): string {
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h3 className="text-base font-semibold text-content mb-4">Conversor de Moedas</h3>

      <form onSubmit={handleConvert} className="flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="currency-amount" className="block text-xs text-content-muted mb-1">
              Valor
            </label>
            <input
              id="currency-amount"
              type="number"
              min="0.01"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface text-content px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="100"
            />
          </div>

          <div className="w-28">
            <label htmlFor="currency-from" className="block text-xs text-content-muted mb-1">
              De
            </label>
            <select
              id="currency-from"
              value={from}
              onChange={(e) => setFrom(e.target.value as FiatFrom)}
              className="w-full rounded-lg border border-border bg-surface text-content px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {FIAT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="w-20 flex items-end pb-2">
            <span className="text-sm text-content-muted font-medium">→ BRL</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary text-white font-medium py-2 text-sm hover:bg-primary-hover transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Spinner size="sm" />
              Convertendo...
            </>
          ) : (
            'Converter'
          )}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      {result && !error && (
        <div className="mt-4 rounded-lg bg-surface-muted p-4">
          <div className="text-2xl font-bold text-content">
            {formatBrl(result.result)}
          </div>
          <div className="text-xs text-content-muted mt-1">
            1 {result.from} = R$ {parseFloat(result.rate).toFixed(4)} · Atualizado às {formatTime(result.updatedAt)}
            {result.stale && (
              <span className="ml-1 text-amber-500">(cotação desatualizada)</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
