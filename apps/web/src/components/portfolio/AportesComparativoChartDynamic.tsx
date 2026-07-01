/**
 * Wrapper de carregamento dinâmico para AportesComparativoChart.
 * Recharts não é SSR-safe — importamos com ssr:false.
 */
import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui/Spinner';

export const AportesComparativoChartDynamic = dynamic(
  () => import('./AportesComparativoChart').then((m) => m.AportesComparativoChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[250px] items-center justify-center">
        <Spinner />
      </div>
    ),
  },
);
