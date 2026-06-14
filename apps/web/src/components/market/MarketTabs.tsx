'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/components/ui/cn';
import type { AssetClass } from '@/types/api';

const TABS: Array<{ label: string; type: AssetClass }> = [
  { label: 'Ações', type: 'STOCK_BR' },
  { label: 'FIIs', type: 'FII' },
  { label: 'ETFs', type: 'ETF' },
  { label: 'BDRs', type: 'BDR' },
  { label: 'Crypto', type: 'CRYPTO' },
  { label: 'Stocks US', type: 'STOCK_US' },
];

interface MarketTabsProps {
  activeType: AssetClass;
  onTabChange?: (type: AssetClass) => void;
}

export function MarketTabs({ activeType, onTabChange }: MarketTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTabChange = (type: AssetClass) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', type);
    router.push(`/?${params.toString()}`, { scroll: false });
    onTabChange?.(type);
  };

  return (
    <div
      role="tablist"
      aria-label="Classe de ativo"
      className="flex gap-0 border-b border-border overflow-x-auto"
    >
      {TABS.map((tab) => {
        const isActive = activeType === tab.type;
        return (
          <button
            key={tab.type}
            role="tab"
            aria-selected={isActive}
            onClick={() => handleTabChange(tab.type)}
            className={cn(
              'flex-shrink-0 px-4 py-2 text-sm font-sans border-b-2 transition-colors',
              isActive
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-content-muted hover:text-content',
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
