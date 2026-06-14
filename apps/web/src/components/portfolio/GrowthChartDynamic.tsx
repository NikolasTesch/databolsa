/**
 * Wrapper de carregamento dinâmico para GrowthChart.
 * Recharts não é SSR-safe — importamos com ssr:false.
 */
import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui/Spinner';

export const GrowthChartDynamic = dynamic(
  () => import('./GrowthChart').then((m) => m.GrowthChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[220px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    ),
  },
);
