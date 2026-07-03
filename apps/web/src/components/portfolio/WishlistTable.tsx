'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeWatch } from '@/lib/api/portfolio';
import { formatBRL, formatPct } from '@/lib/format';
import { AssetClassBadge } from '@/components/assets/AssetClassBadge';
import { Button } from '@/components/ui/Button';
import { WishlistPriceChartDynamic } from './WishlistPriceChartDynamic';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/components/ui/cn';
import { getMetricLabel } from '@/lib/api/analysis-alerts';
import type { AssetClass } from '@/types/api';

interface WatchItem {
  id: string;
  ticker: string;
  name: string | null;
  asset_class: string;
  current_price_brl: string | null;
  price_change_pct: string | null;
  added_at: string;
}

interface AlertRuleInfo {
  id: string;
  metric: string;
  condition: string;
  target_value: string;
  triggered: boolean;
  is_active: boolean;
  current_value: string | null;
}

interface AnalysisInfo {
  totalScore: string;
  scoreLevel: string;
}

interface Props {
  items: WatchItem[];
  alertRules?: Record<string, AlertRuleInfo[]>;
  analysisData?: Record<string, AnalysisInfo>;
  onCreateAlert?: (ticker: string) => void;
}

function getScoreColor(level: string): string {
  switch (level) {
    case 'positive':
      return 'text-gain';
    case 'neutral':
      return 'text-on-surface';
    case 'warning':
      return 'text-tertiary';
    case 'negative':
      return 'text-loss';
    default:
      return 'text-on-surface-variant';
  }
}

export function WishlistTable({
  items,
  alertRules = {},
  analysisData = {},
  onCreateAlert,
}: Props) {
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeWatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.watchList() });
    },
  });

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface py-12 text-center">
        <p className="text-on-surface-variant">Nenhum ativo na watchlist</p>
        <p className="mt-1 text-sm text-outline">Adicione ativos para acompanhar seus preços</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted text-xs font-medium uppercase tracking-wider text-outline">
              <th className="px-4 py-3 text-left">Ativo</th>
              <th className="px-4 py-3 text-left">Nome</th>
              <th className="px-4 py-3 text-left">Classe</th>
              <th className="px-4 py-3 text-right">Preço Atual</th>
              <th className="px-4 py-3 text-right">Variação</th>
              <th className="px-4 py-3 text-right">Score</th>
              <th className="px-4 py-3 text-center">Alertas</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {items.map((item) => {
              const tickerAlerts = alertRules[item.ticker] ?? [];
              const analysis = analysisData[item.ticker];
              const hasActiveAlert = tickerAlerts.some((a) => a.is_active);
              const hasTriggered = tickerAlerts.some((a) => a.triggered);

              return (
                <tr
                  key={item.id}
                  className="hover:bg-surface-muted cursor-pointer"
                  onClick={() =>
                    setSelectedTicker(
                      selectedTicker === item.ticker ? null : item.ticker,
                    )
                  }
                >
                  <td className="px-4 py-3 font-medium text-primary">{item.ticker}</td>
                  <td className="px-4 py-3 text-on-surface max-w-[160px] truncate">
                    {item.name || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <AssetClassBadge assetClass={item.asset_class as AssetClass} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {item.current_price_brl ? formatBRL(item.current_price_brl) : '—'}
                  </td>
                  <td
                    className={cn(
                      'px-4 py-3 text-right font-mono',
                      item.price_change_pct
                        ? parseFloat(item.price_change_pct) >= 0
                          ? 'text-gain'
                          : 'text-loss'
                        : 'text-on-surface-variant',
                    )}
                  >
                    {item.price_change_pct ? formatPct(item.price_change_pct) : '—'}
                  </td>
                  <td className={cn(
                    'px-4 py-3 text-right font-mono',
                    analysis ? getScoreColor(analysis.scoreLevel) : 'text-on-surface-variant',
                  )}>
                    {analysis ? analysis.totalScore : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      {hasActiveAlert && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-profit-surface px-2 py-0.5 text-[11px] font-medium text-profit-content">
                          <span className="material-symbols-outlined text-[12px]">notifications</span>
                          Alerta ativo
                        </span>
                      )}
                      {hasTriggered && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-tertiary-container px-2 py-0.5 text-[11px] font-medium text-tertiary">
                          <span className="material-symbols-outlined text-[12px]">warning</span>
                          Disparado
                        </span>
                      )}
                      {!hasActiveAlert && !hasTriggered && tickerAlerts.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-low px-2 py-0.5 text-[11px] font-medium text-on-surface-variant">
                          {tickerAlerts.length} alerta(s)
                        </span>
                      )}
                      {tickerAlerts.length > 0 && (
                        <div className="flex flex-col gap-0.5">
                          {tickerAlerts.map((alert) => (
                            <span
                              key={alert.id}
                              className="text-[10px] text-outline"
                            >
                              {getMetricLabel(alert.metric)} {alert.condition === 'ABOVE' ? '>' : '<'}{' '}
                              {alert.target_value}
                              {alert.current_value
                                ? ` (atual: ${alert.current_value})`
                                : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {onCreateAlert && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateAlert(item.ticker);
                          }}
                        >
                          <span className="material-symbols-outlined text-[16px]">add_alert</span>
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMutation.mutate(item.id);
                        }}
                        loading={removeMutation.isPending}
                      >
                        Remover
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Price chart for selected ticker */}
      {selectedTicker && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-on-surface">
              Histórico de Preço — {selectedTicker}
            </p>
            <button
              onClick={() => setSelectedTicker(null)}
              className="text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <WishlistPriceChartDynamic ticker={selectedTicker} />
        </div>
      )}
    </div>
  );
}
