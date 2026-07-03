import type { Metadata } from 'next';
import { CalendarClient } from './client';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Calendário de Eventos Corporativos | DataBolsa',
  description:
    'Acompanhe o calendário completo de eventos corporativos: datas ex de dividendos, pagamentos de JCP, divulgação de resultados trimestrais, assembleias de acionistas e desdobramentos de ações.',
};

export default function CalendarPage() {
  return (
    <div className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop pb-12 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="material-symbols-outlined text-[28px] text-primary">calendar_month</span>
        <h1 className="text-xl font-semibold text-on-surface">Calendário de Eventos Corporativos</h1>
      </div>
      <CalendarClient />
    </div>
  );
}
