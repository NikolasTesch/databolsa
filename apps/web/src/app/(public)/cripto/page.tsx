import type { Metadata } from 'next';
import { getCryptoOverview } from '@/lib/market/crypto-overview';
import { fetchCryptoNews } from '@/lib/news/news.service';
import { B3_COURSES } from '@/lib/courses-data';
import CriptoClient from './client';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Mercado Cripto | DataBolsa',
  description:
    'Acompanhe Bitcoin, Ethereum, Solana e outras criptomoedas. Preços, variações, volume e notícias do mercado cripto.',
};

export default async function CriptoPage() {
  const [overview, news] = await Promise.all([
    getCryptoOverview(),
    fetchCryptoNews(),
  ]);

  const cryptoCourses = B3_COURSES.filter(
    (c) => c.category === 'Criptomoedas',
  );

  return (
    <CriptoClient
      overview={overview}
      news={news}
      cryptoCourses={cryptoCourses}
    />
  );
}
