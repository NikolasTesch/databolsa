import type { Metadata } from 'next';
import ScreenerAvaliador from '@/components/tools/ScreenerAvaliador';

export const metadata: Metadata = {
  title: 'Screener Avançado | DataBolsa',
  description:
    'Filtre ações, FIIs, ETFs, BDRs e criptomoedas por performance de mercado. Screener completo com dados em tempo real.',
};

export default function ScreenerPage() {
  return (
    <div className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-10">
      <div className="flex items-start gap-4 mb-8">
        <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-[32px] text-primary">query_stats</span>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Screener Avançado</h1>
          <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
            Filtre e encontre ativos por classe, preço e variação. Dados atualizados em tempo real
            para ações, FIIs, ETFs, BDRs e criptomoedas.
          </p>
        </div>
      </div>
      <div className="bg-surface border border-border rounded-xl p-6">
        <ScreenerAvaliador />
      </div>
    </div>
  );
}
