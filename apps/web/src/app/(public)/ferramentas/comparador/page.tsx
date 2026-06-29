import type { Metadata } from 'next';
import AssetComparator from '@/components/tools/AssetComparator';

export const metadata: Metadata = {
  title: 'Comparador de Ativos | DataBolsa',
  description:
    'Compare indicadores fundamentalistas como P/L, P/VP, DY, ROE entre até 4 ativos lado a lado.',
};

export default function ComparadorPage() {
  return (
    <div className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-10">
      <div className="flex items-start gap-4 mb-8">
        <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-[32px] text-primary">compare_arrows</span>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Comparador de Ativos</h1>
          <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
            Selecione até 4 ativos e compare indicadores fundamentalistas como P/L, P/VP, DY, ROE,
            margem líquida e endividamento lado a lado.
          </p>
        </div>
      </div>
      <div className="bg-surface border border-border rounded-xl p-6">
        <AssetComparator />
      </div>
    </div>
  );
}
