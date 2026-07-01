'use client';

import { Decimal } from 'decimal.js';
import type { Transaction, Asset, DividendsResponse, DividendProjectionResponse } from '@/types/api';
import { formatBRL, formatQty } from '@/lib/format';
import { DividendChartDynamic } from './DividendChartDynamic';
import { DividendRanking } from './DividendRanking';
import { DividendProjectionCard } from './DividendProjectionCard';

interface Props {
  transactions: Transaction[];
  assets: Asset[];
  dividendsData?: DividendsResponse;
  projectionData?: DividendProjectionResponse;
}

export function ProventosTable({ transactions, assets, dividendsData, projectionData }: Props) {
  const assetMap = new Map(assets.map((a) => [a.id, a]));
  const dividends = transactions.filter((t) => t.type === 'DIVIDEND');

  const showEmpty = dividends.length === 0 && !dividendsData;

  if (showEmpty) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-on-surface-variant">
          Nenhum provento registrado. Adicione uma transação do tipo{' '}
          <span className="font-mono font-medium">DIVIDEND</span> em um ativo para visualizar aqui.
        </p>
      </div>
    );
  }

  let totalReceived = new Decimal(0);

  const rows = dividends.map((tx) => {
    const asset = assetMap.get(tx.asset_id);
    const qty = new Decimal(tx.quantity);
    const price = new Decimal(tx.unit_price);
    const total = qty.times(price);
    totalReceived = totalReceived.plus(total);
    return { tx, asset, total };
  });

  return (
    <div className="space-y-6">
      {/* Charts, ranking e projeção */}
      {dividendsData && (
        <div className="space-y-6">
          {projectionData && <DividendProjectionCard data={projectionData} />}
          <DividendChartDynamic data={dividendsData} />
          <DividendRanking data={dividendsData} />
        </div>
      )}

      {/* Histórico completo de transações */}
      <div>
        <h3 className="mb-3 text-sm font-medium">Histórico Completo</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-on-surface-variant">
                <th className="pb-2 pr-4">Data</th>
                <th className="pb-2 pr-4">Ativo</th>
                <th className="pb-2 pr-4 text-right">Valor/Cota</th>
                <th className="pb-2 pr-4 text-right">Quantidade</th>
                <th className="pb-2 text-right">Total Recebido</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ tx, asset, total }) => (
                <tr key={tx.id} className="border-b border-border/50 last:border-0">
                  <td className="py-3 pr-4 text-on-surface-variant">
                    {new Date(tx.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-3 pr-4 font-medium">{asset?.ticker ?? '—'}</td>
                  <td className="py-3 pr-4 text-right font-mono">{formatBRL(tx.unit_price)}</td>
                  <td className="py-3 pr-4 text-right font-mono">{formatQty(tx.quantity)}</td>
                  <td className="py-3 text-right font-mono text-green-600">
                    {formatBRL(total.toString())}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border">
                <td colSpan={4} className="pt-3 pr-4 text-sm font-medium">
                  Total recebido
                </td>
                <td className="pt-3 text-right font-mono font-semibold text-green-600">
                  {formatBRL(totalReceived.toString())}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
