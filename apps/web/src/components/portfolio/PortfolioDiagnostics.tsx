'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@/components/ui/cn';
import type { PortfolioSummaryDto, Asset } from '@/types/api';
import { Decimal } from 'decimal.js';

interface PortfolioDiagnosticsProps {
  summary: PortfolioSummaryDto;
  assets: Asset[];
}

interface PositionAlert {
  ticker: string;
  alerts: string[];
}

export default function PortfolioDiagnostics({ summary, assets }: PortfolioDiagnosticsProps) {
  const positions = summary.positions ?? [];

  const totalValue = useMemo(() => {
    return positions.reduce((sum, p) => sum.plus(new Decimal(p.valor_atual_brl || '0')), new Decimal(0));
  }, [positions]);

  const staleCount = useMemo(() => positions.filter((p) => p.is_stale).length, [positions]);
  const maxAllocation = useMemo(() => {
    if (positions.length === 0) return new Decimal(0);
    return Decimal.max(...positions.map((p) => new Decimal(p.alocacao_pct || '0')));
  }, [positions]);

  const alertsByPosition: PositionAlert[] = useMemo(() => {
    return positions
      .map((p) => {
        const alerts: string[] = [];
        const alloc = new Decimal(p.alocacao_pct || '0');
        const pl = new Decimal(p.lucro_prejuizo_pct || '0');

        if (alloc.greaterThan(25)) {
          alerts.push(`Alocacao de ${alloc.toFixed(1)}% ultrapassa 25% — atencao a concentracao.`);
        }
        if (p.is_stale) {
          alerts.push('Cotacao desatualizada — ultimo dado pode nao refletir o valor atual.');
        }
        if (pl.isNegative() && pl.abs().greaterThan(10)) {
          alerts.push(`P/L negativo relevante de ${pl.toFixed(1)}% — revisar posicao.`);
        }
        if (!p.current_price_brl || p.current_price_brl === '0') {
          alerts.push('Sem preco atual disponivel para esta posicao.');
        }

        return { ticker: p.ticker, alerts };
      })
      .filter((p) => p.alerts.length > 0);
  }, [positions]);

  const ranking = useMemo(() => {
    if (positions.length === 0) return null;

    const sortedByReturn = [...positions].sort(
      (a, b) => new Decimal(b.lucro_prejuizo_brl || '0').minus(new Decimal(a.lucro_prejuizo_brl || '0')).toNumber(),
    );
    const sortedByLoss = [...positions].sort(
      (a, b) => new Decimal(a.lucro_prejuizo_brl || '0').minus(new Decimal(b.lucro_prejuizo_brl || '0')).toNumber(),
    );
    const sortedByWeight = [...positions].sort(
      (a, b) => new Decimal(b.alocacao_pct || '0').minus(new Decimal(a.alocacao_pct || '0')).toNumber(),
    );

    return {
      bestReturn: sortedByReturn[0],
      worstLoss: sortedByLoss[0],
      biggestWeight: sortedByWeight[0],
    };
  }, [positions]);

  if (positions.length === 0 || totalValue.isZero()) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-3">monitoring</span>
        <p className="text-sm text-on-surface-variant">
          Carteira sem posicoes ou patrimonio zero. Adicione operacoes para ver o diagnostico.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          icon="warning"
          label="Pontos de atencao"
          value={String(alertsByPosition.reduce((sum, p) => sum + p.alerts.length, 0))}
        />
        <SummaryCard
          icon="pie_chart"
          label="Posicoes analisadas"
          value={String(positions.length)}
        />
        <SummaryCard
          icon="schedule"
          label="Cotacoes desatualizadas"
          value={String(staleCount)}
          highlight={staleCount > 0}
        />
        <SummaryCard
          icon="concentration_sphere"
          label="Maior concentracao"
          value={`${maxAllocation.toFixed(1)}%`}
          highlight={maxAllocation.greaterThan(25)}
        />
      </div>

      {/* Alerts */}
      {alertsByPosition.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-on-surface mb-3">Alertas por Ativo</h3>
          <div className="space-y-3">
            {alertsByPosition.map(({ ticker, alerts }) => (
              <div key={ticker} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center justify-between mb-2">
                  <Link
                    href={`/ativos/${ticker}`}
                    className="font-mono text-sm font-bold text-primary hover:underline"
                  >
                    {ticker}
                  </Link>
                </div>
                <ul className="space-y-1">
                  {alerts.map((alert, i) => (
                    <li key={i} className="text-sm text-on-surface-variant flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-amber-500 mt-0.5" aria-hidden="true">
                        info
                      </span>
                      {alert}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ranking */}
      {ranking && (
        <section>
          <h3 className="text-sm font-semibold text-on-surface mb-3">Ranking Interno</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RankingCard
              title="Maior Retorno"
              ticker={ranking.bestReturn.ticker}
              value={`R$ ${new Decimal(ranking.bestReturn.lucro_prejuizo_brl || '0').toFixed(2)}`}
              color="text-profit"
            />
            <RankingCard
              title="Maior Perda"
              ticker={ranking.worstLoss.ticker}
              value={`R$ ${new Decimal(ranking.worstLoss.lucro_prejuizo_brl || '0').toFixed(2)}`}
              color="text-loss"
            />
            <RankingCard
              title="Maior Peso"
              ticker={ranking.biggestWeight.ticker}
              value={`${new Decimal(ranking.biggestWeight.alocacao_pct || '0').toFixed(1)}%`}
              color="text-on-surface"
            />
          </div>
        </section>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function SummaryCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn('rounded-lg border bg-surface p-4', highlight ? 'border-amber-500/30' : 'border-border')}>
      <div className="flex items-center gap-2 mb-1">
        <span className={cn('material-symbols-outlined text-lg', highlight ? 'text-amber-500' : 'text-on-surface-variant')}>
          {icon}
        </span>
        <span className="text-xs text-on-surface-variant">{label}</span>
      </div>
      <p className={cn('font-mono text-lg font-bold tabular-nums', highlight ? 'text-amber-500' : 'text-on-surface')}>
        {value}
      </p>
    </div>
  );
}

function RankingCard({
  title,
  ticker,
  value,
  color,
}: {
  title: string;
  ticker: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <span className="text-xs text-on-surface-variant">{title}</span>
      <div className="mt-1 flex items-center justify-between">
        <Link href={`/ativos/${ticker}`} className="font-mono text-sm font-bold text-primary hover:underline">
          {ticker}
        </Link>
        <span className={cn('font-mono text-sm font-semibold tabular-nums', color)}>{value}</span>
      </div>
    </div>
  );
}
