import type { Metadata } from 'next';
import { CurrencyConverter } from '@/components/market/CurrencyConverter';
import { CryptoConverter } from '@/components/market/CryptoConverter';
import { IndexAnalysisPanel } from '@/components/market/IndexAnalysisPanel';

export const metadata: Metadata = {
  title: 'Ferramentas Financeiras | DataBolsa',
  description:
    'Converta moedas (USD, EUR, GBP para BRL), converta criptoativos (BTC, ETH, SOL) e analise os índices IBOV e IFIX com médias históricas curadas.',
  openGraph: {
    title: 'Ferramentas Financeiras | DataBolsa',
    description:
      'Conversor de câmbio, conversor de cripto e análise de índices do mercado brasileiro.',
    url: 'https://databolsa.com.br/ferramentas',
  },
};

export default function FerramentasPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-content">Ferramentas Financeiras</h1>
        <p className="text-content-muted mt-2">
          Conversores e análises para apoiar suas decisões de investimento.
        </p>
      </div>

      <div className="space-y-8">
        {/* Conversor de Moedas e Cripto */}
        <section aria-label="Conversores de moedas e criptoativos">
          <h2 className="text-lg font-semibold text-content mb-4">Conversores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CurrencyConverter />
            <CryptoConverter />
          </div>
        </section>

        {/* Análise de Índices */}
        <section aria-label="Análise de índices do mercado">
          <h2 className="text-lg font-semibold text-content mb-4">Análise de Índices</h2>
          <IndexAnalysisPanel />
        </section>
      </div>
    </div>
  );
}
