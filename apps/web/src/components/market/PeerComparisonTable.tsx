import type { PeerComparisonItem } from '@/lib/analysis/asset-analysis.types';
import { cn } from '@/components/ui/cn';
import Link from 'next/link';

interface PeerComparisonTableProps {
  peers: PeerComparisonItem[];
}

function formatIndicator(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '' || value === 'NaN') return '-';
  return value;
}

export function PeerComparisonTable({ peers }: PeerComparisonTableProps) {
  if (peers.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-center">
        <span className="material-symbols-outlined text-[2.5rem] text-on-surface-variant/40 mb-2" aria-hidden="true">
          compare_arrows
        </span>
        <p className="text-sm text-on-surface-variant">Sem pares comparaveis disponiveis.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-muted text-xs text-on-surface-variant uppercase tracking-wide">
            <th className="px-4 py-3 text-left font-medium">Ticker</th>
            <th className="px-4 py-3 text-right font-medium">Score</th>
            <th className="px-4 py-3 text-right font-medium">P/L</th>
            <th className="px-4 py-3 text-right font-medium">P/VP</th>
            <th className="px-4 py-3 text-right font-medium">DY</th>
            <th className="px-4 py-3 text-right font-medium">ROE</th>
            <th className="px-4 py-3 text-right font-medium">Liquidez</th>
            <th className="px-4 py-3 text-center font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {peers.map((peer) => {
            const scoreNum = Number(peer.totalScore);
            const isScorePositive = scoreNum >= 70;
            const isScoreNeutral = scoreNum >= 45 && scoreNum < 70;

            return (
              <tr
                key={peer.ticker}
                className="border-b border-border/50 last:border-b-0 hover:bg-surface-muted/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/ativos/${peer.ticker}`}
                    className="font-mono text-sm font-semibold text-primary hover:underline"
                  >
                    {peer.ticker}
                  </Link>
                  {peer.name && peer.name !== peer.ticker && (
                    <span className="ml-2 text-xs text-on-surface-variant">{peer.name}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={cn(
                      'font-mono text-sm font-medium',
                      isScorePositive ? 'text-profit' : isScoreNeutral ? 'text-neutralChange' : 'text-loss',
                    )}
                  >
                    {peer.totalScore}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm text-on-surface tabular-nums">
                  {formatIndicator(peer.indicators.pe)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm text-on-surface tabular-nums">
                  {formatIndicator(peer.indicators.pb)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm text-on-surface tabular-nums">
                  {formatIndicator(peer.indicators.dy)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm text-on-surface tabular-nums">
                  {formatIndicator(peer.indicators.roe)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm text-on-surface tabular-nums">
                  {formatIndicator(peer.indicators.dailyLiquidity)}
                </td>
                <td className="px-4 py-3 text-center">
                  {peer.stale ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-stale">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      Desatualizado
                    </span>
                  ) : (
                    <span className="text-xs text-on-surface-variant">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
