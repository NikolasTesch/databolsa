'use client';

import { useRouter } from 'next/navigation';
import type { AssetClass } from '@/types/api';

interface AddToPortfolioButtonProps {
  ticker: string;
  assetClass: AssetClass;
}

function isLoggedIn(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim().startsWith('access_token='));
}

export function AddToPortfolioButton({ ticker, assetClass }: AddToPortfolioButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    const destination = `/assets/new?ticker=${ticker}&assetClass=${assetClass}`;

    if (isLoggedIn()) {
      router.push(destination);
    } else {
      router.push(`/login?next=${encodeURIComponent(destination)}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      data-testid="add-to-portfolio-btn"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      Adicionar à carteira
    </button>
  );
}
