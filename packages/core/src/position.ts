/**
 * position.ts — funções puras de cálculo de posição e P/L.
 *
 * Regras de negócio implementadas:
 *   RN-01: preço_médio = (Σ(qtd_compra × preço_compra) + taxas) / Σ qtd_compra
 *   RN-02: venda maior que a posição disponível é rejeitada com erro
 *   RN-03: venda NÃO altera o preço médio das unidades remanescentes
 *
 * IMPORTANTE: nenhum `number` nativo é usado para valores monetários ou
 * quantidades — tudo via `Decimal` do pacote decimal.js.
 */

import { Decimal } from 'decimal.js';
import type { PositionResult, Transaction } from './types';

// Configura precisão alta globalmente para todas as operações Decimal deste módulo.
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

/**
 * Calcula o preço médio ponderado de uma lista de transações de COMPRA.
 *
 * Fórmula (RN-01):
 *   preço_médio = (Σ(qtd_compra_i × preço_compra_i) + Σ taxas_i) / Σ qtd_compra_i
 *
 * @param transactions - Lista de transações (BUY + SELL). Apenas BUYs são usados.
 * @returns Preço médio como Decimal. Retorna Decimal(0) se não houver compras.
 */
export function calculateAveragePrice(transactions: Transaction[]): Decimal {
  const buys = transactions.filter((t) => t.type === 'BUY');

  if (buys.length === 0) {
    return new Decimal(0);
  }

  let totalCost = new Decimal(0);
  let totalQuantity = new Decimal(0);

  for (const buy of buys) {
    // Custo bruto da compra: quantidade × preço unitário
    const buyCost = buy.quantity.mul(buy.unit_price);
    totalCost = totalCost.add(buyCost).add(buy.fees);
    totalQuantity = totalQuantity.add(buy.quantity);
  }

  if (totalQuantity.isZero()) {
    return new Decimal(0);
  }

  return totalCost.div(totalQuantity);
}

/**
 * Calcula a quantidade líquida atual da posição processando as transações
 * em ordem cronológica.
 *
 * Regras:
 *   - BUY: acumula quantidade.
 *   - SELL: deduz quantidade. Rejeita (lança erro) se a venda for maior que
 *     a posição disponível no momento da transação (RN-02).
 *   - Quantidade resultante nunca é negativa.
 *
 * @param transactions - Lista de transações ordenada por data (ISO string).
 * @returns Quantidade atual como Decimal.
 * @throws {Error} Se uma venda ultrapassar a posição disponível (RN-02).
 */
export function calculateCurrentQuantity(transactions: Transaction[]): Decimal {
  // Ordena por data para processar em sequência cronológica
  const sorted = [...transactions].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  );

  let currentQty = new Decimal(0);

  for (const tx of sorted) {
    if (tx.type === 'BUY') {
      currentQty = currentQty.add(tx.quantity);
    } else if (tx.type === 'SELL') {
      // RN-02: rejeitar venda maior que a posição disponível
      if (tx.quantity.greaterThan(currentQty)) {
        throw new Error(
          `RN-02: venda de ${tx.quantity.toString()} unidades em ${tx.date} ` +
            `excede a posição disponível de ${currentQty.toString()} unidades.`,
        );
      }
      currentQty = currentQty.sub(tx.quantity);
    }
    // DIVIDEND: não altera quantidade
  }

  return currentQty;
}

/**
 * Calcula a posição completa e o lucro/prejuízo de um ativo a partir da
 * lista de transações e da cotação atual.
 *
 * Aplica RN-01, RN-02, RN-03 conforme documentado em `docs/SPEC.md §7`.
 *
 * @param transactions - Lista de transações do ativo (qualquer ordem; será reordenada internamente).
 * @param currentQuote  - Cotação atual do ativo na moeda do ativo (Decimal).
 * @returns `PositionResult` com todos os campos em Decimal.
 * @throws {Error} Se qualquer venda violar RN-02 (posição insuficiente).
 */
export function calculatePosition(
  transactions: Transaction[],
  currentQuote: Decimal,
): PositionResult {
  // RN-02 é verificado dentro de calculateCurrentQuantity
  const current_quantity = calculateCurrentQuantity(transactions);

  // RN-01: preço médio considera apenas compras; RN-03 garante que vendas não afetam isso
  const average_price = calculateAveragePrice(transactions);

  // valor_investido = qtd_atual × preço_médio
  const invested_value = current_quantity.mul(average_price);

  // valor_atual = qtd_atual × cotação_atual
  const current_value = current_quantity.mul(currentQuote);

  // lucro_R$ = valor_atual − valor_investido
  const profit_loss = current_value.sub(invested_value);

  // lucro_% = lucro_R$ / valor_investido × 100
  // Se invested_value = 0 (posição zerada), retorna 0 para evitar divisão por zero (AC-04)
  const profit_loss_pct = invested_value.isZero()
    ? new Decimal(0)
    : profit_loss.div(invested_value).mul(100);

  // total_dividends = Σ (quantidade × unit_price) das transações DIVIDEND
  const total_dividends = transactions
    .filter((t) => t.type === 'DIVIDEND')
    .reduce((acc, t) => acc.add(t.quantity.mul(t.unit_price)), new Decimal(0));

  const total_return = profit_loss.add(total_dividends);

  const total_return_pct = invested_value.isZero()
    ? new Decimal(0)
    : total_return.div(invested_value).mul(100);

  const yield_on_cost_pct = invested_value.isZero()
    ? new Decimal(0)
    : total_dividends.div(invested_value).mul(100);

  return {
    current_quantity,
    average_price,
    invested_value,
    current_value,
    profit_loss,
    profit_loss_pct,
    total_dividends,
    total_return,
    total_return_pct,
    yield_on_cost_pct,
  };
}

/**
 * Calcula o lucro/prejuízo realizado nas operações de venda, usando o
 * método do custo médio corrido (running average — RN-01, RN-03).
 *
 * Para cada SELL: ganho = quantidade × (preço_venda − preço_médio_no_momento).
 * O preço médio é atualizado a cada BUY com base na posição em aberto.
 *
 * @param transactions - Lista de transações do ativo (qualquer ordem; será reordenada).
 * @returns Ganho realizado total como Decimal (pode ser negativo = prejuízo).
 */
export function calculateRealizedGain(transactions: Transaction[]): Decimal {
  const sorted = [...transactions].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  );

  let currentQty = new Decimal(0);
  let avgPrice = new Decimal(0);
  let realizedGain = new Decimal(0);

  for (const tx of sorted) {
    if (tx.type === 'BUY') {
      const newQty = currentQty.add(tx.quantity);
      avgPrice = newQty.isZero()
        ? new Decimal(0)
        : currentQty.mul(avgPrice).add(tx.quantity.mul(tx.unit_price)).add(tx.fees).div(newQty);
      currentQty = newQty;
    } else if (tx.type === 'SELL') {
      realizedGain = realizedGain.add(tx.quantity.mul(tx.unit_price.sub(avgPrice)));
      currentQty = currentQty.sub(tx.quantity);
    }
    // DIVIDEND: não afeta avgPrice nem quantidade
  }

  return realizedGain;
}
