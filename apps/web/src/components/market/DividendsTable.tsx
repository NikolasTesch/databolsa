'use client';

import { useState, useMemo, useEffect } from 'react';
import type { AssetClass } from '@/types/api';
import { DividendsChart } from './DividendsChartDynamic';
import { cn } from '@/components/ui/cn';

interface Dividend {
  paymentDate: string;
  value: string;
  type: string;
}

interface DividendsTableProps {
  dividends: Dividend[];
  assetClass: AssetClass;
}

const NO_DIVIDENDS_CLASSES = new Set<AssetClass>(['CRYPTO', 'ETF']);

type Range = '1y' | '2y' | '5y' | 'all';

const RANGE_OPTIONS: { label: string; value: Range }[] = [
  { label: '1A', value: '1y' },
  { label: '2A', value: '2y' },
  { label: '5A', value: '5y' },
  { label: 'Tudo', value: 'all' },
];

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

function formatMonthYear(dateStr: string): string {
  try {
    const [year, month] = dateStr.split('-');
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthIdx = parseInt(month, 10) - 1;
    const shortYear = year.slice(-2);
    return `${monthNames[monthIdx]}/${shortYear}`;
  } catch {
    return dateStr;
  }
}

export function DividendsTable({ dividends, assetClass }: DividendsTableProps) {
  const [range, setRange] = useState<Range>('all');
  const [currentPage, setCurrentPage] = useState(1);

  if (NO_DIVIDENDS_CLASSES.has(assetClass)) {
    return null;
  }

  // Reset page when range filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [range]);

  // 1. Filtrar dividendos com base no range selecionado
  const filteredDividends = useMemo(() => {
    if (range === 'all') return dividends;

    const limitDate = new Date();
    const now = new Date();
    if (range === '1y') limitDate.setFullYear(now.getFullYear() - 1);
    else if (range === '2y') limitDate.setFullYear(now.getFullYear() - 2);
    else if (range === '5y') limitDate.setFullYear(now.getFullYear() - 5);

    // Ajustar a data limite para o começo do dia para comparação
    limitDate.setHours(0, 0, 0, 0);

    return dividends.filter((d) => {
      if (!d.paymentDate) return false;
      const dDate = new Date(d.paymentDate + 'T00:00:00');
      return dDate >= limitDate;
    });
  }, [dividends, range]);

  // 2. Agrupar dividendos por mês para o gráfico
  const chartData = useMemo(() => {
    const groups: Record<string, number> = {};

    filteredDividends.forEach((d) => {
      if (!d.paymentDate) return;
      const monthKey = d.paymentDate.slice(0, 7); // "YYYY-MM"
      groups[monthKey] = (groups[monthKey] || 0) + parseFloat(d.value);
    });

    return Object.entries(groups)
      .map(([monthKey, sum]) => ({
        monthKey,
        label: formatMonthYear(monthKey),
        value: sum,
      }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey)); // Ordenação cronológica para o gráfico (esq -> dir)
  }, [filteredDividends]);

  // 3. Paginação da tabela
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredDividends.length / ITEMS_PER_PAGE);

  const paginatedDividends = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDividends.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredDividends, currentPage]);

  return (
    <div className="mx-4 md:mx-8 mb-8">
      <div className="bg-surface border border-border rounded-lg p-6">
        {/* Cabeçalho com título e filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-sm font-semibold text-content-muted uppercase tracking-wide">
            Histórico de Proventos
          </h2>
          <div className="flex items-center gap-2">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={cn(
                  'text-xs px-3 py-1 rounded transition-colors',
                  range === opt.value
                    ? 'bg-primary text-white font-medium'
                    : 'bg-surface-muted text-content-muted hover:bg-primary/10',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gráfico */}
        {dividends.length > 0 && (
          <div className="mb-6">
            <DividendsChart data={chartData} />
          </div>
        )}

        {/* Tabela ou Mensagem Vazia */}
        {filteredDividends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-content-muted border border-dashed border-border rounded-lg bg-surface-muted/30">
            <svg
              className="h-8 w-8 opacity-40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={1.5} />
              <line x1="16" y1="2" x2="16" y2="6" strokeWidth={1.5} />
              <line x1="8" y1="2" x2="8" y2="6" strokeWidth={1.5} />
              <line x1="3" y1="10" x2="21" y2="10" strokeWidth={1.5} />
            </svg>
            <p className="text-sm">Nenhum provento encontrado neste período.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-content-muted uppercase border-b border-border">
                    <th className="text-left pb-2 pr-4">Data de Pagamento</th>
                    <th className="text-left pb-2 pr-4">Tipo</th>
                    <th className="text-right pb-2">Valor por Cota</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDividends.map((d, idx) => (
                    <tr
                      key={`${d.paymentDate}-${idx}`}
                      className={`border-b border-border/50 hover:bg-primary/5 transition-colors ${idx % 2 === 0 ? 'bg-surface' : 'bg-surface-muted'}`}
                    >
                      <td className="py-2 pr-4 font-mono text-content">{formatDate(d.paymentDate)}</td>
                      <td className="py-2 pr-4 text-content-muted">{d.type}</td>
                      <td className="py-2 text-right font-mono text-content">
                        R$ {parseFloat(d.value).toLocaleString('pt-BR', { minimumFractionDigits: 4 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Controles de Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-xs rounded border border-border bg-surface text-content-muted hover:bg-surface-muted hover:text-content transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  Anterior
                </button>
                <span className="text-xs text-content-muted font-medium">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-xs rounded border border-border bg-surface text-content-muted hover:bg-surface-muted hover:text-content transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  Próximo
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

