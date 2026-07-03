'use client';

import { useCallback } from 'react';
import { Decimal } from 'decimal.js';
import { cn } from '@/components/ui/cn';

export interface DividendData {
  ticker: string;
  dy: string | null;
  lastDividend: string | null;
  totalScore: string | null;
  pe: string | null;
  pb: string | null;
  roe: string | null;
  netMargin: string | null;
  debtToEquity: string | null;
}

interface ComparatorDividendsTableProps {
  data: DividendData[];
}

function dyColor(dy: string | null): string {
  if (dy === null || dy === '' || dy === 'NaN') return 'text-on-surface-variant';
  const num = parseFloat(dy);
  if (!isFinite(num)) return 'text-on-surface-variant';
  if (num >= 3 && num <= 12) return 'text-profit';
  if (num > 12) return 'text-attention';
  return 'text-on-surface-variant';
}

function capitalizefy(value: string | null, suffix = ''): string {
  if (value === null || value === '' || value === 'NaN') return '—';
  const num = parseFloat(value);
  if (!isFinite(num)) return '—';
  return `${num.toFixed(num % 1 === 0 ? 1 : 2)}${suffix}`;
}

function formatCurrency(value: string | null): string {
  if (value === null || value === '' || value === 'NaN') return '—';
  try {
    const d = new Decimal(value);
    if (!d.isFinite()) return '—';
    return `R$ ${d.toFixed(2)}`;
  } catch {
    return '—';
  }
}

function generateCsv(data: DividendData[]): string {
  const header = 'Ativo;Score;P/L;P/VP;DY;ROE;Margem;Dívida/PL;DY;Último provento';
  const rows = data.map((d) =>
    [
      d.ticker,
      d.totalScore ?? '—',
      d.pe ?? '—',
      d.pb ?? '—',
      d.dy ? `${d.dy}%` : '—',
      d.roe ? `${d.roe}%` : '—',
      d.netMargin ? `${d.netMargin}%` : '—',
      d.debtToEquity ?? '—',
      d.dy ? `${d.dy}%` : '—',
      d.lastDividend ? `R$ ${d.lastDividend}` : '—',
    ].join(';'),
  );
  return [header, ...rows].join('\n');
}

function downloadCsv(content: string, filename: string) {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ComparatorDividendsTable({ data }: ComparatorDividendsTableProps) {
  const handleExport = useCallback(() => {
    const csv = generateCsv(data);
    downloadCsv(csv, 'comparacao-ativos.csv');
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5 text-center">
        <p className="text-sm text-on-surface-variant">Nenhum dado de proventos disponível.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-on-surface">Proventos</h3>
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-muted transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
          Exportar CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted text-xs text-on-surface-variant uppercase tracking-wide">
              <th className="px-4 py-3 text-left font-medium">Ativo</th>
              <th className="px-4 py-3 text-right font-medium">DY</th>
              <th className="px-4 py-3 text-right font-medium">Último provento</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr
                key={d.ticker}
                className="border-b border-border/50 last:border-b-0 hover:bg-surface-muted/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <span className="font-mono text-sm font-semibold text-on-surface">
                    {d.ticker}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={cn('font-mono text-sm tabular-nums', dyColor(d.dy))}>
                    {capitalizefy(d.dy, '%')}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm text-on-surface tabular-nums">
                  {formatCurrency(d.lastDividend)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
