import type { Metadata } from 'next';
import { getDividendsAgenda } from '@/lib/market/dividends-agenda';
import { fetchDividendsNews } from '@/lib/news/news.service';
import { DividendosClient } from './client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dividendos e Proventos | DataBolsa',
  description:
    'Acompanhe a agenda completa de dividendos, JCP e proventos de ações e FIIs listados na B3. Filtre por ativo, confira datas, valores e rendimentos.',
};

export default async function DividendosPage() {
  const [agenda, { articles }] = await Promise.all([
    getDividendsAgenda(),
    fetchDividendsNews(),
  ]);

  return <DividendosClient agenda={agenda} news={articles} />;
}
