/**
 * Suíte de testes para packages/core — posição e P/L.
 *
 * Cobre todos os casos do test_plan da SPEC-0001 (TC-01..TC-07).
 * Sem acesso à rede; sem mocks de APIs externas necessários nesta camada.
 */

import { Decimal } from 'decimal.js';
import {
  calculateAveragePrice,
  calculateCurrentQuantity,
  calculatePosition,
  calculateRealizedGain,
} from '../position';
import type { Transaction } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buy(
  date: string,
  quantity: string | number,
  unit_price: string | number,
  fees: string | number = 0,
): Transaction {
  return {
    type: 'BUY',
    date,
    quantity: new Decimal(quantity),
    unit_price: new Decimal(unit_price),
    fees: new Decimal(fees),
  };
}

function sell(
  date: string,
  quantity: string | number,
  unit_price: string | number,
): Transaction {
  return {
    type: 'SELL',
    date,
    quantity: new Decimal(quantity),
    unit_price: new Decimal(unit_price),
    fees: new Decimal(0),
  };
}

function dividend(
  date: string,
  quantity: string | number,
  unit_price: string | number,
): Transaction {
  return {
    type: 'DIVIDEND',
    date,
    quantity: new Decimal(quantity),
    unit_price: new Decimal(unit_price),
    fees: new Decimal(0),
  };
}

// ---------------------------------------------------------------------------
// TC-01 — preço médio com múltiplas compras a preços diferentes e taxas
// ---------------------------------------------------------------------------

describe('TC-01: calculateAveragePrice — múltiplas compras com taxas', () => {
  /**
   * Cenário:
   *   Compra 1: 10 un. a R$10,00 + R$2,00 de taxa  → custo = 102,00
   *   Compra 2:  5 un. a R$14,00 + R$0,00 de taxa  → custo =  70,00
   *   Total custo = 172,00 / 15 un. = 11,4666...
   */
  it('calcula corretamente a média ponderada com taxas', () => {
    const transactions: Transaction[] = [
      buy('2024-01-01', 10, '10.00', '2.00'),
      buy('2024-01-05', 5, '14.00', '0.00'),
    ];

    const avg = calculateAveragePrice(transactions);

    // 172 / 15 = 11.4666...7 (arredondado)
    expect(avg).toBeInstanceOf(Decimal);
    expect(avg.toDecimalPlaces(4).toString()).toBe('11.4667');
  });

  it('retorna zero quando não há transações', () => {
    const avg = calculateAveragePrice([]);
    expect(avg).toBeInstanceOf(Decimal);
    expect(avg.isZero()).toBe(true);
  });

  it('ignora transações do tipo SELL no cálculo do preço médio (RN-03)', () => {
    const transactions: Transaction[] = [
      buy('2024-01-01', 10, '10.00'),
      sell('2024-01-10', 5, '15.00'), // venda a preço diferente — NÃO deve afetar o avg
    ];

    const avg = calculateAveragePrice(transactions);
    // Apenas a compra: 100 / 10 = 10
    expect(avg.toString()).toBe('10');
  });
});

// ---------------------------------------------------------------------------
// TC-02 — venda parcial: quantidade diminui, preço médio inalterado
// ---------------------------------------------------------------------------

