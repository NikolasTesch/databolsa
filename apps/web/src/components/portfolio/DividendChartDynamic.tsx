import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui/Spinner';

export const DividendChartDynamic = dynamic(
  () => import('./DividendChart').then(m => m.DividendChart),
  { ssr: false, loading: () => <div className="flex h-[250px] items-center justify-center"><Spinner /></div> },
);
