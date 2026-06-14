import { TrendBadge } from '@/components/ui/TrendBadge';
import { cn } from '@/components/ui/cn';

interface IndexCardProps {
  label: string;
  value: string;
  changePercent: string | null;
  stale?: boolean;
  className?: string;
}

export function IndexCard({ label, value, changePercent, stale = false, className }: IndexCardProps) {
  return (
    <div className={cn('flex flex-col gap-0.5 px-4 border-r border-border last:border-r-0', className)}>
      <span className="text-xs font-sans uppercase tracking-wide text-content-muted">{label}</span>
      <span className="flex items-center gap-1">
        <span className="text-sm font-mono font-semibold text-content">{value}</span>
        {stale && (
          <span
            className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-stale-surface text-stale text-xs"
            title="Cotação desatualizada"
            aria-label="Cotação desatualizada"
          >
            !
          </span>
        )}
      </span>
      <TrendBadge value={changePercent} showIcon={false} />
    </div>
  );
}
