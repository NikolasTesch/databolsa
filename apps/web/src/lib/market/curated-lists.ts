import type { AssetClass } from '@/types/api';

export const CURATED_LISTS: Record<AssetClass, string[]> = {
  STOCK_BR: [
    'PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3',
    'WEGE3', 'RENT3', 'LREN3', 'MGLU3', 'VIIA3',
    'TOTS3', 'EGIE3', 'TAEE11', 'BBAS3', 'BPAC11',
  ],
  FII: [
    'MXRF11', 'HGLG11', 'BCFF11', 'XPLG11', 'VISC11',
    'RBRF11', 'HSML11', 'GGRC11', 'HGRE11', 'RBRP11',
  ],
  ETF: ['BOVA11', 'IVVB11', 'SMAL11', 'HASH11', 'XFIX11'],
  BDR: ['AAPL34', 'MSFT34', 'GOGL34', 'AMZO34', 'TSLA34', 'NVDC34', 'META34'],
  CRYPTO: ['bitcoin', 'ethereum', 'tether', 'solana', 'binancecoin'],
  STOCK_US: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META'],
};

export const CRYPTO_ID_TO_TICKER: Record<string, string> = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  tether: 'USDT',
  solana: 'SOL',
  binancecoin: 'BNB',
};

export const CRYPTO_ID_TO_NAME: Record<string, string> = {
  bitcoin: 'Bitcoin',
  ethereum: 'Ethereum',
  tether: 'Tether',
  solana: 'Solana',
  binancecoin: 'BNB',
};

export const FII_TICKERS = new Set<string>([
  'MXRF11', 'HGLG11', 'BCFF11', 'XPLG11', 'VISC11',
  'RBRF11', 'HSML11', 'GGRC11', 'HGRE11', 'RBRP11',
  'KNRI11', 'XPML11', 'HGRU11', 'IRDM11', 'BTLG11',
  'VGIP11', 'CPTS11', 'MALL11', 'TRXF11', 'RZTR11',
  'TAEE11',
]);

export const ETF_TICKERS = new Set<string>([
  'BOVA11', 'IVVB11', 'SMAL11', 'HASH11', 'XFIX11',
  'DIVO11', 'FIND11', 'GOLD11', 'SPXI11', 'NASD11',
]);

export const BDR_TICKERS = new Set<string>([
  'AAPL34', 'MSFT34', 'GOGL34', 'AMZO34', 'TSLA34',
  'NVDC34', 'META34', 'NFLX34', 'DISB34', 'JPMC34',
]);

export function inferAssetClass(ticker: string): AssetClass {
  const upper = ticker.toUpperCase();
  if (BDR_TICKERS.has(upper)) return 'BDR';
  if (ETF_TICKERS.has(upper)) return 'ETF';
  if (FII_TICKERS.has(upper)) return 'FII';
  return 'STOCK_BR';
}
