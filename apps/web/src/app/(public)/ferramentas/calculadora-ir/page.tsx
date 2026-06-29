import type { Metadata } from 'next';
import IRCalculator from '@/components/tools/IRCalculator';

export const metadata: Metadata = {
  title: 'Calculadora de IR | DataBolsa',
  description:
    'Calcule o imposto de renda sobre operações em bolsa (day trade e swing trade) com alíquotas atualizadas.',
};

export default function IRCalculatorPage() {
  return (
    <div className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-10">
      <div className="flex items-start gap-4 mb-8">
        <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-[32px] text-primary">balance</span>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Calculadora de IR</h1>
          <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
            Calcule o DARF para operações day trade e swing trade na bolsa brasileira.
            Considere isenção para vendas de até R$ 20 mil no mês (ações) e alíquotas de 15% a 20%.
          </p>
        </div>
      </div>
      <div className="bg-surface border border-border rounded-xl p-6">
        <IRCalculator />
      </div>
    </div>
  );
}
