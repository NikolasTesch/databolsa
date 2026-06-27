'use client';

import Link from 'next/link';

interface BannerReadOnlyProps {
  targetUserEmail: string;
}

export function BannerReadOnly({ targetUserEmail }: BannerReadOnlyProps) {
  return (
    <div className="rounded-xl border border-info bg-info/10 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-info">
          Visualizando carteira de <strong>{targetUserEmail}</strong> (Apenas Leitura)
        </p>
        <Link
          href="/portfolio"
          className="ml-4 shrink-0 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-muted"
        >
          Voltar à minha carteira
        </Link>
      </div>
    </div>
  );
}
