import Link from 'next/link';
import { AssetClassBadge } from '@/components/assets/AssetClassBadge';
import { StaleBadge } from '@/components/portfolio/StaleBadge';
import { TrendBadge } from '@/components/ui/TrendBadge';
import type { AssetClass } from '@/types/api';

interface AssetMiniCardProps {
  ticker: string;
  name: string;
  price: string;
  changePercent: string | null;
  assetClass: AssetClass;
  stale?: boolean;
}

export function AssetMiniCard({
  ticker,
  name,
  price,
  changePercent,
  assetClass,
  stale = false,
}: AssetMiniCardProps) {
  return (
    <Link
      href={`/ativos/${ticker}?class=${assetClass}`}
      className="relative flex flex-col gap-1 rounded-lg border border-border bg-surface p-4 shadow-sm hover:bg-surface-muted hover:shadow-md transition-colors"
    >
      {stale && (
        <span className="absolute top-2 right-2">
          <StaleBadge />
        </span>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <AssetClassBadge assetClass={assetClass} />
          <span className="font-mono text-sm font-semibold text-content truncate">{ticker}</span>
        </div>
        <TrendBadge value={changePercent} />
      </div>

      <p className="text-xs text-content-muted truncate">{name}</p>

      <div className="flex items-baseline gap-1">
        <span className="text-base font-mono font-semibold text-content">{price}</span>
      </div>
    </Link>
  );
}
