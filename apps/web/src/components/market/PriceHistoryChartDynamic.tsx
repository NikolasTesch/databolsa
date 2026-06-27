import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type { PriceHistoryChart as PriceHistoryChartType } from './PriceHistoryChart';

// Importação dinâmica para não bloquear SSR (REQ-10)
const PriceHistoryChart = dynamic(
  () => import('./PriceHistoryChart').then((m) => m.PriceHistoryChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[280px] text-on-surface-variant text-sm animate-pulse">
        Carregando gráfico...
      </div>
    ),
  },
);

export { PriceHistoryChart };
export type { ComponentProps };
