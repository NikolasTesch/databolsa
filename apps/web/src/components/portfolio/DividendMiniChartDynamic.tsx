/**
 * Wrapper de carregamento dinâmico para DividendMiniChart.
 * Recharts não é SSR-safe — importamos com ssr:false.
 */
import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui/Spinner';

export const DividendMiniChartDynamic = dynamic(
  () => import('./DividendMiniChart').then((m) => m.DividendMiniChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[200px] items-center justify-center">
        <Spinner />
      </div>
    ),
  },
);
