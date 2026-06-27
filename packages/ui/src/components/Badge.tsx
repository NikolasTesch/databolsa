import { type HTMLAttributes } from 'react';
import { cn } from './cn';

type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default: 'bg-surface-muted text-on-surface-variant',
    success: 'bg-profit-surface text-profit-content',
    danger: 'bg-loss-surface text-loss-content',
    warning: 'bg-stale-surface text-stale-content',
    info: 'bg-navy-50 text-navy-700',
    neutral: 'bg-neutral-100 text-neutral-600',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
