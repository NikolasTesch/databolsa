import Link from 'next/link';

interface ToolItem {
  icon: string;
  title: string;
  description: string;
  href: string;
}

const TOOLS: ToolItem[] = [
  {
    icon: 'query_stats',
    title: 'Screener Avançado',
    description: 'Filtre ações e FIIs com 200+ indicadores',
    href: '/ferramentas/screener',
  },
  {
    icon: 'pie_chart',
    title: 'Simulador de Carteira',
    description: 'Teste estratégias de alocação',
    href: '/ferramentas/simulador',
  },
  {
    icon: 'balance',
    title: 'Calculadora de IR',
    description: 'Automatize apuração de lucros/prejuízos',
    href: '/ferramentas/calculadora-ir',
  },
  {
    icon: 'candlestick_chart',
    title: 'Gráficos Interativos',
    description: 'Análise técnica avançada',
    href: '/ferramentas/graficos',
  },
  {
    icon: 'price_change',
    title: 'Comparador de Ações',
    description: 'Compare empresas lado a lado',
    href: '/ferramentas/comparador',
  },
  {
    icon: 'notifications_active',
    title: 'Central de Alertas',
    description: 'Notificações de preço-alvo',
    href: '/ferramentas/alertas',
  },
];

export default function ToolsSection() {
  return (
    <section className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-12">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-on-surface">Ferramentas Analíticas</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Tudo que você precisa para analisar e gerenciar seus investimentos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOOLS.map((tool) => (
          <Link
            key={tool.title}
            href={tool.href}
            className="group flex flex-col rounded-lg border border-border bg-surface p-5 hover:border-primary/30 transition-colors"
          >
            <span className="material-symbols-outlined text-[28px] text-primary">
              {tool.icon}
            </span>
            <h3 className="text-base font-semibold text-on-surface mt-3">
              {tool.title}
            </h3>
            <p className="text-sm text-on-surface-variant mt-1 flex-1">
              {tool.description}
            </p>
            <span className="text-sm text-primary mt-3 inline-flex items-center gap-1">
              Acessar &rarr;
            </span>
          </Link>
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <Link
          href="/ferramentas"
          className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-lg">grid_view</span>
          Ver todas as ferramentas
        </Link>
      </div>
    </section>
  );
}
