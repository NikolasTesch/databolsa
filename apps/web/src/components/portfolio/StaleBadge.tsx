import { Tooltip } from '@/components/ui/Tooltip';

interface StaleBadgeProps {
  className?: string;
}

export function StaleBadge({ className }: StaleBadgeProps) {
  return (
    <Tooltip content="cotação desatualizada" className={className}>
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-stale-surface text-stale text-xs font-bold"
        aria-label="Cotação desatualizada"
        data-testid="stale-badge"
      >
        !
      </span>
    </Tooltip>
  );
}
