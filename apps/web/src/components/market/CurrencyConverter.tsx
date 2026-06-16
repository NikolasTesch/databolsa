'use client';

import { useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';

const FIAT_OPTIONS = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'ARS'] as const;
const CRYPTO_OPTIONS = [
  'BTC',
  'ETH',
  'SOL',
  'BNB',
  'ADA',
  'DOT',
  'MATIC',
  'LINK',
  'LTC',
  'XRP',
  'DOGE',
  'AVAX',
  'SHIB',
  'TRX',
  'TON',
] as const;

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
  const [mode, setMode] = useState<'fiat' | 'crypto'>('fiat');
  const [from, setFrom] = useState<string>('USD');
  const [to, setTo] = useState<string>('BRL');
  const [amount, setAmount] = useState('100');
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleModeChange(newMode: 'fiat' | 'crypto') {
    setMode(newMode);
    setError(null);
    setResult(null);
    if (newMode === 'fiat') {
      setFrom('USD');
      setTo('BRL');
    } else {
      setFrom('BTC');
      setTo('BRL');
    }
  }

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const params = new URLSearchParams({ from, to, amount });
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

  function formatValue(value: string, currencyCode: string): string {
    try {
      const val = parseFloat(value);
      const locale = currencyCode === 'BRL' ? 'pt-BR' : 'en-US';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(val);
    } catch {
      return `${currencyCode === 'BRL' ? 'R$' : '$'} ${value}`;
    }
  }

  function formatRate(rate: string, targetCurrency: string): string {
    try {
      const val = parseFloat(rate);
      const fractionDigits = val < 0.01 ? 8 : 4;
      const locale = targetCurrency === 'BRL' ? 'pt-BR' : 'en-US';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: targetCurrency,
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }).format(val);
    } catch {
      const val = parseFloat(rate);
      const fractionDigits = val < 0.01 ? 8 : 4;
      return `${targetCurrency === 'BRL' ? 'R$' : '$'} ${val.toFixed(fractionDigits)}`;
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
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-base font-semibold text-content mb-4">Conversor de Moedas</h3>

      {/* Tabs */}
      <div className="flex rounded-lg bg-surface-muted p-1 mb-4 border border-border/50">
        <button
          type="button"
          onClick={() => handleModeChange('fiat')}
          className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all ${
            mode === 'fiat'
              ? 'bg-surface text-primary shadow-sm'
              : 'text-content-muted hover:text-content'
          }`}
        >
          Fiat
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('crypto')}
          className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all ${
            mode === 'crypto'
              ? 'bg-surface text-primary shadow-sm'
              : 'text-content-muted hover:text-content'
          }`}
        >
          Cripto
        </button>
      </div>

      <form onSubmit={handleConvert} className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="currency-amount" className="block text-xs text-content-muted mb-1 font-medium">
              Valor
            </label>
            <input
              id="currency-amount"
              type="number"
              min="0.000001"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface text-content px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="100"
            />
          </div>

          <div className="flex gap-3 sm:w-64">
            <div className="flex-1">
              <label htmlFor="currency-from" className="block text-xs text-content-muted mb-1 font-medium">
                De
              </label>
              <select
                id="currency-from"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface text-content px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {mode === 'fiat'
                  ? FIAT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))
                  : CRYPTO_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
              </select>
            </div>

            <div className="flex-1">
              <label htmlFor="currency-to" className="block text-xs text-content-muted mb-1 font-medium">
                Para
              </label>
              {mode === 'fiat' ? (
                <select
                  id="currency-to"
                  value="BRL"
                  disabled
                  className="w-full rounded-lg border border-border bg-surface-muted text-content-muted px-3 py-2 text-sm cursor-not-allowed"
                >
                  <option value="BRL">BRL</option>
                </select>
              ) : (
                <select
                  id="currency-to"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface text-content px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="BRL">BRL</option>
                  <option value="USD">USD</option>
                </select>
              )}
            </div>
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
        <p className="mt-3 text-sm text-red-500 font-medium" role="alert">
          {error}
        </p>
      )}

      {result && !error && (
        <div className="mt-4 rounded-lg bg-surface-muted p-4 border border-border/30">
          <div className="text-2xl font-bold text-content">
            {formatValue(result.result, result.to)}
          </div>
          <div className="text-xs text-content-muted mt-1">
            1 {result.from} = {formatRate(result.rate, result.to)} · Atualizado às {formatTime(result.updatedAt)}
            {result.stale && (
              <span className="ml-1 text-amber-500 font-semibold">(cotação desatualizada)</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
