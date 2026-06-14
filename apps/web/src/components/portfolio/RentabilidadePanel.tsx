'use client';

import { Decimal } from 'decimal.js';
import type { PortfolioSummaryDto } from '@/types/api';

interface Props {
  summary: PortfolioSummaryDto;
}

const CDI_ANNUAL_RATE = 10.5; // % ao ano — estimativa

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

function calcCDI(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const daysPassed = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const fraction = daysPassed / 365;
  return (CDI_ANNUAL_RATE * fraction).toFixed(2);
}

interface ReturnCardProps {
  label: string;
  value?: string;
  note?: string;
  comingSoon?: boolean;
}

function ReturnCard({ label, value, note, comingSoon }: ReturnCardProps) {
  const num = value ? parseFloat(value) : 0;
  const isPositive = num > 0;
  const isNegative = num < 0;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm text-content-muted">{label}</p>
        {comingSoon && (
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-content-muted">
            Em breve
          </span>
        )}
      </div>
      {comingSoon ? (
        <p className="mt-2 text-2xl font-bold text-content-muted">—</p>
      ) : (
        <p
          className={`mt-2 font-mono text-2xl font-bold ${
            isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-content'
          }`}
        >
          {isPositive ? '+' : ''}
          {value?.replace('.', ',')}%
        </p>
      )}
      {note && <p className="mt-1 text-xs text-content-muted">{note}</p>}
    </div>
  );
}

export function RentabilidadePanel({ summary }: Props) {
  const portfolioData = calcPortfolioReturn(summary);
  const cdiEstimado = calcCDI();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ReturnCard
          label="Sua Carteira"
          value={portfolioData?.returnPct ?? '0.00'}
          note="Retorno total sobre capital investido"
        />
        <ReturnCard
          label="CDI (estimado)"
          value={cdiEstimado}
          note={`Base: ${CDI_ANNUAL_RATE}% a.a. × fração do ano`}
        />
        <ReturnCard label="IBOV" comingSoon />
        <ReturnCard label="S&P 500" comingSoon />
      </div>

      {portfolioData && (
        <div className="rounded-lg border border-border bg-surface p-4 text-sm">
          <p className="font-medium">Resumo</p>
          <p className="mt-1 text-content-muted">
            Capital investido:{' '}
            <span className="font-mono text-content">
              R${' '}
              {parseFloat(portfolioData.totalInvested).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}
            </span>
          </p>
          <p className="text-content-muted">
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

      <p className="text-xs text-content-muted">
        * CDI estimado com base em {CDI_ANNUAL_RATE}% a.a. — valores aproximados. IBOV e S&P 500
        requerem dados históricos de mercado (em desenvolvimento).
      </p>
    </div>
  );
}
