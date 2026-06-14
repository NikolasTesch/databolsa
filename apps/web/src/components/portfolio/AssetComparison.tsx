'use client';

import { useState } from 'react';
import { Decimal } from 'decimal.js';
import type { PortfolioSummaryDto, Asset } from '@/types/api';
import { formatBRL, formatAllocationPct, getValueSign } from '@/lib/format';
import { AssetClassBadge } from '@/components/assets/AssetClassBadge';
import { cn } from '@/components/ui/cn';

interface Props {
  summary: PortfolioSummaryDto;
  assets: Asset[];
}

const MAX_SELECTED = 6;

export function AssetComparison({ summary, assets }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const assetMap = new Map(assets.map((a) => [a.id, a]));
  const positions = summary.positions;

  function toggle(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < MAX_SELECTED
        ? [...prev, id]
        : prev,
    );
  }

  const selected = positions.filter((p) => selectedIds.includes(p.asset_id));

  return (
    <div className="space-y-6">
      {/* Seletor */}
      <div>
        <p className="mb-3 text-sm text-content-muted">
          Selecione até {MAX_SELECTED} ativos para comparar ({selectedIds.length}/{MAX_SELECTED}{' '}
          selecionados)
        </p>
        <div className="flex flex-wrap gap-2">
          {positions.map((pos) => {
            const isSelected = selectedIds.includes(pos.asset_id);
            return (
              <button
                key={pos.asset_id}
                onClick={() => toggle(pos.asset_id)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                  isSelected
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-surface text-content hover:border-primary/50',
                )}
              >
                {pos.ticker}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards de comparação */}
      {selected.length >= 2 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {selected.map((pos) => {
            const asset = assetMap.get(pos.asset_id);
            const plSign = getValueSign(pos.lucro_prejuizo_brl ?? '0');

            return (
              <div
                key={pos.asset_id}
                className="space-y-3 rounded-xl border border-border bg-surface p-4"
              >
                <div>
                  <p className="text-lg font-bold">{pos.ticker}</p>
                  {asset && <AssetClassBadge assetClass={asset.asset_class} />}
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-xs text-content-muted">Preço Médio</p>
                    <p className="font-mono font-medium">{formatBRL(pos.average_price)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-content-muted">Preço Atual</p>
                    <p className="font-mono font-medium">
                      {pos.current_price_brl ? formatBRL(pos.current_price_brl) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-content-muted">P/L</p>
                    <p
                      className={cn(
                        'font-mono font-medium',
                        plSign === 'positive'
                          ? 'text-green-600'
                          : plSign === 'negative'
                          ? 'text-red-600'
                          : '',
                      )}
                    >
                      {pos.lucro_prejuizo_brl ? formatBRL(pos.lucro_prejuizo_brl) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-content-muted">P/L %</p>
                    <p
                      className={cn(
                        'font-mono font-medium',
                        plSign === 'positive'
                          ? 'text-green-600'
                          : plSign === 'negative'
                          ? 'text-red-600'
                          : '',
                      )}
                    >
                      {pos.lucro_prejuizo_pct
                        ? `${new Decimal(pos.lucro_prejuizo_pct).toFixed(2).replace('.', ',')}%`
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-content-muted">% Carteira</p>
                    <p className="font-mono font-medium text-content-muted">
                      {pos.alocacao_pct ? formatAllocationPct(pos.alocacao_pct) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-content-muted">
          Selecione pelo menos 2 ativos para comparar.
        </p>
      )}
    </div>
  );
}
