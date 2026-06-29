import type { Metadata } from 'next';
import InteractiveCharts from '@/components/tools/InteractiveCharts';

export const metadata: Metadata = {
  title: 'Gráficos Interativos | DataBolsa',
  description:
    'Visualize gráficos de preços de ativos com histórico detalhado. Análise técnica interativa para ações, FIIs e criptomoedas.',
};

export default function GraficosPage() {
  return (
    <div className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-10">
      <div className="flex items-start gap-4 mb-8">
        <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-[32px] text-primary">candlestick_chart</span>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Gráficos Interativos</h1>
          <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
            Visualize o histórico de preços de qualquer ativo com gráficos interativos.
            Acompanhe máximas, mínimas e variação ao longo do tempo.
          </p>
        </div>
      </div>
      <div className="bg-surface border border-border rounded-xl p-6">
        <InteractiveCharts />
      </div>
    </div>
  );
}
