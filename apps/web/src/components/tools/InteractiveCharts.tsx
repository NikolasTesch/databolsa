'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  date: string;
  price: number;
}

interface HistoryResponse {
  ticker: string;
  data_points: DataPoint[];
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function generateMockData(): DataPoint[] {
  const points: DataPoint[] = [];
  let price = 38;
  const start = new Date();
  start.setDate(start.getDate() - 90);
  for (let i = 0; i < 90; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    price *= 1 + (Math.random() - 0.48) * 0.04;
    points.push({ date: date.toISOString().split('T')[0], price: Math.round(price * 100) / 100 });
  }
  return points;
}

export default function InteractiveCharts() {
  const [ticker, setTicker] = useState('');
  const [data, setData] = useState<DataPoint[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tickerLoaded, setTickerLoaded] = useState('');

  const loadData = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const t = ticker.trim().toUpperCase();
    if (!t) return;

    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await fetch(`/api/market/${t}/history`);
      if (!res.ok) throw new Error('Not found');
      const json: HistoryResponse = await res.json();
      if (!json.data_points || json.data_points.length === 0) throw new Error('No data');
      setData(json.data_points);
      setTickerLoaded(t);
    } catch {
      // Fallback to mock data
      setData(generateMockData());
      setTickerLoaded(t);
      setError('Dados simulados (API indisponível para este ticker)');
    } finally {
      setLoading(false);
    }
  };

  const currentPrice = data && data.length > 0 ? data[data.length - 1].price : null;
  const highestPrice = data ? Math.max(...data.map((d) => d.price)) : null;
  const lowestPrice = data ? Math.min(...data.map((d) => d.price)) : null;
  const firstPrice = data && data.length > 0 ? data[0].price : null;
  const variation = firstPrice && currentPrice ? ((currentPrice - firstPrice) / firstPrice) * 100 : null;

  return (
    <div className="space-y-6">
      {/* Search */}
      <form onSubmit={loadData} className="flex gap-3">
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder="Digite um ticker (ex: PETR4, VALE3, ITUB4)"
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant outline-none focus:border-primary transition-colors font-mono uppercase"
        />
        <button
          type="submit"
          disabled={!ticker.trim() || loading}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-lg">search</span>
          Carregar
        </button>
      </form>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <div className="h-24 rounded-lg bg-surface-muted animate-pulse" />
          <div className="h-64 rounded-lg bg-surface-muted animate-pulse" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !data && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-3">
            show_chart
          </span>
          <p className="text-sm text-on-surface-variant">
            Digite o ticker de um ativo para visualizar o histórico de preços.
          </p>
        </div>
      )}

      {/* Chart */}
      {!loading && data && (
        <>
          {error && (
            <div className="rounded-lg bg-loss-surface/20 border border-loss/30 px-4 py-2 text-sm text-loss">
              {error}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-border bg-surface p-3">
              <span className="text-xs text-on-surface-variant">Atual</span>
              <p className="text-lg font-semibold text-on-surface font-mono tabular-nums">
                {currentPrice ? formatBRL(currentPrice) : '—'}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <span className="text-xs text-on-surface-variant">Máxima</span>
              <p className="text-lg font-semibold text-profit font-mono tabular-nums">
                {highestPrice ? formatBRL(highestPrice) : '—'}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <span className="text-xs text-on-surface-variant">Mínima</span>
              <p className="text-lg font-semibold text-loss font-mono tabular-nums">
                {lowestPrice ? formatBRL(lowestPrice) : '—'}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <span className="text-xs text-on-surface-variant">Variação</span>
              <p
                className={`text-lg font-semibold font-mono tabular-nums ${
                  variation !== null ? (variation >= 0 ? 'text-profit' : 'text-loss') : ''
                }`}
              >
                {variation !== null ? `${variation >= 0 ? '+' : ''}${variation.toFixed(2)}%` : '—'}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <h3 className="text-sm font-medium text-on-surface-variant mb-4 font-mono">
              {tickerLoaded} · Histórico de Preços
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#adc6ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#adc6ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant)' }}
                    tickFormatter={(v: string) => {
                      const d = new Date(v);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={['dataMin - 1', 'dataMax + 1']}
                    tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant)' }}
                    tickFormatter={(v: number) => formatBRL(v)}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [formatBRL(value), 'Preço']}
                    labelFormatter={(label: string) => {
                      const d = new Date(label);
                      return d.toLocaleDateString('pt-BR');
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#adc6ff"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#priceGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
