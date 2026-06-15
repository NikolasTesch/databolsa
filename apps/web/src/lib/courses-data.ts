// Cursos curados da B3 Educação — última revisão: 2026-06-15
// Para atualizar: verificar os links em https://edu.b3.com.br e ajustar url + campos.

export interface B3Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: 'Iniciante' | 'Intermediário' | 'Avançado';
  category: string;
  url: string;
}

export const B3_COURSES: B3Course[] = [
  {
    id: 'primeiros-passos-renda-variavel',
    title: 'Primeiros Passos na Renda Variável',
    description: 'Entenda o que é renda variável, como funciona a bolsa de valores e dê os primeiros passos na sua jornada como investidor.',
    duration: '2h',
    level: 'Iniciante',
    category: 'Renda Variável',
    url: 'https://edu.b3.com.br/cursos/primeiros-passos-renda-variavel',
  },
  {
    id: 'como-investir-acoes',
    title: 'Como Investir em Ações',
    description: 'Aprenda a analisar e selecionar ações, entenda os direitos dos acionistas e como funciona a distribuição de dividendos.',
    duration: '3h',
    level: 'Iniciante',
    category: 'Renda Variável',
    url: 'https://edu.b3.com.br/cursos/como-investir-acoes',
  },
  {
    id: 'fundos-imobiliarios',
    title: 'Fundos Imobiliários (FIIs)',
    description: 'Descubra como investir no mercado imobiliário por meio dos FIIs, entenda os tipos de fundos e como avaliar o yield.',
    duration: '2h30',
    level: 'Iniciante',
    category: 'Fundos',
    url: 'https://edu.b3.com.br/cursos/fundos-imobiliarios',
  },
  {
    id: 'analise-fundamentalista',
    title: 'Análise Fundamentalista',
    description: 'Aprenda a ler demonstrativos financeiros, calcular múltiplos de valuation (P/L, P/VP, EV/EBITDA) e identificar empresas de qualidade.',
    duration: '4h',
    level: 'Intermediário',
    category: 'Renda Variável',
    url: 'https://edu.b3.com.br/cursos/analise-fundamentalista',
  },
  {
    id: 'etfs-e-bdrs',
    title: 'ETFs e BDRs: Diversificação Global',
    description: 'Como investir em índices globais e ações internacionais via ETFs e BDRs listados na B3, com custos baixos e diversificação automática.',
    duration: '2h',
    level: 'Intermediário',
    category: 'Renda Variável',
    url: 'https://edu.b3.com.br/cursos/etfs-e-bdrs',
  },
  {
    id: 'criptoativos-introducao',
    title: 'Introdução aos Criptoativos',
    description: 'Entenda o que são Bitcoin, Ethereum e outras criptomoedas, como funcionam as exchanges e os riscos do mercado cripto.',
    duration: '3h',
    level: 'Iniciante',
    category: 'Criptomoedas',
    url: 'https://edu.b3.com.br/cursos/criptoativos-introducao',
  },
  {
    id: 'gestao-carteira',
    title: 'Gestão de Carteira e Diversificação',
    description: 'Aprenda a montar e rebalancear uma carteira diversificada, entender correlação entre ativos e controlar risco de forma eficiente.',
    duration: '3h30',
    level: 'Intermediário',
    category: 'Gestão de Investimentos',
    url: 'https://edu.b3.com.br/cursos/gestao-de-carteira',
  },
  {
    id: 'opcoes-derivativos',
    title: 'Opções e Derivativos',
    description: 'Entenda como funcionam opções de compra e venda, estratégias de proteção (hedge) e alavancagem no mercado de derivativos.',
    duration: '5h',
    level: 'Avançado',
    category: 'Derivativos',
    url: 'https://edu.b3.com.br/cursos/opcoes-e-derivativos',
  },
];
