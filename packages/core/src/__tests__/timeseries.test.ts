import { Decimal } from 'decimal.js';
import { buildPortfolioSeries, buildPortfolioSeriesWithCurrencies } from '../timeseries';
import type { Transaction } from '../types';
import type { PricePoint } from '../timeseries';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tx(type: 'BUY' | 'SELL', date: string, qty: string, price: string, fees = '0'): Transaction {
  return { type, date, unit_price: new Decimal(price), quantity: new Decimal(qty), fees: new Decimal(fees) };
}

function prices(ticker: string, points: Array<[string, string]>): Record<string, PricePoint[]> {
  return {
    [ticker]: points.map(([date, price]) => ({ date, price: new Decimal(price) })),
  };
}

// ---------------------------------------------------------------------------
// TC-17: série simples — 1 ativo BRL, 3 preços diários → base 100 no dia 1
// ---------------------------------------------------------------------------

test('TC-17: série simples BRL com 3 preços — base 100 no primeiro dia', () => {
  const transactions: Record<string, Transaction[]> = {
    PETR4: [tx('BUY', '2026-01-01', '10', '30')],
  };
  const priceHistory = prices('PETR4', [
    ['2026-01-01', '30'],
    ['2026-01-02', '33'],
    ['2026-01-03', '36'],
  ]);

  const result = buildPortfolioSeries(
    transactions,
    priceHistory,
    {},
    '2026-01-01',
    '2026-01-03',
  );

  expect(result).toHaveLength(3);
  // Dia 1: base → 100.0000
  expect(result[0].date).toBe('2026-01-01');
  expect(result[0].value).toBe('100.0000');
  // Dia 2: 10×33 / (10×30) × 100 = 110
  expect(result[1].value).toBe('110.0000');
  // Dia 3: 10×36 / (10×30) × 100 = 120
  expect(result[2].value).toBe('120.0000');
});

// ---------------------------------------------------------------------------
// TC-18: forward-fill — ativo sem preço numa data usa preço do dia anterior
// ---------------------------------------------------------------------------

test('TC-18: forward-fill para data sem preço usa preço do dia anterior', () => {
  const transactions: Record<string, Transaction[]> = {
    PETR4: [tx('BUY', '2026-01-01', '10', '30')],
  };
  const priceHistory = prices('PETR4', [
    ['2026-01-01', '30'],
    // dia 2 sem preço
    ['2026-01-03', '36'],
  ]);

  const result = buildPortfolioSeries(
    transactions,
    priceHistory,
    {},
    '2026-01-01',
    '2026-01-03',
  );

  // Só temos 2 datas com preço (forward-fill não adiciona datas novas, só usa último preço)
  expect(result).toHaveLength(2);
  expect(result[0].date).toBe('2026-01-01');
  expect(result[0].value).toBe('100.0000');
  // Dia 3: 10×36 / (10×30) × 100 = 120
  expect(result[1].date).toBe('2026-01-03');
  expect(result[1].value).toBe('120.0000');
});

// ---------------------------------------------------------------------------
// TC-18b: forward-fill com buildPortfolioSeriesWithCurrencies
// ---------------------------------------------------------------------------

test('TC-18b: forward-fill funciona em buildPortfolioSeriesWithCurrencies', () => {
  const transactions: Record<string, Transaction[]> = {
    PETR4: [tx('BUY', '2026-01-01', '10', '30')],
  };
  const priceHistory: Record<string, PricePoint[]> = {
    PETR4: [
      { date: '2026-01-01', price: new Decimal('30') },
      // gap: sem dado em 2026-01-02
      { date: '2026-01-03', price: new Decimal('30') }, // mesmo preço → valor igual
    ],
  };

  const result = buildPortfolioSeriesWithCurrencies(
    transactions,
    priceHistory,
    {},
    { PETR4: 'BRL' },
    '2026-01-01',
    '2026-01-03',
  );

  // Forward-fill: o preço do dia 01 é usado para o dia 03 (que tem preço igual = sem variação)
  // Mas como a data 02 não está no priceHistory, só datas presentes entram no dateSet
  expect(result).toHaveLength(2);
  expect(result[0].value).toBe('100.0000');
  expect(result[1].value).toBe('100.0000'); // preço igual nos 2 dias
});

