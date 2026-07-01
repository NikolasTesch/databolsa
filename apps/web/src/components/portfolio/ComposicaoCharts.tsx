'use client';

import { Decimal } from 'decimal.js';
import type { PositionSummaryDto, Asset, AssetClass } from '@/types/api';
import { formatBRL, formatAllocationPct } from '@/lib/format';
import { ComposicaoPieChartDynamic } from './ComposicaoPieChartDynamic';

const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  STOCK_BR: 'Ações BR',
  FII: 'FIIs',
  ETF: 'ETFs',
  BDR: 'BDRs',
  CRYPTO: 'Cripto',
  STOCK_US: 'Ações EUA',
};

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

interface GroupedData {
  label: string;
  value: Decimal;
  pl: Decimal;
  pct: Decimal;
}

function groupByClass(positions: PositionSummaryDto[], assets: Asset[]): GroupedData[] {
  const assetMap = new Map(assets.map((a) => [a.id, a]));
  const grouped = new Map<string, { value: Decimal; pl: Decimal }>();
  let total = new Decimal(0);

  for (const pos of positions) {
    if (!pos.valor_atual_brl) continue;
    const asset = assetMap.get(pos.asset_id);
    if (!asset) continue;
    const key = asset.asset_class;
    const val = new Decimal(pos.valor_atual_brl);
    const pl = pos.lucro_prejuizo_brl ? new Decimal(pos.lucro_prejuizo_brl) : new Decimal(0);
    const existing = grouped.get(key) ?? { value: new Decimal(0), pl: new Decimal(0) };
    grouped.set(key, { value: existing.value.plus(val), pl: existing.pl.plus(pl) });
    total = total.plus(val);
  }

  return Array.from(grouped.entries())
    .map(([key, { value, pl }]) => ({
      label: ASSET_CLASS_LABELS[key as AssetClass] ?? key,
      value,
      pl,
      pct: total.isZero() ? new Decimal(0) : value.div(total).times(100),
    }))
    .sort((a, b) => b.value.comparedTo(a.value));
}

function groupByCurrency(
  positions: PositionSummaryDto[],
  assets: Asset[],
): { label: string; value: number; pct: number }[] {
  const assetMap = new Map(assets.map((a) => [a.id, a]));
  const grouped = new Map<string, Decimal>();
  let total = new Decimal(0);

  for (const pos of positions) {
    if (!pos.valor_atual_brl) continue;
    const asset = assetMap.get(pos.asset_id);
    if (!asset) continue;
    const val = new Decimal(pos.valor_atual_brl);
    const label = asset.currency === 'USD' ? 'Exterior (USD)' : 'Brasil (BRL)';
    grouped.set(label, (grouped.get(label) ?? new Decimal(0)).plus(val));
    total = total.plus(val);
  }

  return Array.from(grouped.entries()).map(([label, value]) => ({
    label,
    value: parseFloat(value.toString()),
    pct: total.isZero() ? 0 : parseFloat(value.div(total).times(100).toFixed(1)),
  }));
}

interface SectorDataItem {
  key: string;
  value_brl: string;
  pct: string;
}

interface Props {
  positions: PositionSummaryDto[];
  assets: Asset[];
  sectorData?: SectorDataItem[];
}

export function ComposicaoCharts({ positions, assets, sectorData }: Props) {
  const byClass = groupByClass(positions, assets);
  const byCurrency = groupByCurrency(positions, assets);

  const pieDataClass = byClass.map((g, i) => ({
    name: g.label,
    value: parseFloat(g.value.toString()),
    color: COLORS[i % COLORS.length],
  }));

  if (byClass.length === 0) {
    return (
      <p className="text-sm text-on-surface-variant">
        Nenhuma posição com cotação disponível.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {/* Por Classe */}
      <div>
        <h3 className="mb-4 text-sm font-medium">Por Classe de Ativo</h3>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="w-full lg:w-64">
            <ComposicaoPieChartDynamic data={pieDataClass} />
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-on-surface-variant">
                  <th className="pb-2 pr-4">Classe</th>
                  <th className="pb-2 pr-4 text-right">Valor</th>
                  <th className="pb-2 pr-4 text-right">% Carteira</th>
                  <th className="pb-2 text-right">P/L</th>
                </tr>
              </thead>
              <tbody>
                {byClass.map((g, i) => (
                  <tr key={g.label} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        {g.label}
                      </div>
                    </td>
                    <td className="py-2 pr-4 text-right font-mono">
                      {formatBRL(g.value.toString())}
                    </td>
                    <td className="py-2 pr-4 text-right font-mono text-on-surface-variant">
                      {formatAllocationPct(g.pct.toString())}
                    </td>
                    <td
                      className={`py-2 text-right font-mono ${
                        parseFloat(g.pl.toString()) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatBRL(g.pl.toString())}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Por Moeda */}
      <div>
        <h3 className="mb-4 text-sm font-medium">Por Moeda</h3>
        <div className="flex flex-wrap gap-3">
          {byCurrency.map((g, i) => (
            <div
              key={g.label}
              className="min-w-[160px] rounded-lg border border-border bg-surface p-4"
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: COLORS[(i + 2) % COLORS.length] }}
                />
                <span className="text-sm font-medium">{g.label}</span>
              </div>
              <p className="mt-2 font-mono text-lg font-semibold">
                R$ {g.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-on-surface-variant">{g.pct.toFixed(1)}% da carteira</p>
            </div>
          ))}
        </div>
      </div>

      {/* Por Setor */}
      {sectorData && sectorData.length > 0 && (
        <div>
          <h3 className="mb-4 text-sm font-medium">Por Setor</h3>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-on-surface-variant">
                    <th className="pb-2 pr-4">Setor</th>
                    <th className="pb-2 pr-4 text-right">Valor</th>
                    <th className="pb-2 text-right">% Carteira</th>
                  </tr>
                </thead>
                <tbody>
                  {sectorData.map((s) => (
                    <tr key={s.key} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-4">{s.key}</td>
                      <td className="py-2 pr-4 text-right font-mono">{formatBRL(s.value_brl)}</td>
                      <td className="py-2 text-right font-mono text-on-surface-variant">
                        {formatAllocationPct(s.pct)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
