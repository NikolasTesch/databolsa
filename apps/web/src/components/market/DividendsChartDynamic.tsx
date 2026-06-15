import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';

// Importação dinâmica para não bloquear SSR
const DividendsChart = dynamic(
  () => import('./DividendsChart').then((m) => m.DividendsChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[200px] text-content-muted text-sm animate-pulse border border-dashed border-border rounded-lg bg-surface-muted/30">
        Carregando gráfico de proventos...
      </div>
    ),
  },
);

export { DividendsChart };
export type { ComponentProps };
