interface IndicatorCardProps {
  label: string;
  value: string | null;
  tooltip?: string;
}

export function IndicatorCard({ label, value, tooltip }: IndicatorCardProps) {
  const displayValue = value !== null && value !== undefined && value !== '' ? value : '—';

  return (
    <div
      className="bg-surface border border-border rounded-lg p-4 shadow-sm"
      title={tooltip}
    >
      <p className="text-xs text-on-surface-variant uppercase tracking-wide font-sans mb-1">
        {label}
        {tooltip && (
          <span
            className="ml-1 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-surface-muted text-on-surface-variant text-[10px] cursor-help"
            aria-label={tooltip}
          >
            ?
          </span>
        )}
      </p>
      <p
        className={`text-xl font-mono font-semibold ${displayValue === '—' ? 'text-on-surface-variant' : 'text-on-surface'}`}
        data-testid="indicator-value"
      >
        {displayValue}
      </p>
    </div>
  );
}
