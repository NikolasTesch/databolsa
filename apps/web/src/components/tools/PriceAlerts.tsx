'use client';

import { useState, useEffect } from 'react';

type AlertCondition = 'ABOVE' | 'BELOW';

interface Alert {
  id: string;
  ticker: string;
  condition: AlertCondition;
  targetPrice: number;
  active: boolean;
}

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

export default function PriceAlerts() {
  const [ticker, setTicker] = useState('');
  const [condition, setCondition] = useState<AlertCondition>('ABOVE');
  const [targetRaw, setTargetRaw] = useState('');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/alerts')
      .then((r) => {
        if (r.status === 401) throw new Error('UNAUTHORIZED');
        return r.json();
      })
      .then((data) => setAlerts(Array.isArray(data) ? data : data.alerts ?? []))
      .catch((err) => {
        if (err.message === 'UNAUTHORIZED') {
          setError('Faça login para gerenciar alertas');
        }
        setAlerts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    setError(null);

    const tickerTrimmed = ticker.trim().toUpperCase();
    if (!tickerTrimmed) {
      setError('Informe o ticker do ativo.');
      return;
    }

    const target = parseBRLInput(targetRaw);
    if (target <= 0) {
      setError('Informe um preço-alvo válido.');
      return;
    }

    if (alerts.some((a) => a.ticker === tickerTrimmed && a.condition === condition)) {
      setError('Já existe um alerta com este ticker e condição.');
      return;
    }

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset_ticker: tickerTrimmed, condition, target_price: target }),
      });

      if (res.status === 401) {
        setError('Faça login para gerenciar alertas');
        return;
      }

      if (!res.ok) throw new Error('Erro ao criar alerta');

      const data = await res.json();
      const mapped: Alert = {
        id: data.id,
        ticker: data.asset_ticker,
        condition: data.condition,
        targetPrice: parseFloat(data.target_price),
        active: data.is_active,
      };

      setAlerts((prev) => [mapped, ...prev]);
      setTicker('');
      setCondition('ABOVE');
      setTargetRaw('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar alerta');
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/alerts/${id}`, { method: 'DELETE' });
      if (res.status === 401) {
        setError('Faça login para gerenciar alertas');
        return;
      }
      if (!res.ok && res.status !== 404) throw new Error('Erro ao remover alerta');
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setError('Erro ao remover alerta');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="material-symbols-outlined text-[28px] text-primary">
          notifications_active
        </span>
        <h2 className="text-lg font-semibold text-on-surface">Central de Alertas de Preço</h2>
      </div>

      {/* Explanation */}
      <div className="glass-panel rounded-lg p-4 mb-6">
        <p className="text-sm text-on-surface-variant leading-relaxed">
          Configure alertas para ser notificado quando um ativo atingir um preço-alvo.
          As notificações são avaliadas automaticamente a cada atualização de cotação.
        </p>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-4 mb-6" onKeyDown={handleKeyDown}>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto] gap-3 items-end">
          {/* Ticker */}
          <div>
            <label className="block text-xs text-on-surface-variant mb-1 font-medium">
              Ativo
            </label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="ex: PETR4"
              className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-on-surface w-full placeholder:text-outline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          {/* Condition pills */}
          <div>
            <label className="block text-xs text-on-surface-variant mb-1 font-medium">
              Condição
            </label>
            <div className="flex rounded-lg overflow-hidden border border-outline-variant">
              <button
                type="button"
                onClick={() => setCondition('ABOVE')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  condition === 'ABOVE'
                    ? 'bg-primary text-white'
                    : 'bg-surface-container-low text-on-surface-variant'
                }`}
              >
                Acima de
              </button>
              <button
                type="button"
                onClick={() => setCondition('BELOW')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  condition === 'BELOW'
                    ? 'bg-primary text-white'
                    : 'bg-surface-container-low text-on-surface-variant'
                }`}
              >
                Abaixo de
              </button>
            </div>
          </div>

          {/* Target price */}
          <div>
            <label className="block text-xs text-on-surface-variant mb-1 font-medium">
              Preço-alvo
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={targetRaw}
              onChange={(e) => setTargetRaw(e.target.value)}
              placeholder="R$ 0,00"
              className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-on-surface w-full font-mono placeholder:text-outline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          {/* Add button */}
          <button
            type="button"
            onClick={handleAdd}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors whitespace-nowrap"
          >
            Adicionar
          </button>
        </div>

        {error && (
          <p className="text-xs text-danger font-medium" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* Alerts list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] mb-3 animate-spin">sync</span>
          <p className="text-sm font-medium">Carregando alertas...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] mb-3">notifications_off</span>
          <p className="text-sm font-medium">Nenhum alerta cadastrado</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-on-surface-variant uppercase tracking-wider">
                <th className="text-left py-2 pr-4 font-medium">Ativo</th>
                <th className="text-left py-2 pr-4 font-medium">Condição</th>
                <th className="text-left py-2 pr-4 font-medium">Preço-alvo</th>
                <th className="text-left py-2 pr-4 font-medium">Status</th>
                <th className="text-right py-2 font-medium w-10" />
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr
                  key={alert.id}
                  className="border-b border-border/50 last:border-b-0"
                >
                  <td className="py-3 pr-4">
                    <span className="font-mono font-semibold text-on-surface">
                      {alert.ticker}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex items-center gap-1 text-sm ${
                        alert.condition === 'ABOVE'
                          ? 'text-profit'
                          : 'text-loss'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">
                        {alert.condition === 'ABOVE' ? 'trending_up' : 'trending_down'}
                      </span>
                      {alert.condition === 'ABOVE' ? 'Acima de' : 'Abaixo de'}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="font-mono text-on-surface">
                      {formatBRL(alert.targetPrice)}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        alert.active
                          ? 'bg-profit-surface text-profit-content'
                          : 'bg-surface-container-low text-on-surface-variant'
                      }`}
                    >
                      {alert.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(alert.id)}
                      className="text-on-surface-variant hover:text-danger transition-colors p-1"
                      aria-label={`Remover alerta de ${alert.ticker}`}
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
