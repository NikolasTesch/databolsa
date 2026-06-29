'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface AssetRow {
  id: string;
  ticker: string;
  quantity: number;
  avgPrice: number;
}

const CHART_COLORS = ['#adc6ff', '#4edea3', '#ffb786', '#f87171', '#fbbf24', '#a78bfa', '#34d399', '#fb923c'];

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

let nextId = 1;

export default function SimuladorCarteira() {
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [avgPrice, setAvgPrice] = useState('');

  const totalInvested = assets.reduce((sum, a) => sum + a.quantity * a.avgPrice, 0);

  const addAsset = () => {
    const qty = parseFloat(quantity);
    const price = parseFloat(avgPrice);
    if (!ticker.trim() || !qty || !price || qty <= 0 || price <= 0) return;
    setAssets((prev) => [
      ...prev,
      { id: String(nextId++), ticker: ticker.trim().toUpperCase(), quantity: qty, avgPrice: price },
    ]);
    setTicker('');
    setQuantity('');
    setAvgPrice('');
  };

  const removeAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  };

  const chartData = assets.map((a) => ({
    name: a.ticker,
    value: a.quantity * a.avgPrice,
  }));

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder="Ticker (ex: PETR4)"
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant outline-none focus:border-primary transition-colors font-mono uppercase"
        />
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Quantidade"
          min="0"
          step="1"
          className="w-full sm:w-28 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant outline-none focus:border-primary transition-colors font-mono"
        />
        <input
          type="number"
          value={avgPrice}
          onChange={(e) => setAvgPrice(e.target.value)}
          placeholder="Preço médio"
          min="0"
          step="0.01"
          className="w-full sm:w-32 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant outline-none focus:border-primary transition-colors font-mono"
        />
        <button
          onClick={addAsset}
          disabled={!ticker || !quantity || !avgPrice}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Adicionar
        </button>
      </div>

      {/* Empty state */}
      {assets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-3">
            savings
          </span>
          <p className="text-sm text-on-surface-variant">Adicione ativos para começar a simular sua carteira.</p>
        </div>
      )}

      {assets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table */}
          <div className="lg:col-span-2 overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-xs text-on-surface-variant uppercase tracking-wide">
                  <th className="px-4 py-3 text-left font-medium">Ticker</th>
                  <th className="px-4 py-3 text-right font-medium">Qtd</th>
                  <th className="px-4 py-3 text-right font-medium">Preço Médio</th>
                  <th className="px-4 py-3 text-right font-medium">Total (R$)</th>
                  <th className="px-4 py-3 text-right font-medium">%</th>
                  <th className="px-4 py-3 text-center w-10" />
                </tr>
              </thead>
              <tbody>
                {assets.map((a, idx) => {
                  const total = a.quantity * a.avgPrice;
                  const pct = totalInvested > 0 ? (total / totalInvested) * 100 : 0;
                  return (
                    <tr
                      key={a.id}
                      className="border-b border-border/50 last:border-b-0 hover:bg-surface-muted/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                          />
                          <span className="font-mono text-sm font-semibold text-on-surface">{a.ticker}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-on-surface tabular-nums">
                        {a.quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-on-surface tabular-nums">
                        {formatBRL(a.avgPrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-on-surface tabular-nums">
                        {formatBRL(total)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-on-surface tabular-nums">
                        {pct.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => removeAsset(a.id)}
                          className="text-on-surface-variant hover:text-loss transition-colors"
                          aria-label={`Remover ${a.ticker}`}
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary + Pie */}
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-surface p-4">
              <span className="text-xs text-on-surface-variant uppercase tracking-wide font-medium">Total Investido</span>
              <p className="text-2xl font-semibold text-on-surface font-mono tabular-nums mt-1">
                {formatBRL(totalInvested)}
              </p>
              <div className="flex justify-between mt-3 text-xs text-on-surface-variant">
                <span>{assets.length} ativo{assets.length !== 1 ? 's' : ''}</span>
                <span>{assets.reduce((s, a) => s + a.quantity, 0)} cotas</span>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-surface p-4">
              <h3 className="text-xs text-on-surface-variant uppercase tracking-wide font-medium mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-lg">pie_chart</span>
                Alocação
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {chartData.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
                {assets.map((a, idx) => {
                  const total = a.quantity * a.avgPrice;
                  const pct = totalInvested > 0 ? (total / totalInvested) * 100 : 0;
                  return (
                    <span key={a.id} className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                      />
                      {a.ticker} {pct.toFixed(1)}%
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
