/**
 * Wrapper de carregamento dinâmico para BenchmarkChart.
 * Recharts não é SSR-safe — importamos com ssr:false.
 */
import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui/Spinner';

export const BenchmarkChartDynamic = dynamic(
  () => import('./BenchmarkChart').then((m) => m.BenchmarkChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[250px] items-center justify-center">
        <Spinner />
      </div>
    ),
  },
);