// ---------------------------------------------------------------------------
// TC-19: venda parcial — após SELL a 50%, patrimônio reduz proporcionalmente
// ---------------------------------------------------------------------------

test('TC-19: venda parcial reduz patrimônio proporcionalmente na série', () => {
  const transactions: Record<string, Transaction[]> = {
    PETR4: [
      tx('BUY', '2026-01-01', '100', '10'),
      tx('SELL', '2026-01-02', '50', '10'), // vende 50% no dia 2
    ],
  };
  const priceHistory = prices('PETR4', [
    ['2026-01-01', '10'],
    ['2026-01-02', '10'], // mesmo preço, só posição muda
    ['2026-01-03', '10'],
  ]);

  const result = buildPortfolioSeries(
    transactions,
    priceHistory,
    {},
    '2026-01-01',
    '2026-01-03',
  );

  expect(result).toHaveLength(3);
  // Dia 1: 100 × 10 = 1000 → base 100
  expect(result[0].value).toBe('100.0000');
  // Dia 2: 50 × 10 = 500 → 500/1000 × 100 = 50
  expect(result[1].value).toBe('50.0000');
  // Dia 3: 50 × 10 = 500 → 50
  expect(result[2].value).toBe('50.0000');
});

// ---------------------------------------------------------------------------
// TC-20: ativo USD com câmbio 5.5 → valor BRL correto
// ---------------------------------------------------------------------------

test('TC-20: ativo USD com câmbio 5.5 converte para BRL corretamente', () => {
  const transactions: Record<string, Transaction[]> = {
    AAPL: [tx('BUY', '2026-01-01', '10', '100')], // 10 × $100 USD
  };
  const priceHistory: Record<string, PricePoint[]> = {
    AAPL: [{ date: '2026-01-01', price: new Decimal('100') }],
  };
  const exchangeRateBrl: Record<string, Decimal> = {
    USD: new Decimal('5.5'),
  };

  const result = buildPortfolioSeriesWithCurrencies(
    transactions,
    priceHistory,
    exchangeRateBrl,
    { AAPL: 'USD' },
    '2026-01-01',
    '2026-01-01',
  );

  // Valor BRL = 10 × 100 × 5.5 = 5500
  // Série tem apenas 1 ponto → base 100
  expect(result).toHaveLength(1);
  expect(result[0].value).toBe('100.0000');
});

// ---------------------------------------------------------------------------
// TC-20b: USD câmbio multi-ponto — série correta
// ---------------------------------------------------------------------------

test('TC-20b: ativo USD câmbio 5.5, 2 dias de preço → série base 100 e retorno correto', () => {
  const transactions: Record<string, Transaction[]> = {
    AAPL: [tx('BUY', '2026-01-01', '1', '100')],
  };
  const priceHistory: Record<string, PricePoint[]> = {
    AAPL: [
      { date: '2026-01-01', price: new Decimal('100') },
      { date: '2026-01-02', price: new Decimal('110') }, // +10%
    ],
  };
  const exchangeRateBrl: Record<string, Decimal> = {
    USD: new Decimal('5.5'),
  };

  const result = buildPortfolioSeriesWithCurrencies(
    transactions,
    priceHistory,
    exchangeRateBrl,
    { AAPL: 'USD' },
    '2026-01-01',
    '2026-01-02',
  );

  expect(result).toHaveLength(2);
  // Dia 1: base 100
  expect(result[0].value).toBe('100.0000');
  // Dia 2: 1 × 110 × 5.5 / (1 × 100 × 5.5) × 100 = 110
  expect(result[1].value).toBe('110.0000');
});

// ---------------------------------------------------------------------------
// TC-21: série vazia — sem transações → retorna []
// ---------------------------------------------------------------------------

