'use client';

import { cn } from './cn';

interface TrendBadgeProps {
  value: string | null;
  showIcon?: boolean;
  className?: string;
}

function IconTrendingUp() {
  return (
    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function IconTrendingDown() {
  return (
    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
  );
}

function IconMinus() {
  return (
    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  );
}

export function TrendBadge({ value, showIcon = true, className }: TrendBadgeProps) {
  if (value === null || value === undefined) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-0.5 text-xs font-mono font-medium text-on-surface-variant',
          className,
        )}
      >
        {showIcon && <IconMinus />}
        <span>—</span>
      </span>
    );
  }

  const numeric = parseFloat(value.replace(',', '.'));
  const isPositive = numeric > 0;
  const isNegative = numeric < 0;

  const colorClass = isPositive
    ? 'text-profit'
    : isNegative
      ? 'text-loss'
      : 'text-on-surface-variant';

  const displayValue =
    value.startsWith('-') || value.startsWith('+')
      ? value
      : isPositive
        ? `+${value}`
        : value;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-mono font-medium',
        colorClass,
        className,
      )}
    >
      {showIcon && isPositive && <IconTrendingUp />}
      {showIcon && isNegative && <IconTrendingDown />}
      {showIcon && !isPositive && !isNegative && <IconMinus />}
      <span>{displayValue}%</span>
    </span>
  );
}
