import type { Metadata } from 'next';
import AdvancedComparator from '@/components/tools/AdvancedComparator';

export const metadata: Metadata = {
  title: 'Comparador Avançado de Ativos | DataBolsa',
  description:
    'Compare até 6 ativos lado a lado com indicadores fundamentalistas, score, dividendos e histórico de preços normalizado. Exporte dados para CSV.',
};

export default function ComparadorAvancadoPage() {
  return (
    <div className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-10">
      <div className="flex items-start gap-4 mb-8">
        <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-[32px] text-primary">compare_arrows</span>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Comparador Avançado de Ativos</h1>
          <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
            Compare até 6 ativos lado a lado com indicadores fundamentalistas, score de análise,
            dividendos e histórico de preços normalizado. Exporte os dados para CSV.
          </p>
        </div>
      </div>
      <div className="bg-surface border border-border rounded-xl p-6">
        <AdvancedComparator />
      </div>
    </div>
  );
}
