// Cursos curados da B3 Educação — última revisão: 2026-07-02
// Nota: a B3 removeu as páginas individuais de curso (/cursos/*). Os links abaixo agora
// apontam para as páginas de conteúdo/tipo de investimento mais relevantes no site da B3
// (verificadas em jul/2026). Se a estrutura mudar novamente, refaça a verificação.

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
    url: 'https://edu.b3.com.br/tipos-de-investimentos/renda-variavel',
  },
  {
    id: 'como-investir-acoes',
    title: 'Como Investir em Ações',
    description: 'Aprenda a analisar e selecionar ações, entenda os direitos dos acionistas e como funciona a distribuição de dividendos.',
    duration: '3h',
    level: 'Iniciante',
    category: 'Renda Variável',
    url: 'https://edu.b3.com.br/tipos-de-investimentos/renda-variavel/acoes',
  },
  {
    id: 'fundos-imobiliarios',
    title: 'Fundos Imobiliários (FIIs)',
    description: 'Descubra como investir no mercado imobiliário por meio dos FIIs, entenda os tipos de fundos e como avaliar o yield.',
    duration: '2h30',
    level: 'Iniciante',
    category: 'Fundos',
    url: 'https://edu.b3.com.br/tipos-de-investimentos/renda-variavel/fii',
  },
  {
    id: 'analise-fundamentalista',
    title: 'Análise Fundamentalista',
    description: 'Aprenda a ler demonstrativos financeiros, calcular múltiplos de valuation (P/L, P/VP, EV/EBITDA) e identificar empresas de qualidade.',
    duration: '4h',
    level: 'Intermediário',
    category: 'Renda Variável',
    url: 'https://edu.b3.com.br/educacao-financeira/cursos/profissionais',
  },
  {
    id: 'etfs-e-bdrs',
    title: 'ETFs e BDRs: Diversificação Global',
    description: 'Como investir em índices globais e ações internacionais via ETFs e BDRs listados na B3, com custos baixos e diversificação automática.',
    duration: '2h',
    level: 'Intermediário',
    category: 'Renda Variável',
    url: 'https://edu.b3.com.br/tipos-de-investimentos/renda-variavel',
  },
  {
    id: 'criptoativos-introducao',
    title: 'Introdução aos Criptoativos',
    description: 'Entenda o que são Bitcoin, Ethereum e outras criptomoedas, como funcionam as exchanges e os riscos do mercado cripto.',
    duration: '3h',
    level: 'Iniciante',
    category: 'Criptomoedas',
    url: 'https://edu.b3.com.br/tipos-de-investimentos/renda-variavel/cripto',
  },
  {
    id: 'gestao-carteira',
    title: 'Gestão de Carteira e Diversificação',
    description: 'Aprenda a montar e rebalancear uma carteira diversificada, entender correlação entre ativos e controlar risco de forma eficiente.',
    duration: '3h30',
    level: 'Intermediário',
    category: 'Gestão de Investimentos',
    url: 'https://edu.b3.com.br/educacao-financeira/cursos/profissionais',
  },
  {
    id: 'opcoes-derivativos',
    title: 'Opções e Derivativos',
    description: 'Entenda como funcionam opções de compra e venda, estratégias de proteção (hedge) e alavancagem no mercado de derivativos.',
    duration: '5h',
    level: 'Avançado',
    category: 'Derivativos',
    url: 'https://edu.b3.com.br/educacao-financeira/cursos/profissionais',
  },
];
