import { Decimal } from 'decimal.js';

/** Tipos de transação suportados. */
export type TransactionType = 'BUY' | 'SELL' | 'DIVIDEND';

/**
 * Representa uma transação de compra ou venda de um ativo.
 *
 * Todos os valores monetários e quantidades são `Decimal` — nunca `number`.
 * Taxas (`fees`) só fazem sentido em compras; para vendas deve ser `new Decimal(0)`.
 */
export interface Transaction {
  type: TransactionType;
  /** Data da transação no formato ISO 8601 (YYYY-MM-DD). */
  date: string;
  /** Preço unitário na moeda do ativo (decimal). */
  unit_price: Decimal;
  /** Quantidade negociada (decimal, sempre positiva). */
  quantity: Decimal;
  /**
   * Taxas pagas na transação (decimal, sempre >= 0).
   * Em vendas deve ser zero; o custo médio das unidades restantes não muda na venda.
   */
  fees: Decimal;
}

/**
 * Resultado consolidado do cálculo de posição para uma lista de transações.
 *
 * Todos os campos monetários e de quantidade são `Decimal`.
 */
export interface PositionResult {
  /** Quantidade líquida atual (compras - vendas). Nunca negativa. */
  current_quantity: Decimal;
  /**
   * Preço médio ponderado das compras, incluindo taxas.
   * Zero quando não há compras na lista.
   */
  average_price: Decimal;
  /**
   * Valor total investido a custo médio: current_quantity × average_price.
   * Zero quando current_quantity = 0.
   */
  invested_value: Decimal;
  /**
   * Valor atual da posição na moeda do ativo: current_quantity × cotação.
   * Zero quando current_quantity = 0.
   */
  current_value: Decimal;
  /**
   * Lucro/prejuízo em valor absoluto: current_value − invested_value.
   */
  profit_loss: Decimal;
  /**
   * Lucro/prejuízo percentual: (profit_loss / invested_value) × 100.
   * Zero quando invested_value = 0 (posição zerada), para evitar divisão por zero.
   */
  profit_loss_pct: Decimal;
  /** Soma dos dividendos/proventos recebidos: Σ (quantidade × unit_price) das transações DIVIDEND. */
  total_dividends: Decimal;
  /** Retorno total: profit_loss + total_dividends. */
  total_return: Decimal;
  /** Retorno total percentual: (total_return / invested_value) × 100. Zero quando invested_value = 0. */
  total_return_pct: Decimal;
  /** Yield on Cost: (total_dividends / invested_value) × 100. Zero quando invested_value = 0. */
  yield_on_cost_pct: Decimal;
}
