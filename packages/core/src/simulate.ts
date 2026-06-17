import { Decimal } from 'decimal.js';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export interface HypotheticalTransaction {
  type: 'BUY' | 'SELL';
  quantity: Decimal;
  price: Decimal;
  fees?: Decimal;
}

export interface SimulationInput {
  current_quantity: Decimal;
  current_avg_price: Decimal;
  /** qtd_atual × avg_price já em BRL */
  current_invested_brl: Decimal;
  /** Patrimônio total do usuário em BRL (inclui este ativo se tiver cotação) */
  current_portfolio_value_brl: Decimal;
  /** Cotação atual do ativo em BRL. null quando não disponível (RN-10). */
  current_quote_brl: Decimal | null;
  hypothetical: HypotheticalTransaction;
}

export interface SimulationResult {
  new_quantity: Decimal;
  /** Inalterado no SELL (RN-03) */
  new_avg_price: Decimal;
  new_invested_brl: Decimal;
  /** null quando sem cotação */
  new_current_value_brl: Decimal | null;
  /** null quando patrimônio = 0 ou sem cotação (RN-09) */
  new_allocation_pct: Decimal | null;
  /** null quando sem cotação */
  pl_brl: Decimal | null;
  /** null quando invested = 0 ou sem cotação */
  pl_pct: Decimal | null;
  delta_quantity: Decimal;
  delta_invested_brl: Decimal;
}

/**
 * Simula o impacto de uma transação hipotética na posição de um ativo.
 *
 * Regras aplicadas:
 *   RN-01: BUY recalcula preço médio ponderado com taxas.
 *   RN-02: SELL maior que qtd_atual lança Error('SELL_EXCEEDS_POSITION').
 *   RN-03: SELL não altera preço médio.
 *   RN-09: nova alocação % ajusta patrimônio pelo delta de valor de mercado.
 *
 * Não persiste nada — função pura.
 *
 * @throws {Error} 'SELL_EXCEEDS_POSITION' se SELL > current_quantity (RN-02).
 */
export function simulatePosition(input: SimulationInput): SimulationResult {
  const {
    current_quantity,
    current_avg_price,
    current_invested_brl,
    current_portfolio_value_brl,
    current_quote_brl,
    hypothetical,
  } = input;

  const fees = hypothetical.fees ?? new Decimal(0);

  let new_quantity: Decimal;
  let new_avg_price: Decimal;

  if (hypothetical.type === 'BUY') {
    const added_cost = hypothetical.quantity.mul(hypothetical.price).add(fees);
    new_quantity = current_quantity.add(hypothetical.quantity);
    // RN-01: novo_avg = (qtd_atual × avg_atual + custo_compra) / nova_qtd
    new_avg_price = new_quantity.isZero()
      ? new Decimal(0)
      : current_quantity.mul(current_avg_price).add(added_cost).div(new_quantity);
  } else {
    // RN-02: venda maior que posição é rejeitada
    if (hypothetical.quantity.greaterThan(current_quantity)) {
      throw new Error('SELL_EXCEEDS_POSITION');
    }
    new_quantity = current_quantity.sub(hypothetical.quantity);
    new_avg_price = current_avg_price; // RN-03: venda não altera preço médio
  }

  const new_invested_brl = new_quantity.mul(new_avg_price);
  const delta_quantity = new_quantity.sub(current_quantity);
  const delta_invested_brl = new_invested_brl.sub(current_invested_brl);

  if (current_quote_brl === null) {
    return {
      new_quantity,
      new_avg_price,
      new_invested_brl,
      new_current_value_brl: null,
      new_allocation_pct: null,
      pl_brl: null,
      pl_pct: null,
      delta_quantity,
      delta_invested_brl,
    };
  }

  const old_asset_value = current_quantity.mul(current_quote_brl);
  const new_current_value_brl = new_quantity.mul(current_quote_brl);

  // Ajusta patrimônio pelo delta de valor de mercado deste ativo (RN-09)
  const adjusted_portfolio = current_portfolio_value_brl.sub(old_asset_value).add(new_current_value_brl);

  const new_allocation_pct = adjusted_portfolio.isZero()
    ? null
    : new_current_value_brl.div(adjusted_portfolio).mul(100);

  const pl_brl = new_current_value_brl.sub(new_invested_brl);
  const pl_pct = new_invested_brl.isZero()
    ? null
    : pl_brl.div(new_invested_brl).mul(100);

  return {
    new_quantity,
    new_avg_price,
    new_invested_brl,
    new_current_value_brl,
    new_allocation_pct,
    pl_brl,
    pl_pct,
    delta_quantity,
    delta_invested_brl,
  };
}
