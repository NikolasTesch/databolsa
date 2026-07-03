'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/components/ui/cn';

interface AlertRuleModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    ticker: string;
    metric: string;
    condition: string;
    target_value: string | number;
  }) => Promise<void>;
  ticker?: string;
}

const METRICS = [
  { value: 'dy', label: 'DY', icon: 'percent' },
  { value: 'pe', label: 'P/L', icon: 'trending_up' },
  { value: 'pb', label: 'P/VP', icon: 'account_balance' },
  { value: 'roe', label: 'ROE', icon: 'analytics' },
  { value: 'score', label: 'Score', icon: 'star' },
  { value: 'stale', label: 'Stale', icon: 'update' },
] as const;

const CONDITIONS = [
  { value: 'ABOVE', label: 'Acima de' },
  { value: 'BELOW', label: 'Abaixo de' },
] as const;

export function AlertRuleModal({
  open,
  onClose,
  onSave,
  ticker: defaultTicker,
}: AlertRuleModalProps) {
  const [ticker, setTicker] = useState(defaultTicker ?? '');
  const [metric, setMetric] = useState('dy');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [targetValue, setTargetValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTicker(defaultTicker ?? '');
      setMetric('dy');
      setCondition('ABOVE');
      setTargetValue('');
      setError(null);
      setSaving(false);
    }
  }, [open, defaultTicker]);

  const isStale = metric === 'stale';
  const showCondition = !isStale;
  const showTarget = !isStale;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const tickerTrimmed = ticker.trim().toUpperCase();
      if (!tickerTrimmed) {
        setError('Informe o ticker do ativo.');
        return;
      }

      if (!isStale) {
        const val = parseFloat(targetValue.replace(',', '.'));
        if (!targetValue || isNaN(val) || val <= 0) {
          setError('Informe um valor-alvo válido (maior que zero).');
          return;
        }
      }

      setSaving(true);
      try {
        const payload: {
          ticker: string;
          metric: string;
          condition: string;
          target_value: string | number;
        } = {
          ticker: tickerTrimmed,
          metric,
          condition: isStale ? 'ABOVE' : condition,
          target_value: isStale ? 24 : targetValue.replace(',', '.'),
        };

        await onSave(payload);
        onClose();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Erro ao criar alerta',
        );
      } finally {
        setSaving(false);
      }
    },
    [ticker, metric, condition, targetValue, isStale, onSave, onClose],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container-low p-6 shadow-xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-primary">
              notifications_active
            </span>
            <h2 className="text-lg font-semibold text-on-surface">
              Novo Alerta
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors p-1"
            aria-label="Fechar"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Ticker */}
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
              Ativo
            </label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="ex: PETR4"
              disabled={!!defaultTicker}
              className="bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-on-surface w-full placeholder:text-outline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Metric selector */}
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
              Métrica
            </label>
            <div className="grid grid-cols-3 gap-2">
              {METRICS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMetric(m.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg border p-2.5 text-xs transition-colors',
                    metric === m.value
                      ? 'border-primary bg-primary-container text-primary'
                      : 'border-border bg-surface text-on-surface-variant hover:border-outline',
                  )}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {m.icon}
                  </span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Condition */}
          {showCondition && (
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                Condição
              </label>
              <div className="flex rounded-lg overflow-hidden border border-outline-variant">
                {CONDITIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCondition(c.value)}
                    className={cn(
                      'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                      condition === c.value
                        ? 'bg-primary text-white'
                        : 'bg-surface-container-low text-on-surface-variant',
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stale hint */}
          {isStale && (
            <div className="rounded-lg bg-surface-container-low border border-outline-variant p-3 text-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] align-text-bottom mr-1">
                info
              </span>
              Alerta dispara quando os dados fundamentalistas estiverem
              desatualizados (&gt; 24h sem atualização).
            </div>
          )}

          {/* Target value */}
          {showTarget && (
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                Valor-alvo
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder={
                  metric === 'dy' || metric === 'roe'
                    ? 'ex: 6,5'
                    : 'ex: 10'
                }
                className="bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-on-surface w-full font-mono placeholder:text-outline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <p className="mt-1 text-xs text-outline">
                {metric === 'dy'
                  ? 'Valor em % (ex: 6,5 para 6,5% de DY)'
                  : metric === 'pe'
                    ? 'Valor do P/L'
                    : metric === 'pb'
                      ? 'Valor do P/VP'
                      : metric === 'roe'
                        ? 'Valor em % (ex: 15 para 15% de ROE)'
                        : metric === 'score'
                          ? 'Valor do Score (0-100)'
                          : ''}
              </p>
            </div>
          )}

          {error && (
            <p className="text-xs text-danger font-medium" role="alert">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving && (
                <span className="material-symbols-outlined text-[16px] animate-spin">
                  sync
                </span>
              )}
              {saving ? 'Salvando...' : 'Criar Alerta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
