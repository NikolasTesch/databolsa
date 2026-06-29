import type { Metadata } from 'next';
import PriceAlerts from '@/components/tools/PriceAlerts';

export const metadata: Metadata = {
  title: 'Central de Alertas | DataBolsa',
  description:
    'Crie e gerencie alertas de preço para seus ativos. Seja notificado quando um ativo atingir o preço-alvo.',
};

export default function AlertasPage() {
  return (
    <div className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-10">
      <div className="flex items-start gap-4 mb-8">
        <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-[32px] text-primary">notifications_active</span>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Central de Alertas</h1>
          <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
            Configure notificações para ser avisado quando um ativo atingir determinado preço.
            Os alertas são avaliados a cada atualização de cotação.
          </p>
        </div>
      </div>
      <div className="bg-surface border border-border rounded-xl p-6">
        <PriceAlerts />
      </div>
    </div>
  );
}
