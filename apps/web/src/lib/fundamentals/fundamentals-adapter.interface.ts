import type { AssetClass } from '@/types/api';

/**
 * Indicadores fundamentalistas normalizados.
 * Todos os campos monetários são string decimal (nunca number float).
 * Campos ausentes ou inapplicáveis à classe são null.
 */
export interface NormalizedFundamentals {
  // Valuation (STOCK_BR, STOCK_US, BDR)
  pe: string | null;          // P/L (Price/Earnings)
  pb: string | null;          // P/VP (Price/Book)
  evEbitda: string | null;    // EV/EBITDA
  debtToEquity: string | null; // Dívida/PL

  // Retorno
  dy: string | null;          // Dividend Yield %
  roe: string | null;         // ROE %
  netMargin: string | null;   // Margem Líquida %
  eps: string | null;         // Earnings per Share

  // Porte
  marketCap: string | null;   // Market Cap (moeda original)
  revenue: string | null;     // Receita (STOCK_US)

  // FII específico
  vacancyRate: string | null;   // Vacância %
  lastDividend: string | null;  // Último rendimento R$
  netWorth: string | null;      // Patrimônio Líquido R$
  totalShares: string | null;   // Número de cotas/ações
  dailyLiquidity: string | null; // Liquidez diária R$
  adminFee: string | null;      // Taxa de administração %

  // ETF específico (adminFee reutilizado)

  // Variações (BDR, STOCK_US)
  change52w: string | null;   // Variação 52 semanas %

  // Crypto específico
  volume24h: string | null;      // Volume 24h BRL
  circulatingSupply: string | null; // Supply circulante
  maxSupply: string | null;      // Supply máximo
  change7d: string | null;       // Variação 7 dias %
  change30d: string | null;      // Variação 30 dias %
}

export interface FundamentalsAdapter {
  /**
   * Busca os dados fundamentalistas do ativo.
   * Deve retornar todos os campos como null em caso de falha parcial.
   * Nunca lançar exceção — retornar campos como null em vez disso.
   */
  fetchFundamentals(symbol: string): Promise<NormalizedFundamentals>;

  readonly assetClass: AssetClass;
}

export const EMPTY_FUNDAMENTALS: NormalizedFundamentals = {
  pe: null,
  pb: null,
  evEbitda: null,
  debtToEquity: null,
  dy: null,
  roe: null,
  netMargin: null,
  eps: null,
  marketCap: null,
  revenue: null,
  vacancyRate: null,
  lastDividend: null,
  netWorth: null,
  totalShares: null,
  dailyLiquidity: null,
  adminFee: null,
  change52w: null,
  volume24h: null,
  circulatingSupply: null,
  maxSupply: null,
  change7d: null,
  change30d: null,
};
