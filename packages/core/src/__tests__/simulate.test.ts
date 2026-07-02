import { Decimal } from 'decimal.js';
import { simulatePosition } from '../simulate';
import type { SimulationInput } from '../simulate';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function input(overrides: Partial<SimulationInput> = {}): SimulationInput {
  return {
    current_quantity: new Decimal('100'),
    current_avg_price: new Decimal('10'),
    current_invested_brl: new Decimal('1000'),
    current_portfolio_value_brl: new Decimal('5000'),
    current_quote_brl: new Decimal('12'),
    hypothetical: {
      type: 'BUY',
      quantity: new Decimal('50'),
      price: new Decimal('16'),
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// TC-01: BUY adicional recalcula preço médio (RN-01)
// ---------------------------------------------------------------------------

test('TC-01: BUY adicional recalcula avg price corretamente', () => {
  // posição: 100 @ R$10 → compra 50 @ R$16
  // novo avg = (100×10 + 50×16) / 150 = 1800/150 = 12
  const result = simulatePosition(input());

  expect(result.new_quantity.toString()).toBe('150');
  expect(result.new_avg_price.toFixed(4)).toBe('12.0000');
  expect(result.new_invested_brl.toString()).toBe('1800');
  expect(result.delta_quantity.toString()).toBe('50');
});

// ---------------------------------------------------------------------------
// TC-02: BUY na posição zero — avg = preço da compra
// ---------------------------------------------------------------------------

test('TC-02: BUY em posição zero: avg = preço hipotético', () => {
  const result = simulatePosition(
    input({
      current_quantity: new Decimal('0'),
      current_avg_price: new Decimal('0'),
      current_invested_brl: new Decimal('0'),
      hypothetical: { type: 'BUY', quantity: new Decimal('50'), price: new Decimal('20') },
    }),
  );

  expect(result.new_quantity.toString()).toBe('50');
  expect(result.new_avg_price.toString()).toBe('20');
  expect(result.new_invested_brl.toString()).toBe('1000');
});

// ---------------------------------------------------------------------------
// TC-03: SELL parcial mantém avg price, reduz quantidade (RN-03)
// ---------------------------------------------------------------------------

test('TC-03: SELL parcial mantém avg price e reduz qtd', () => {
  const result = simulatePosition(
    input({
      hypothetical: { type: 'SELL', quantity: new Decimal('30'), price: new Decimal('15') },
    }),
  );

  expect(result.new_quantity.toString()).toBe('70');
  expect(result.new_avg_price.toString()).toBe('10'); // RN-03: inalterado
  expect(result.new_invested_brl.toString()).toBe('700');
  expect(result.delta_quantity.toString()).toBe('-30');
});

// ---------------------------------------------------------------------------
// TC-04: SELL total — quantidade e invested = 0
// ---------------------------------------------------------------------------

test('TC-04: SELL total zera quantidade e invested', () => {
  const result = simulatePosition(
    input({
      hypothetical: { type: 'SELL', quantity: new Decimal('100'), price: new Decimal('15') },
    }),
  );

  expect(result.new_quantity.toString()).toBe('0');
  expect(result.new_avg_price.toString()).toBe('10'); // avg original mantida
  expect(result.new_invested_brl.toString()).toBe('0');
  expect(result.new_current_value_brl!.toString()).toBe('0');
});

// ---------------------------------------------------------------------------
// TC-05: SELL > posição lança SELL_EXCEEDS_POSITION (RN-02)
// ---------------------------------------------------------------------------

test('TC-05: SELL maior que posição lança erro RN-02', () => {
  expect(() =>
    simulatePosition(
      input({
        current_quantity: new Decimal('50'),
        hypothetical: { type: 'SELL', quantity: new Decimal('60'), price: new Decimal('10') },
      }),
    ),
  ).toThrow('SELL_EXCEEDS_POSITION');
});

// ---------------------------------------------------------------------------
// TC-06: Ativo sem cotação — valores de mercado retornam null
// ---------------------------------------------------------------------------

test('TC-06: cotação null → valores de mercado null, sem erro', () => {
  const result = simulatePosition(
    input({ current_quote_brl: null }),
  );

  expect(result.new_quantity.toString()).toBe('150');
  expect(result.new_current_value_brl).toBeNull();
  expect(result.new_allocation_pct).toBeNull();
  expect(result.pl_brl).toBeNull();
  expect(result.pl_pct).toBeNull();
});

// ---------------------------------------------------------------------------
// TC-07: Patrimônio zero — allocation retorna null (sem divisão por zero)
// ---------------------------------------------------------------------------

test('TC-07: patrimônio zero → allocation null', () => {
  const result = simulatePosition(
    input({
      current_quantity: new Decimal('0'),
      current_avg_price: new Decimal('0'),
      current_invested_brl: new Decimal('0'),
      current_portfolio_value_brl: new Decimal('0'),
      current_quote_brl: new Decimal('10'),
      hypothetical: { type: 'BUY', quantity: new Decimal('10'), price: new Decimal('10') },
    }),
  );

  // patrimônio ajustado = 0 - 0 + 100 = 100, então allocation não é null aqui
  // caso correto de patrimônio zero: ativo era o único e foi zerado
  expect(result.new_allocation_pct).not.toBeNull(); // novo ativo entra no patrimônio

  // patrimônio realmente zero: nenhum ativo com cotação
  const result2 = simulatePosition(
    input({
      current_portfolio_value_brl: new Decimal('0'),
      current_quote_brl: new Decimal('10'),
      hypothetical: { type: 'SELL', quantity: new Decimal('100'), price: new Decimal('10') },
    }),
  );
  // adjusted = 0 - (100×10) + 0 = -1000... na prática patrimônio nunca seria negativo
  // O caso de patrimônio zero real ocorre quando adjusted_portfolio.isZero()
  // Testar via: patrimônio igual ao valor atual do ativo, SELL total
  const result3 = simulatePosition(
    input({
      current_quantity: new Decimal('100'),
      current_avg_price: new Decimal('10'),
      current_invested_brl: new Decimal('1000'),
      current_portfolio_value_brl: new Decimal('1200'), // patrimônio = apenas este ativo (100×12)
      current_quote_brl: new Decimal('12'),
      hypothetical: { type: 'SELL', quantity: new Decimal('100'), price: new Decimal('12') },
    }),
  );
  // adjusted = 1200 - 1200 + 0 = 0 → null
  expect(result3.new_allocation_pct).toBeNull();
});

// ---------------------------------------------------------------------------
// TC-08: BUY com taxas — taxas entram no cálculo do avg (RN-01)
// ---------------------------------------------------------------------------

test('TC-08: BUY com taxas incluídas no cálculo do avg', () => {
  // posição: 100 @ R$10 = R$1000
  // compra: 100 @ R$10 com R$20 de taxa
  // novo avg = (1000 + 100×10 + 20) / 200 = 2020/200 = 10.10
  const result = simulatePosition(
    input({
      hypothetical: {
        type: 'BUY',
        quantity: new Decimal('100'),
        price: new Decimal('10'),
        fees: new Decimal('20'),
      },
    }),
  );

  expect(result.new_quantity.toString()).toBe('200');
  expect(result.new_avg_price.toString()).toBe('10.1');
  expect(result.new_invested_brl.toString()).toBe('2020');
});

// ---------------------------------------------------------------------------
// TC-09: delta_invested_brl reflete a diferença correta
// ---------------------------------------------------------------------------

test('TC-09: delta_invested_brl é a diferença entre novo e atual invested', () => {
  // BUY 50 @ 16 → new_invested = 1800, current = 1000, delta = 800
  const result = simulatePosition(input());
  expect(result.delta_invested_brl.toString()).toBe('800');

  // SELL 30 → new_invested = 700, current = 1000, delta = -300
  const result2 = simulatePosition(
    input({
      hypothetical: { type: 'SELL', quantity: new Decimal('30'), price: new Decimal('15') },
    }),
  );
  expect(result2.delta_invested_brl.toString()).toBe('-300');
});

// ---------------------------------------------------------------------------
// TC-10: BUY com quantidade zero — new_quantity.isZero() = true (branch)
// ---------------------------------------------------------------------------

test('TC-10: BUY com quantidade zero — avg price zero (branch new_quantity.isZero)', () => {
  // current_quantity = 0 + hypothetical.quantity = 0 → new_quantity = 0 → isZero() = true
  const result = simulatePosition(
    input({
      current_quantity: new Decimal('0'),
      current_avg_price: new Decimal('0'),
      current_invested_brl: new Decimal('0'),
      hypothetical: { type: 'BUY', quantity: new Decimal('0'), price: new Decimal('20') },
    }),
  );
  expect(result.new_quantity.isZero()).toBe(true);
  expect(result.new_avg_price.isZero()).toBe(true);
  expect(result.new_invested_brl.isZero()).toBe(true);
});
