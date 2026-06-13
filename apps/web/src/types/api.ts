// ============================================================
// Espelha os DTOs reais do backend (apps/api). Valores monetários
// chegam como strings decimais — NUNCA converter para float.
// ============================================================

export type AssetClass = 'STOCK_BR' | 'FII' | 'ETF' | 'BDR' | 'CRYPTO' | 'STOCK_US';
export type Currency = 'BRL' | 'USD';
export type DataSource = 'BRAPI' | 'COINGECKO' | 'FINNHUB';
export type TransactionType = 'BUY' | 'SELL';

// ---- Auth ----

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
}

// ---- Assets ----

export interface Asset {
  id: string;
  user_id: string;
  ticker: string;
  name: string;
  asset_class: AssetClass;
  currency: Currency;
  data_source: DataSource;
  created_at: string;
  updated_at: string;
}

export interface CreateAssetRequest {
  ticker: string;
  name: string;
  asset_class: AssetClass;
  currency: Currency;
  data_source: DataSource;
}

// ---- Transactions ----

export interface Transaction {
  id: string;
  asset_id: string;
  type: TransactionType;
  date: string;
  unit_price: string;
  quantity: string;
  fees: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionRequest {
  type: TransactionType;
  date: string;
  unit_price: string;
  quantity: string;
  fees?: string;
}

export interface UpdateTransactionRequest {
  type?: TransactionType;
  date?: string;
  unit_price?: string;
  quantity?: string;
  fees?: string;
}

// ---- Portfolio ----

export interface PositionSummaryDto {
  asset_id: string;
  ticker: string;
  current_quantity: string;
  average_price: string;
  invested_value: string;
  valor_atual_brl: string | null;
  lucro_prejuizo_brl: string | null;
  lucro_prejuizo_pct: string | null;
  alocacao_pct: string | null;
  is_stale: boolean;
}

export interface PortfolioSummaryDto {
  positions: PositionSummaryDto[];
  patrimonio_total_brl: string;
}

// ---- Error ----

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
