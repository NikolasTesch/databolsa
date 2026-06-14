import Link from 'next/link';
import { cn } from '@/components/ui/cn';

interface QuickChipProps {
  label: string;
  href: string;
  className?: string;
}

export function QuickChip({ label, href, className }: QuickChipProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center rounded-full bg-surface-muted px-3 py-1 text-xs text-content-muted',
        'hover:bg-primary hover:text-white transition-colors',
        className,
      )}
    >
      {label}
    </Link>
  );
}
