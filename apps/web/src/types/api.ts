// ============================================================
// Espelha os DTOs reais do backend (apps/api). Valores monetários
// chegam como strings decimais — NUNCA converter para float.
// ============================================================

export type AssetClass = 'STOCK_BR' | 'FII' | 'ETF' | 'BDR' | 'CRYPTO' | 'STOCK_US';
export type Currency = 'BRL' | 'USD';
export type DataSource = 'BRAPI' | 'COINGECKO' | 'FINNHUB';
export type TransactionType = 'BUY' | 'SELL' | 'DIVIDEND';

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
  current_price_brl: string | null;
}

export interface PortfolioSummaryDto {
  positions: PositionSummaryDto[];
  patrimonio_total_brl: string;
}

// ---- Portfolio History ----

export interface PortfolioHistoryDataPoint {
  date: string;
  cumulative_invested_brl: string;
}

export interface PortfolioHistoryDto {
  data_points: PortfolioHistoryDataPoint[];
}

// ---- Monthly Activity ----

export interface MonthlyActivityDto {
  total_bought_brl: string;
  total_sold_brl: string;
  total_dividends_brl: string;
  estimated_realized_gain_brl: string;
  transaction_count: number;
}

// ---- Groups ----

export type GroupMemberRole = 'LEADER' | 'MEMBER';

export interface GroupListItem {
  id: string;
  name: string;
  description: string | null;
  role: GroupMemberRole;
  memberCount: number;
}

export interface GroupMember {
  user_id: string;
  email: string;
  role: GroupMemberRole;
  joined_at: string;
}

export interface GroupInvite {
  id: string;
  code: string;
  role: GroupMemberRole;
  expires_at: string | null;
  max_uses: number | null;
  uses: number;
  revoked: boolean;
}

export interface GroupDetail {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  members: GroupMember[];
  invites?: GroupInvite[];
}

export interface CreateGroupResponse {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

export interface CreateInviteResponse {
  id: string;
  code: string;
  role: string;
  expires_at: string | null;
  max_uses: number | null;
}

export interface AcceptInviteResponse {
  success: boolean;
  group_id: string;
  role: string;
}

// ---- Error ----

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