describe('TC-02: calculatePosition — venda parcial mantém preço médio (RN-03)', () => {
  it('venda parcial reduz quantidade mas mantém average_price', () => {
    const transactions: Transaction[] = [
      buy('2024-01-01', 100, '20.00'),
      sell('2024-02-01', 30, '25.00'),
    ];

    const quote = new Decimal('25.00');
    const result = calculatePosition(transactions, quote);

    // qtd_atual = 100 - 30 = 70
    expect(result.current_quantity.toString()).toBe('70');
    // Preço médio NÃO muda: ainda R$20,00
    expect(result.average_price.toString()).toBe('20');
    // valor_investido = 70 × 20 = 1400
    expect(result.invested_value.toString()).toBe('1400');
    // valor_atual = 70 × 25 = 1750
    expect(result.current_value.toString()).toBe('1750');
    // lucro_R$ = 1750 - 1400 = 350
    expect(result.profit_loss.toString()).toBe('350');
  });

  it('venda parcial com múltiplas compras a preços diferentes — preço médio inalterado', () => {
    const transactions: Transaction[] = [
      buy('2024-01-01', 10, '10.00'),
      buy('2024-01-05', 10, '20.00'),
      sell('2024-01-10', 5, '25.00'),
    ];

    const avgBefore = calculateAveragePrice(transactions);
    const qtyAfter = calculateCurrentQuantity(transactions);

    // preço médio das compras: (100 + 200) / 20 = 15
    expect(avgBefore.toString()).toBe('15');
    // quantidade: 20 - 5 = 15
    expect(qtyAfter.toString()).toBe('15');
  });
});

// ---------------------------------------------------------------------------
// TC-03 — venda total: posição vai a zero
// ---------------------------------------------------------------------------

