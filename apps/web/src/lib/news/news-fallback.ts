import type { NewsArticle } from './news.service';

/**
 * Static curated fallback articles shown when Finnhub is unavailable.
 * Update this list periodically to keep content fresh.
 * Last reviewed: 2026-06-14
 */
export const NEWS_FALLBACK: NewsArticle[] = [
  {
    id: 'fallback-1',
    title: 'B3 registra volume recorde no segmento de ETFs em 2026',
    summary:
      'O mercado de ETFs na B3 atingiu novo patamar histórico de negociações, impulsionado pela adesão de investidores pessoa física que buscam diversificação com custos reduzidos.',
    source: 'DataBolsa Editorial',
    url: 'https://www.b3.com.br/pt_br/noticias/',
    imageUrl: null,
    publishedAt: '2026-06-10T12:00:00.000Z',
  },
  {
    id: 'fallback-2',
    title: 'Selic em patamar elevado mantém renda fixa competitiva com ações',
    summary:
      'Com a taxa básica de juros em dois dígitos, analistas debatem a atratividade relativa de Tesouro Direto e ações de dividendos para o investidor conservador.',
    source: 'DataBolsa Editorial',
    url: 'https://www.tesourodireto.com.br/',
    imageUrl: null,
    publishedAt: '2026-06-09T10:00:00.000Z',
  },
  {
    id: 'fallback-3',
    title: 'FIIs de papel superam fundos de tijolo em retorno no 1º semestre de 2026',
    summary:
      'Fundos Imobiliários lastreados em CRIs e LCIs apresentaram dividend yield médio superior a 12% ao ano no primeiro semestre, atraindo mais cotistas para o segmento.',
    source: 'DataBolsa Editorial',
    url: 'https://www.b3.com.br/pt_br/produtos-e-servicos/negociacao/renda-variavel/fundos-de-investimentos-imobiliarios-fii.htm',
    imageUrl: null,
    publishedAt: '2026-06-08T09:30:00.000Z',
  },
  {
    id: 'fallback-4',
    title: 'Bitcoin supera US$ 100 mil e renova interesse em criptoativos no Brasil',
    summary:
      'A valorização do Bitcoin ao longo de 2026 voltou a colocar os criptoativos no radar dos investidores brasileiros, com exchanges registrando aumento de cadastros.',
    source: 'DataBolsa Editorial',
    url: 'https://www.coingecko.com/pt/moedas/bitcoin',
    imageUrl: null,
    publishedAt: '2026-06-07T14:00:00.000Z',
  },
  {
    id: 'fallback-5',
    title: 'Relatório de inflação do Banco Central aponta trajetória de queda gradual',
    summary:
      'O Relatório de Inflação do segundo trimestre de 2026 indica que o IPCA deve convergir para o centro da meta nos próximos 12 meses, o que pode abrir espaço para redução da Selic.',
    source: 'DataBolsa Editorial',
    url: 'https://www.bcb.gov.br/publicacoes/ri',
    imageUrl: null,
    publishedAt: '2026-06-06T08:00:00.000Z',
  },
  {
    id: 'fallback-6',
    title: 'Petrobras anuncia dividendos extraordinários e impulsiona o Ibovespa',
    summary:
      'O conselho de administração da Petrobras aprovou distribuição de proventos adicionais, elevando o retorno em dividendos da ação e impactando positivamente o índice Bovespa.',
    source: 'DataBolsa Editorial',
    url: 'https://www.investidorpetrobras.com.br/',
    imageUrl: null,
    publishedAt: '2026-06-05T11:00:00.000Z',
  },
  {
    id: 'fallback-7',
    title: 'Reforma tributária e impactos nas holdings familiares',
    summary:
      'Especialistas debatem como as mudanças previstas na reforma tributária podem afetar estruturas de holdings e o planejamento sucessório de investidores pessoa física.',
    source: 'DataBolsa Editorial',
    url: 'https://www.gov.br/receitafederal/pt-br',
    imageUrl: null,
    publishedAt: '2026-06-04T16:00:00.000Z',
  },
  {
    id: 'fallback-8',
    title: 'Stocks americanos: NVIDIA e setor de IA dominam altas em Wall Street',
    summary:
      'A corrida pelo desenvolvimento de inteligência artificial mantém ações do setor de semicondutores entre as maiores valorizações do S&P 500 no acumulado de 2026.',
    source: 'DataBolsa Editorial',
    url: 'https://finance.yahoo.com/',
    imageUrl: null,
    publishedAt: '2026-06-03T17:30:00.000Z',
  },
];
