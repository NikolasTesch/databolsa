import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui/Spinner';

export const WishlistPriceChartDynamic = dynamic(
  () => import('./WishlistPriceChart').then(m => m.WishlistPriceChart),
  { ssr: false, loading: () => <div className="flex h-[200px] items-center justify-center"><Spinner /></div> },
);