describe('TC-03: venda total — posição zerada (AC-05)', () => {
  it('venda total resulta em qtd_atual=0 e valor_investido=0', () => {
    const transactions: Transaction[] = [
      buy('2024-01-01', 50, '10.00'),
      sell('2024-02-01', 50, '12.00'),
    ];

    const quote = new Decimal('12.00');
    const result = calculatePosition(transactions, quote);

    expect(result.current_quantity.isZero()).toBe(true);
    expect(result.invested_value.isZero()).toBe(true);
    expect(result.current_value.isZero()).toBe(true);
    // Com posição zerada lucro/prejuízo também é zero
    expect(result.profit_loss.isZero()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TC-04 — venda maior que a posição é rejeitada (RN-02)
// ---------------------------------------------------------------------------

describe('TC-04: venda > posição é rejeitada (RN-02)', () => {
  it('lança erro ao tentar vender mais do que a posição disponível', () => {
    const transactions: Transaction[] = [
      buy('2024-01-01', 100, '10.00'),
      sell('2024-01-10', 150, '11.00'), // 150 > 100
    ];

    expect(() => calculateCurrentQuantity(transactions)).toThrow(/RN-02/);
  });

  it('lança erro ao tentar vender quando não há posição alguma', () => {
    const transactions: Transaction[] = [
      sell('2024-01-01', 1, '10.00'),
    ];

    expect(() => calculateCurrentQuantity(transactions)).toThrow(/RN-02/);
  });

  it('permite venda de exatamente toda a posição (boundary)', () => {
    const transactions: Transaction[] = [
      buy('2024-01-01', 100, '10.00'),
      sell('2024-01-10', 100, '11.00'),
    ];

    expect(() => calculateCurrentQuantity(transactions)).not.toThrow();
    const qty = calculateCurrentQuantity(transactions);
    expect(qty.isZero()).toBe(true);
  });

  it('calculatePosition também propaga o erro de RN-02', () => {
    const transactions: Transaction[] = [
      buy('2024-01-01', 10, '10.00'),
      sell('2024-01-02', 20, '10.00'),
    ];

    expect(() => calculatePosition(transactions, new Decimal('10'))).toThrow(/RN-02/);
  });
});

// ---------------------------------------------------------------------------
// TC-05 — posição zero: lucro_% sem divisão por zero (AC-04)
// ---------------------------------------------------------------------------

describe('TC-05: posição zero — profit_loss_pct sem divisão por zero (AC-04)', () => {
  it('retorna profit_loss_pct = 0 quando invested_value = 0', () => {
    const transactions: Transaction[] = [
      buy('2024-01-01', 10, '10.00'),
      sell('2024-02-01', 10, '15.00'),
    ];

    const quote = new Decimal('15.00');
    const result = calculatePosition(transactions, quote);

    expect(result.invested_value.isZero()).toBe(true);
    expect(result.profit_loss_pct).toBeInstanceOf(Decimal);
    expect(result.profit_loss_pct.isZero()).toBe(true);
  });

  it('retorna profit_loss_pct = 0 com lista vazia de transações', () => {
    const result = calculatePosition([], new Decimal('100'));

    expect(result.profit_loss_pct).toBeInstanceOf(Decimal);
    expect(result.profit_loss_pct.isZero()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TC-06 — todos os retornos são instâncias de Decimal (REQ-04)
// ---------------------------------------------------------------------------

describe('TC-06: todos os valores retornados são instâncias de Decimal (REQ-04)', () => {
  it('calculateAveragePrice retorna Decimal', () => {
    const result = calculateAveragePrice([buy('2024-01-01', 10, '10')]);
    expect(result).toBeInstanceOf(Decimal);
  });

  it('calculateCurrentQuantity retorna Decimal', () => {
    const result = calculateCurrentQuantity([buy('2024-01-01', 10, '10')]);
    expect(result).toBeInstanceOf(Decimal);
  });

  it('calculatePosition retorna PositionResult com todos os campos Decimal', () => {
    const result = calculatePosition(
      [buy('2024-01-01', 10, '10')],
      new Decimal('12'),
    );

    expect(result.current_quantity).toBeInstanceOf(Decimal);
    expect(result.average_price).toBeInstanceOf(Decimal);
    expect(result.invested_value).toBeInstanceOf(Decimal);
    expect(result.current_value).toBeInstanceOf(Decimal);
    expect(result.profit_loss).toBeInstanceOf(Decimal);
    expect(result.profit_loss_pct).toBeInstanceOf(Decimal);
  });
});

// ---------------------------------------------------------------------------
// TC-07 — verificação numérica do P/L: 10 un. × R$10 → cotação R$12
// ---------------------------------------------------------------------------

describe('TC-07: P/L com valores concretos (AC-01)', () => {
  /**
   * Compra: 10 un. a R$10,00 (sem taxas)
   * Cotação atual: R$12,00
   *
   * Esperado:
   *   average_price   = R$10,00
   *   invested_value  = 10 × 10 = R$100,00
   *   current_value   = 10 × 12 = R$120,00
   *   profit_loss     = 120 - 100 = R$20,00
   *   profit_loss_pct = 20/100 × 100 = 20,00%
   */
  it('lucro_R$ = 20 e lucro_% = 20% para compra a R$10 com cotação a R$12', () => {
    const transactions: Transaction[] = [
      buy('2024-01-01', 10, '10.00'),
    ];

    const result = calculatePosition(transactions, new Decimal('12.00'));

    expect(result.average_price.toString()).toBe('10');
    expect(result.invested_value.toString()).toBe('100');
    expect(result.current_value.toString()).toBe('120');
    expect(result.profit_loss.toString()).toBe('20');
    expect(result.profit_loss_pct.toString()).toBe('20');
  });

  it('lucro negativo quando cotação cai abaixo do preço médio', () => {
    const transactions: Transaction[] = [
      buy('2024-01-01', 10, '10.00'),
    ];

    const result = calculatePosition(transactions, new Decimal('8.00'));

    expect(result.profit_loss.toString()).toBe('-20');
    expect(result.profit_loss_pct.toString()).toBe('-20');
  });
});

// ---------------------------------------------------------------------------
// Casos adicionais de edge case
// ---------------------------------------------------------------------------

describe('Edge cases adicionais', () => {
  it('múltiplas compras a preços iguais resultam no mesmo preço médio', () => {
    const transactions: Transaction[] = [
      buy('2024-01-01', 5, '10.00'),
      buy('2024-01-02', 5, '10.00'),
    ];

    const avg = calculateAveragePrice(transactions);
    expect(avg.toString()).toBe('10');
  });

  it('taxas elevadas são corretamente incorporadas ao custo médio', () => {
    // 1 un. a R$100,00 + R$50 de taxa → preço médio = 150
    const transactions: Transaction[] = [
      buy('2024-01-01', 1, '100.00', '50.00'),
    ];

    const avg = calculateAveragePrice(transactions);
    expect(avg.toString()).toBe('150');
  });

  it('compra com quantidade zero resulta em preço médio zero (branch defensivo)', () => {
    // Cobre o branch de totalQuantity.isZero() com buys presentes mas quantidade zero
    const transactions: Transaction[] = [
      {
        type: 'BUY',
        date: '2024-01-01',
        quantity: new Decimal(0),
        unit_price: new Decimal('10.00'),
        fees: new Decimal(0),
      },
    ];

    const avg = calculateAveragePrice(transactions);
    expect(avg).toBeInstanceOf(Decimal);
    expect(avg.isZero()).toBe(true);
  });

  it('transações fora de ordem são reordenadas cronologicamente para RN-02', () => {
    // A venda está antes da compra no array, mas a data é posterior
    const transactions: Transaction[] = [
      sell('2024-01-10', 5, '15.00'),
      buy('2024-01-01', 10, '10.00'),
    ];

    // Não deve lançar erro: a compra aconteceu antes da venda
    expect(() => calculateCurrentQuantity(transactions)).not.toThrow();
    const qty = calculateCurrentQuantity(transactions);
    expect(qty.toString()).toBe('5');
  });

  it('série completa: 3 compras, 2 vendas parciais — position final correta', () => {
    const transactions: Transaction[] = [
      buy('2024-01-01', 100, '10.00'),
      buy('2024-02-01', 50, '20.00'),   // custo acumulado = 100×10 + 50×20 = 2000; qty=150
      sell('2024-03-01', 30, '25.00'),   // qty = 120
      buy('2024-04-01', 20, '15.00'),    // custo acumulado = 2000 + 20×15 = 2300; qty=140
      sell('2024-05-01', 40, '22.00'),   // qty = 100
    ];

    // Preço médio = (100×10 + 50×20 + 20×15) / (100+50+20) = 2300 / 170 ≈ 13.5294...
    const avg = calculateAveragePrice(transactions);
    expect(avg.toDecimalPlaces(4).toString()).toBe('13.5294');

    const qty = calculateCurrentQuantity(transactions);
    expect(qty.toString()).toBe('100');

    const result = calculatePosition(transactions, new Decimal('18.00'));
    // invested_value = 100 × (2300/170) ≈ 1352.94...
    expect(result.invested_value.toDecimalPlaces(4).toString()).toBe('1352.9412');
    // current_value = 100 × 18 = 1800
    expect(result.current_value.toString()).toBe('1800');
    // profit_loss = 1800 - 1352.94... ≈ 447.06...
    expect(result.profit_loss.toDecimalPlaces(4).toString()).toBe('447.0588');
  });
});

// ---------------------------------------------------------------------------
// TC-08 — dividendos: total_dividends e retorno total (total_return)
// ---------------------------------------------------------------------------

describe('TC-08: calculatePosition — dividendos e retorno total', () => {
  it('total_dividends acumula proventos corretamente', () => {
    const transactions: Transaction[] = [
      buy('2024-01-01', 100, '10.00'),
      dividend('2024-06-01', 100, '0.50'),  // R$50
      dividend('2024-12-01', 100, '0.75'),  // R$75
    ];

    const result = calculatePosition(transactions, new Decimal('12.00'));

    expect(result.total_dividends.toString()).toBe('125');
  });

  it('total_return = profit_loss + total_dividends', () => {
    const transactions: Transaction[] = [
      buy('2024-01-01', 100, '10.00'),
      dividend('2024-06-01', 100, '1.00'),  // R$100
    ];

    const result = calculatePosition(transactions, new Decimal('12.00'));

    // profit_loss = (12 - 10) * 100 = 200; total_dividends = 100
    expect(result.profit_loss.toString()).toBe('200');
    expect(result.total_dividends.toString()).toBe('100');
    expect(result.total_return.toString()).toBe('300');
  });

  it('total_return_pct = total_return / invested_value * 100', () => {
    const transactions: Transaction[] = [
      buy('2024-01-01', 100, '10.00'),
      dividend('2024-06-01', 100, '1.00'),  // R$100
    ];

    // invested_value = 100 * 10 = 1000
    // total_return = 300; total_return_pct = 300 / 1000 * 100 = 30
    const result = calculatePosition(transactions, new Decimal('12.00'));
    expect(result.total_return_pct.toString()).toBe('30');
  });

  it('yield_on_cost_pct = total_dividends / invested_value * 100', () => {
    const transactions: Transaction[] = [
      buy('2024-01-01', 100, '10.00'),
      dividend('2024-06-01', 100, '1.00'),  // R$100
    ];

    // invested_value = 1000; yield_on_cost = 100 / 1000 * 100 = 10
    const result = calculatePosition(transactions, new Decimal('12.00'));
    expect(result.yield_on_cost_pct.toString()).toBe('10');
  });

  it('dividendos não alteram quantidade nem preço médio', () => {
    const transactions: Transaction[] = [
      buy('2024-01-01', 100, '10.00'),
      dividend('2024-06-01', 100, '1.00'),
    ];

    const result = calculatePosition(transactions, new Decimal('10.00'));
    expect(result.current_quantity.toString()).toBe('100');
    expect(result.average_price.toString()).toBe('10');
  });

  it('zeros de dividendos quando não há transações DIVIDEND', () => {
    const transactions: Transaction[] = [
      buy('2024-01-01', 10, '10.00'),
    ];

    const result = calculatePosition(transactions, new Decimal('12.00'));
    expect(result.total_dividends.isZero()).toBe(true);
    expect(result.total_return.toString()).toBe(result.profit_loss.toString());
    expect(result.yield_on_cost_pct.isZero()).toBe(true);
  });

  it('total_return_pct e yield_on_cost_pct são zero quando posição zerada', () => {
    const transactions: Transaction[] = [
      buy('2024-01-01', 10, '10.00'),
      sell('2024-02-01', 10, '12.00'),
      dividend('2024-03-01', 10, '1.00'),
    ];

    const result = calculatePosition(transactions, new Decimal('12.00'));
    expect(result.total_return_pct.isZero()).toBe(true);
    expect(result.yield_on_cost_pct.isZero()).toBe(true);
  });

  it('todos os novos campos retornam instâncias de Decimal (REQ-04)', () => {
    const result = calculatePosition(
      [buy('2024-01-01', 10, '10')],
      new Decimal('12'),
    );
    expect(result.total_dividends).toBeInstanceOf(Decimal);
    expect(result.total_return).toBeInstanceOf(Decimal);
    expect(result.total_return_pct).toBeInstanceOf(Decimal);
    expect(result.yield_on_cost_pct).toBeInstanceOf(Decimal);
  });
});

// ---------------------------------------------------------------------------
// TC-09 — calculateRealizedGain: lucro realizado nas vendas
// ---------------------------------------------------------------------------

describe('TC-09: calculateRealizedGain — lucro realizado em vendas', () => {
  it('retorna zero sem transações', () => {
    expect(calculateRealizedGain([]).isZero()).toBe(true);
  });

  it('retorna zero sem vendas', () => {
    const result = calculateRealizedGain([buy('2024-01-01', 100, '10')]);
    expect(result.isZero()).toBe(true);
  });

  it('lucro simples: venda acima do preço médio', () => {
    const transactions: Transaction[] = [
      buy('2024-01-01', 100, '10.00'),
      sell('2024-02-01', 50, '15.00'),
    ];
    // ganho = 50 * (15 - 10) = 250
    const gain = calculateRealizedGain(transactions);
    expect(gain.toString()).toBe('250');
  });

  it('prejuízo: venda abaixo do preço médio', () => {
    const transactions: Transaction[] = [
      buy('2024-01-01', 100, '10.00'),
      sell('2024-02-01', 50, '8.00'),
    ];
    // ganho = 50 * (8 - 10) = -100
    const gain = calculateRealizedGain(transactions);
    expect(gain.toString()).toBe('-100');
  });

  it('venda total: ganho sobre toda a posição', () => {
    const transactions: Transaction[] = [
      buy('2024-01-01', 50, '10.00'),
      sell('2024-02-01', 50, '12.00'),
    ];
    // ganho = 50 * (12 - 10) = 100
    expect(calculateRealizedGain(transactions).toString()).toBe('100');
  });

  it('usa custo médio corrido — compra entre duas vendas atualiza avgPrice', () => {
    const transactions: Transaction[] = [
      buy('2024-01-01', 100, '10.00'),  // avgPrice = 10, qty = 100
      sell('2024-02-01', 50, '15.00'),  // ganho = 50 * (15-10) = 250; qty = 50
      buy('2024-03-01', 50, '20.00'),   // avgPrice = (50*10 + 50*20) / 100 = 15; qty = 100
      sell('2024-04-01', 100, '18.00'), // ganho = 100 * (18-15) = 300; qty = 0
    ];
    // total = 250 + 300 = 550
    expect(calculateRealizedGain(transactions).toString()).toBe('550');
  });

  it('dividendos são ignorados no cálculo do ganho realizado', () => {
    const transactions: Transaction[] = [
      buy('2024-01-01', 100, '10.00'),
      dividend('2024-06-01', 100, '1.00'),
      sell('2024-12-01', 50, '15.00'),
    ];
    // ganho = 50 * (15 - 10) = 250 (dividendo não afeta)
    expect(calculateRealizedGain(transactions).toString()).toBe('250');
  });

  it('retorna instância de Decimal', () => {
    expect(calculateRealizedGain([])).toBeInstanceOf(Decimal);
  });

  it('compra com quantidade zero não altera avgPrice (branch defensivo)', () => {
    // Cobre o branch newQty.isZero() no calculateRealizedGain
    const transactions: Transaction[] = [
      {
        type: 'BUY',
        date: '2024-01-01',
        quantity: new Decimal(0),
        unit_price: new Decimal('10.00'),
        fees: new Decimal(0),
      },
      sell('2024-01-02', 0, '15.00'),
    ];
    // Ambas as quantidades são zero — ganho realizado = 0
    expect(calculateRealizedGain(transactions).isZero()).toBe(true);
  });

  it('duas transações na mesma data (branch sort equal dates)', () => {
    // Cobre o branch `0` do comparador de ordenação (a.date === b.date)
    const transactions: Transaction[] = [
      buy('2024-01-01', 50, '10.00'),
      buy('2024-01-01', 50, '10.00'), // mesma data
      sell('2024-02-01', 100, '15.00'),
    ];
    // avgPrice = 10; ganho = 100 * (15 - 10) = 500
    expect(calculateRealizedGain(transactions).toString()).toBe('500');
  });
});

// ---------------------------------------------------------------------------
// Branch coverage: sort comparator equal-date em calculateCurrentQuantity
// ---------------------------------------------------------------------------

describe('Branch coverage: sort comparator com datas iguais', () => {
  it('calculateCurrentQuantity: duas compras na mesma data são processadas', () => {
    // Cobre o branch `0` do comparador em calculateCurrentQuantity
    const transactions: Transaction[] = [
      buy('2024-01-01', 30, '10.00'),
      buy('2024-01-01', 20, '10.00'), // mesma data
    ];
    const qty = calculateCurrentQuantity(transactions);
    expect(qty.toString()).toBe('50');
  });
});
