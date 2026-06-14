/**
 * Wrapper de carregamento dinâmico para ComposicaoPieChart.
 * Recharts não é SSR-safe — importamos com ssr:false.
 */
import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui/Spinner';

export const ComposicaoPieChartDynamic = dynamic(
  () => import('./ComposicaoPieChart').then((m) => m.ComposicaoPieChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[200px] w-[240px] items-center justify-center">
        <Spinner />
      </div>
    ),
  },
);
