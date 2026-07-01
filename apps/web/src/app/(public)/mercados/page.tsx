import type { Metadata } from 'next';
import { MercadosClient } from './client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mercado | DataBolsa',
  description:
    'Acompanhe o mercado em tempo real: ações, FIIs, BDRs, ETFs, criptomoedas e stocks americanos com cotações e variações.',
};

export default function MercadosPage() {
  return <MercadosClient />;
}
