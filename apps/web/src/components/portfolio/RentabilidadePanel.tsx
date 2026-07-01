'use client';

import { Decimal } from 'decimal.js';
import { useQuery } from '@tanstack/react-query';
import type { PortfolioSummaryDto } from '@/types/api';
import { BenchmarkChartDynamic } from './BenchmarkChartDynamic';

interface Props {
  summary: PortfolioSummaryDto;
}

interface CdiResponse {
  accumulated_pct: string;
  period: string;
  as_of: string;
}

function calcPortfolioReturn(summary: PortfolioSummaryDto): {
  returnPct: string;
  totalPL: string;
  totalInvested: string;
} | null {
  let totalInvested = new Decimal(0);
  let totalPL = new Decimal(0);

  for (const pos of summary.positions) {
    if (pos.lucro_prejuizo_brl !== null) {
      totalInvested = totalInvested.plus(new Decimal(pos.invested_value));
      totalPL = totalPL.plus(new Decimal(pos.lucro_prejuizo_brl));
    }
  }

  if (totalInvested.isZero()) return null;
  const returnPct = totalPL.div(totalInvested).times(100);
  return {
    returnPct: returnPct.toFixed(2),
    totalPL: totalPL.toString(),
    totalInvested: totalInvested.toString(),
  };
}

interface ReturnCardProps {
  label: string;
  value?: string;
  note?: string;
  comingSoon?: boolean;
  loading?: boolean;
}

function ReturnCard({ label, value, note, comingSoon, loading }: ReturnCardProps) {
  const num = value ? parseFloat(value) : 0;
  const isPositive = num > 0;
  const isNegative = num < 0;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm text-on-surface-variant">{label}</p>
        {comingSoon && (
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-on-surface-variant">
            Em breve
          </span>
        )}
      </div>
      {loading ? (
        <div className="mt-2 h-8 w-24 animate-pulse rounded bg-surface-muted" />
      ) : comingSoon ? (
        <div className="mt-2">
          <p className="text-2xl font-bold text-on-surface-variant">—</p>
          <p className="mt-1 text-xs text-on-surface-variant">Disponível no gráfico abaixo</p>
        </div>
      ) : (
        <p
          className={`mt-2 font-mono text-2xl font-bold ${
            isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-on-surface'
          }`}
        >
          {isPositive ? '+' : ''}
          {value?.replace('.', ',')}%
        </p>
      )}
      {note && <p className="mt-1 text-xs text-on-surface-variant">{note}</p>}
    </div>
  );
}

export function RentabilidadePanel({ summary }: Props) {
  const portfolioData = calcPortfolioReturn(summary);

  const { data: cdiData, isLoading: cdiLoading } = useQuery<CdiResponse>({
    queryKey: ['market', 'cdi', '1Y'],
    queryFn: async () => {
      const res = await fetch('/api/market/cdi?period=1Y');
      if (!res.ok) throw new Error('CDI indisponível');
      return res.json();
    },
    staleTime: 30 * 60 * 1000,
    retry: 2,
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ReturnCard
          label="Sua Carteira"
          value={portfolioData?.returnPct ?? '0.00'}
          note="Retorno total sobre capital investido"
        />
        <ReturnCard
          label="CDI"
          value={cdiData?.accumulated_pct}
          note="CDI acumulado no ano (BCB SGS-12)"
          loading={cdiLoading}
        />
        <ReturnCard label="IBOV" comingSoon />
        <ReturnCard label="S&P 500" comingSoon />
      </div>

      {portfolioData && (
        <div className="rounded-lg border border-border bg-surface p-4 text-sm">
          <p className="font-medium">Resumo</p>
          <p className="mt-1 text-on-surface-variant">
            Capital investido:{' '}
            <span className="font-mono text-on-surface">
              R${' '}
              {parseFloat(portfolioData.totalInvested).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}
            </span>
          </p>
          <p className="text-on-surface-variant">
            P/L não realizado:{' '}
            <span
              className={`font-mono ${
                parseFloat(portfolioData.totalPL) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              R${' '}
              {parseFloat(portfolioData.totalPL).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}
            </span>
          </p>
        </div>
      )}

      <div className="border-t border-border pt-6">
        <BenchmarkChartDynamic />
      </div>
    </div>
  );
}
