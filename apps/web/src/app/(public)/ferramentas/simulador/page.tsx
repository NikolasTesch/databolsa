import type { Metadata } from 'next';
import SimuladorCarteira from '@/components/tools/SimuladorCarteira';

export const metadata: Metadata = {
  title: 'Simulador de Carteira | DataBolsa',
  description:
    'Simule a alocação da sua carteira de investimentos. Adicione ativos, veja a distribuição percentual e o valor total investido.',
};

export default function SimuladorPage() {
  return (
    <div className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-10">
      <div className="flex items-start gap-4 mb-8">
        <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-[32px] text-primary">pie_chart</span>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Simulador de Carteira</h1>
          <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
            Monte e simule sua carteira de investimentos. Adicione ativos com quantidade e preço médio,
            visualize a alocação em gráfico e acompanhe o total investido.
          </p>
        </div>
      </div>
      <div className="bg-surface border border-border rounded-xl p-6">
        <SimuladorCarteira />
      </div>
    </div>
  );
}