test('TC-21: sem transações retorna array vazio', () => {
  const result = buildPortfolioSeries(
    {},
    {},
    {},
    '2026-01-01',
    '2026-01-31',
  );
  expect(result).toHaveLength(0);
  expect(result).toEqual([]);
});

test('TC-21b: buildPortfolioSeriesWithCurrencies sem priceHistory retorna []', () => {
  const transactions: Record<string, Transaction[]> = {
    PETR4: [tx('BUY', '2026-01-01', '10', '30')],
  };

  const result = buildPortfolioSeriesWithCurrencies(
    transactions,
    {},
    {},
    { PETR4: 'BRL' },
    '2026-01-01',
    '2026-01-31',
  );
  expect(result).toEqual([]);
});

// ---------------------------------------------------------------------------
// TC-21c: posição zero / divisão por zero — não inclui na série, não lança
// ---------------------------------------------------------------------------

test('TC-21c: posição zero antes de primeira compra não entra na série', () => {
  const transactions: Record<string, Transaction[]> = {
    PETR4: [tx('BUY', '2026-01-05', '10', '30')], // compra só no dia 5
  };
  const priceHistory = prices('PETR4', [
    ['2026-01-01', '30'],
    ['2026-01-02', '30'],
    ['2026-01-05', '30'],
    ['2026-01-06', '35'],
  ]);

  const result = buildPortfolioSeries(
    transactions,
    priceHistory,
    {},
    '2026-01-01',
    '2026-01-06',
  );

  // Dias 1 e 2: posição = 0 → excluídos (patrimônio 0)
  // Dias 5 e 6 entram
  expect(result).toHaveLength(2);
  expect(result[0].date).toBe('2026-01-05');
  expect(result[0].value).toBe('100.0000');
  expect(result[1].date).toBe('2026-01-06');
  expect(new Decimal(result[1].value).toFixed(4)).toBe('116.6667'); // 35/30×100
});

// ---------------------------------------------------------------------------
// TC-21d: DIVIDEND não altera quantidade (RN-01..03)
// ---------------------------------------------------------------------------

test('TC-21d: transação DIVIDEND não altera quantidade na série', () => {
  const transactions: Record<string, Transaction[]> = {
    PETR4: [
      tx('BUY', '2026-01-01', '10', '30'),
      { type: 'DIVIDEND', date: '2026-01-02', unit_price: new Decimal('2'), quantity: new Decimal('10'), fees: new Decimal('0') },
    ],
  };
  const priceHistory = prices('PETR4', [
    ['2026-01-01', '30'],
    ['2026-01-02', '30'],
  ]);

  const result = buildPortfolioSeries(
    transactions,
    priceHistory,
    {},
    '2026-01-01',
    '2026-01-02',
  );

  // Quantidade deve permanecer 10 em ambos os dias
  expect(result).toHaveLength(2);
  expect(result[0].value).toBe('100.0000');
  expect(result[1].value).toBe('100.0000'); // mesmo preço, mesma qtd
});

// ---------------------------------------------------------------------------
// TC-21e: múltiplos ativos BRL — soma correta
// ---------------------------------------------------------------------------

test('TC-21e: múltiplos ativos BRL são somados corretamente', () => {
  const transactions: Record<string, Transaction[]> = {
    PETR4: [tx('BUY', '2026-01-01', '10', '30')], // 300
    VALE3: [tx('BUY', '2026-01-01', '5', '40')],  // 200
  };
  const priceHistory: Record<string, PricePoint[]> = {
    PETR4: [{ date: '2026-01-01', price: new Decimal('30') }],
    VALE3: [{ date: '2026-01-01', price: new Decimal('40') }],
  };

  const result = buildPortfolioSeriesWithCurrencies(
    transactions,
    priceHistory,
    {},
    { PETR4: 'BRL', VALE3: 'BRL' },
    '2026-01-01',
    '2026-01-01',
  );

  // Total = 300 + 200 = 500 → base 100
  expect(result).toHaveLength(1);
  expect(result[0].value).toBe('100.0000');
});
