'use client';

import dynamic from 'next/dynamic';
import { useState, type ComponentType } from 'react';

const ToolLoading = () => (
  <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-border bg-surface-muted/30">
    <span className="text-sm text-on-surface-variant">Carregando ferramenta...</span>
  </div>
);

const GrahamAnalysis = dynamic(() => import('@/components/tools/GrahamAnalysis'), {
  loading: ToolLoading,
  ssr: false,
});
const BazinRanking = dynamic(() => import('@/components/tools/BazinRanking'), {
  loading: ToolLoading,
  ssr: false,
});
const CurrencyConverter = dynamic(
  () => import('@/components/tools/CurrencyConverter').then((mod) => mod.CurrencyConverter),
  { loading: ToolLoading, ssr: false },
);
const CryptoConverter = dynamic(
  () => import('@/components/tools/CryptoConverter').then((mod) => mod.CryptoConverter),
  { loading: ToolLoading, ssr: false },
);
const BeginnerGuide = dynamic(() => import('@/components/tools/BeginnerGuide'), {
  loading: ToolLoading,
  ssr: false,
});
const PriceAlerts = dynamic(() => import('@/components/tools/PriceAlerts'), {
  loading: ToolLoading,
  ssr: false,
});
const IRCalculator = dynamic(() => import('@/components/tools/IRCalculator'), {
  loading: ToolLoading,
  ssr: false,
});
const AssetComparator = dynamic(() => import('@/components/tools/AssetComparator'), {
  loading: ToolLoading,
  ssr: false,
});

interface ToolDef {
  id: string;
  icon: string;
  title: string;
  description: string;
  explanation: string;
  Component: ComponentType;
}

const TOOLS: ToolDef[] = [
  {
    id: 'graham',
    icon: 'monitoring',
    title: 'Análise Graham',
    description: 'Calcule o preço-teto segundo a fórmula de Benjamin Graham',
    explanation: 'Benjamin Graham, pai do value investing, criou uma fórmula para estimar o valor intrínseco de uma ação com base no LPA e no VPA. O preço-teto de Graham ajuda a identificar se um ativo está subvalorizado.',
    Component: GrahamAnalysis,
  },
  {
    id: 'bazin',
    icon: 'savings',
    title: 'Ranking Bazin',
    description: 'Calcule o preço-teto segundo a estratégia de dividendos',
    explanation: 'A fórmula de Bazin calcula o preço-teto de um ativo com base nos dividendos pagos nos últimos 12 meses, considerando um rendimento desejado. Ideal para investidores focados em renda passiva.',
    Component: BazinRanking,
  },
  {
    id: 'conversor-moedas',
    icon: 'currency_exchange',
    title: 'Conversor de Moedas',
    description: 'Converta USD, EUR, GBP, ARS e outras para BRL',
    explanation: 'Converta valores entre diversas moedas fiduciárias utilizando taxas de câmbio atualizadas. Útil para investidores com exposição internacional.',
    Component: CurrencyConverter,
  },
  {
    id: 'conversor-cripto',
    icon: 'currency_bitcoin',
    title: 'Conversor de Criptoativos',
    description: 'Converta BTC, ETH, SOL e outras criptomoedas',
    explanation: 'Converta valores entre as principais criptomoedas do mercado e moedas fiduciárias. Cotações em tempo real via CoinGecko.',
    Component: CryptoConverter,
  },
  {
    id: 'guia-iniciante',
    icon: 'school',
    title: 'Guia Iniciante',
    description: 'Perfis de investidor e carteiras recomendadas',
    explanation: 'Descubra seu perfil de investidor (conservador, moderado ou agressivo) e veja sugestões de alocação de carteira para cada perfil, com base nos princípios de diversificação da ANBIMA.',
    Component: BeginnerGuide,
  },
  {
    id: 'alertas',
    icon: 'notifications_active',
    title: 'Central de Alertas',
    description: 'Crie e gerencie alertas de preço para seus ativos',
    explanation: 'Configure notificações para ser avisado quando um ativo atingir determinado preço. Os alertas são avaliados a cada atualização de cotação e notificados no sistema.',
    Component: PriceAlerts,
  },
  {
    id: 'ir-calculator',
    icon: 'balance',
    title: 'Calculadora de IR',
    description: 'Calcule o imposto de renda sobre operações em bolsa',
    explanation: 'Calcule o DARF para operações day trade e swing trade na bolsa brasileira. Considere isenção para vendas de até R$ 20 mil no mês (ações) e alíquotas de 15% a 20%.',
    Component: IRCalculator,
  },
  {
    id: 'comparador',
    icon: 'compare_arrows',
    title: 'Comparador de Ativos',
    description: 'Compare múltiplos indicadores entre ativos lado a lado',
    explanation: 'Selecione até 4 ativos e compare indicadores fundamentalistas como P/L, P/VP, DY, ROE, margem líquida e endividamento. Visualização lado a lado para decisões mais informadas.',
    Component: AssetComparator,
  },
];

export function ToolsPageClient() {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const selected = TOOLS.find((t) => t.id === activeTool);

  if (selected) {
    const SelectedTool = selected.Component;

    return (
      <div className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-10">
        {/* Back button */}
        <button
          onClick={() => setActiveTool(null)}
          className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface transition-colors mb-6"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Todas as ferramentas
        </button>

        {/* Tool header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[32px] text-primary">
              {selected.icon}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">{selected.title}</h1>
            <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">{selected.explanation}</p>
          </div>
        </div>

        {/* Tool interface */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <SelectedTool />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-10">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined text-[32px] text-primary">build</span>
          <h1 className="text-2xl md:text-3xl font-semibold text-on-surface">Ferramentas Financeiras</h1>
        </div>
        <p className="text-on-surface-variant text-sm md:text-base max-w-2xl">
          Ferramentas gratuitas para análise de ativos, conversão de moedas, cálculo de impostos e
          muito mais — tudo em um só lugar.
        </p>
      </div>

      {/* Tool grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className="group glass-panel rounded-lg p-5 text-left transition-all hover:border-outline-variant hover:shadow-sm"
          >
            <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px] text-primary">
                {tool.icon}
              </span>
            </div>
            <h3 className="text-base font-semibold text-on-surface mt-3">{tool.title}</h3>
            <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">{tool.description}</p>
            <span className="text-sm text-primary mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
              Acessar &rarr;
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
