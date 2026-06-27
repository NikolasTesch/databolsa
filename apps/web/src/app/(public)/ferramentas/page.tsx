import type { Metadata } from 'next';
import { ToolsPageClient } from './client';

export const metadata: Metadata = {
  title: 'Ferramentas Financeiras | DataBolsa',
  description:
    'Ferramentas gratuitas para investidores: análise Graham, ranking Bazin, conversores, calculadora de IR, alertas de preço, comparador de ativos e guia iniciante.',
};

export default function FerramentasPage() {
  return <ToolsPageClient />;
}
