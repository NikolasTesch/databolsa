import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from './cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60';

    const variants = {
      primary: 'bg-primary text-white hover:bg-primary-hover',
      secondary: 'border border-border bg-surface text-content hover:bg-surface-muted',
      ghost: 'text-content-muted hover:bg-surface-muted hover:text-content',
      danger: 'bg-danger text-white hover:opacity-90',
    };

    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Spinner size="sm" />
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

function Spinner({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  return (
    <svg
      className={cn('animate-spin', s)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
