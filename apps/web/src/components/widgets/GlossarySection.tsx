interface GlossaryTerm {
  term: string;
  definition: string;
}

const TERMS: GlossaryTerm[] = [
  {
    term: 'P/L (Preço/Lucro)',
    definition:
      'Razão entre o preço atual de uma ação e o lucro líquido por ação. Indica quanto o mercado está disposto a pagar pelos lucros da empresa.',
  },
  {
    term: 'DY (Dividend Yield)',
    definition:
      'Rendimento por dividendos em relação ao preço do ativo. Mede o retorno em proventos que o investidor recebe pelo seu capital investido.',
  },
  {
    term: 'P/VP (Preço/Valor Patrimonial)',
    definition:
      'Relação entre o preço da ação e o valor patrimonial por ação. Ajuda a identificar se o ativo está sendo negociado acima ou abaixo do seu valor contábil.',
  },
  {
    term: 'Vacância',
    definition:
      'Percentual de área não locada em relação à área total de um fundo imobiliário (FII). Quanto menor a vacância, melhor a ocupação do imóvel.',
  },
  {
    term: 'Mkt Cap (Valor de Mercado)',
    definition:
      'Valor total de mercado da empresa, calculado pela multiplicação do preço da ação pelo número total de ações em circulação.',
  },
  {
    term: 'P/E (Price to Earnings)',
    definition:
      'Termo inglês para P/L, usado globalmente para medir a avaliação de uma empresa em relação ao seu lucro.',
  },
];

export default function GlossarySection() {
  return (
    <section className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-12">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-[24px] text-on-surface-variant">
          menu_book
        </span>
        <h2 className="text-xl font-semibold text-on-surface">
          Glossário de Indicadores
        </h2>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TERMS.map((item) => (
          <details
            key={item.term}
            className="bg-surface border border-border rounded-lg p-5 group"
          >
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <span className="text-base font-semibold text-on-surface">
                {item.term}
              </span>
              <span className="material-symbols-outlined text-on-surface-variant transition-transform group-open:rotate-180 flex-shrink-0 ml-2">
                expand_more
              </span>
            </summary>
            <p className="text-sm text-on-surface-variant mt-3">
              {item.definition}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
