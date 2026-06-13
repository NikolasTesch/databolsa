/**
 * Wrapper de carregamento dinâmico para AllocationChart.
 * Recharts não é SSR-safe — importamos com ssr:false.
 */
import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui/Spinner';

export const AllocationChartDynamic = dynamic(
  () => import('./AllocationChart').then((m) => m.AllocationChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    ),
  },
);
