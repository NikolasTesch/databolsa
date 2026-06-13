import { type HTMLAttributes } from 'react';
import { cn } from './cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ padding = 'md', className, children, ...props }: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface shadow-sm',
        paddings[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
