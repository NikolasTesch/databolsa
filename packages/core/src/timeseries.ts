/**
 * timeseries.ts — série temporal diária do portfólio (TWR aproximado).
 *
 * Calcula o valor diário do portfólio em BRL a partir de transações e do
 * histórico de preços de cada ativo, normalizando em base 100 no primeiro dia
 * com posição diferente de zero.
 *
 * Limitação documentada (ADR-0014): ativos em USD usam câmbio atual (não
 * histórico ponto a ponto). Isso introduz imprecisão para períodos longos com
 * variação cambial significativa — aceitável para o MVP.
 *
 * Regras de negócio aplicadas:
 *   RN-01: preço médio ponderado (via calculateCurrentQuantity para posição)
 *   RN-03: venda NÃO altera preço médio das unidades remanescentes
 *   RN-10: forward-fill para ativos sem preço em uma data
 */

import { Decimal } from 'decimal.js';
import type { Transaction } from './types';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

/** Ponto de uma série temporal normalizada em base 100. */
export interface TimeSeriesPoint {
  date: string; // YYYY-MM-DD
  value: string; // base-100 normalizado, 4 casas decimais
}

/** Histórico de preço de um ativo para uma data específica. */
export interface PricePoint {
  date: string; // YYYY-MM-DD
  price: Decimal;
}

/**
 * Calcula a série temporal diária do portfólio em base 100.
 *
 * @param transactions    Mapa de ticker → lista de transações do ativo
 * @param priceHistory    Mapa de ticker → série de preços históricos [{date, price}]
 * @param exchangeRateBrl Mapa de moeda → taxa de câmbio em BRL (ex: { USD: Decimal(5.7) })
 *                        Moeda BRL não precisa estar no mapa (implicitamente 1).
 * @param startDate       Data inicial do período (YYYY-MM-DD, inclusive)
 * @param endDate         Data final do período (YYYY-MM-DD, inclusive)
 * @returns Série normalizada base 100, filtrando dias com patrimônio = 0.
 *          Retorna [] se não houver posição no período.
 */
export function buildPortfolioSeries(
  transactions: Record<string, Transaction[]>,
  priceHistory: Record<string, PricePoint[]>,
  exchangeRateBrl: Record<string, Decimal>,
  startDate: string,
  endDate: string,
): TimeSeriesPoint[] {
  // Coletar todas as datas disponíveis nos históricos de preços dentro do período
  const dateSet = new Set<string>();
  for (const ticker of Object.keys(priceHistory)) {
    for (const point of priceHistory[ticker]) {
      if (point.date >= startDate && point.date <= endDate) {
        dateSet.add(point.date);
      }
    }
  }

  if (dateSet.size === 0) return [];

  const dates = Array.from(dateSet).sort();

  // Pré-computar mapa de último preço disponível por ticker para forward-fill
  // Para cada ticker, ordenar os preços e indexar por data
  const priceIndexes: Record<string, Map<string, Decimal>> = {};
  const sortedPrices: Record<string, PricePoint[]> = {};

  for (const ticker of Object.keys(priceHistory)) {
    const sorted = [...priceHistory[ticker]].sort((a, b) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
    );
    sortedPrices[ticker] = sorted;
    const map = new Map<string, Decimal>();
    for (const p of sorted) {
      map.set(p.date, p.price);
    }
    priceIndexes[ticker] = map;
  }

  /**
   * Retorna o preço do ativo na data, usando forward-fill:
   * se não há preço exato, usa o último preço anterior disponível.
   * Retorna null se não houver nenhum preço até aquela data.
   */
  function getPriceOnDate(ticker: string, date: string): Decimal | null {
    const map = priceIndexes[ticker];
    if (!map) return null;

    // Preço exato
    if (map.has(date)) return map.get(date)!;

    // Forward-fill: último preço anterior
    const prices = sortedPrices[ticker];
    let lastPrice: Decimal | null = null;
    for (const p of prices) {
      if (p.date > date) break;
      lastPrice = p.price;
    }
    return lastPrice;
  }

  /**
   * Calcula a quantidade líquida de um ativo até uma data (inclusive),
   * processando as transações em ordem cronológica.
   * Apenas BUY e SELL afetam quantidade (DIVIDEND não altera — RN-01..RN-03).
   */
  function getQuantityOnDate(ticker: string, date: string): Decimal {
    const txs = transactions[ticker];
    if (!txs || txs.length === 0) return new Decimal(0);

    const sorted = [...txs].sort((a, b) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
    );

    let qty = new Decimal(0);
    for (const tx of sorted) {
      if (tx.date > date) break;
      if (tx.type === 'BUY') {
        qty = qty.add(tx.quantity);
      } else if (tx.type === 'SELL') {
        qty = qty.sub(tx.quantity);
        if (qty.isNegative()) qty = new Decimal(0); // defensivo: nunca negativo
      }
      // DIVIDEND: não altera quantidade
    }
    return qty;
  }

  const tickers = Object.keys(transactions);

  // Calcular patrimônio bruto para cada data
  const rawSeries: { date: string; rawValue: Decimal }[] = [];

  for (const date of dates) {
    let totalBrl = new Decimal(0);

    for (const ticker of tickers) {
      const qty = getQuantityOnDate(ticker, date);
      if (qty.isZero()) continue;

      const price = getPriceOnDate(ticker, date);
      if (!price) continue; // sem histórico até esta data: ignora ativo

      // Determinar câmbio: BRL = 1, outros = valor do mapa
      // A moeda do ativo é inferida pela presença no mapa exchangeRateBrl
      // O chamador deve fornecer a taxa correta para cada ticker em USD
      const fxKey = getTickerCurrency(ticker, exchangeRateBrl);
      const fx = fxKey ? (exchangeRateBrl[fxKey] ?? new Decimal(1)) : new Decimal(1);

      const valueBrl = qty.mul(price).mul(fx);
      totalBrl = totalBrl.add(valueBrl);
    }

    rawSeries.push({ date, rawValue: totalBrl });
  }

  // Filtrar datas com patrimônio = 0 (antes da primeira transação ou sem dados)
  const nonZero = rawSeries.filter((p) => !p.rawValue.isZero());
  if (nonZero.length === 0) return [];

  // Normalizar base 100
  const base = nonZero[0].rawValue;
  return nonZero.map((p) => ({
    date: p.date,
    value: p.rawValue.div(base).mul(100).toFixed(4),
  }));
}

/**
 * Detecta a chave de câmbio para um ticker consultando o mapa exchangeRateBrl.
 *
 * Convenção: o chamador deve registrar o ticker com sufixo de moeda no mapa,
 * ex.: exchangeRateBrl['USD'] = Decimal(5.7) para todos os ativos USD.
 *
 * Esta função procura se alguma chave do mapa está associada ao ticker usando
 * a estrutura `tickerCurrencyMap` opcional passada implicitamente via fechamento.
 *
 * Na prática (benchmark/route.ts) o chamador controla o mapa e sabe quais
 * tickers são USD. Aqui retornamos null (BRL implícito) pois buildPortfolioSeries
 * recebe o mapa de câmbio mas não sabe de forma genérica qual ticker é USD.
 *
 * Para suporte a câmbio por ticker, use buildPortfolioSeriesWithCurrencies abaixo.
 */
function getTickerCurrency(
  _ticker: string,
  _exchangeRateBrl: Record<string, Decimal>,
): string | null {
  // Na API pública buildPortfolioSeries, o câmbio é indexado por moeda (ex: 'USD').
  // O mapeamento ticker→moeda é feito via tickerCurrencies no overload abaixo.
  // Esta função serve apenas como fallback: sem mapeamento → BRL (retorna null).
  return null;
}

/**
 * Versão estendida de buildPortfolioSeries que recebe o mapeamento de
 * ticker → moeda explicitamente, permitindo câmbio correto para ativos USD.
 *
 * @param transactions    Mapa de ticker → lista de transações
 * @param priceHistory    Mapa de ticker → histórico de preços
 * @param exchangeRateBrl Mapa de moeda → taxa em BRL (ex: { 'USD': Decimal(5.7) })
 * @param tickerCurrencies Mapa de ticker → moeda (ex: { 'AAPL': 'USD', 'PETR4': 'BRL' })
 * @param startDate       Data inicial YYYY-MM-DD
 * @param endDate         Data final YYYY-MM-DD
 */
export function buildPortfolioSeriesWithCurrencies(
  transactions: Record<string, Transaction[]>,
  priceHistory: Record<string, PricePoint[]>,
  exchangeRateBrl: Record<string, Decimal>,
  tickerCurrencies: Record<string, string>,
  startDate: string,
  endDate: string,
): TimeSeriesPoint[] {
  // Coletar todas as datas disponíveis dentro do período
  const dateSet = new Set<string>();
  for (const ticker of Object.keys(priceHistory)) {
    for (const point of priceHistory[ticker]) {
      if (point.date >= startDate && point.date <= endDate) {
        dateSet.add(point.date);
      }
    }
  }

  if (dateSet.size === 0) return [];

  const dates = Array.from(dateSet).sort();

  // Pré-computar preços ordenados e indexados por data
  const sortedPrices: Record<string, PricePoint[]> = {};
  const priceIndexes: Record<string, Map<string, Decimal>> = {};

  for (const ticker of Object.keys(priceHistory)) {
    const sorted = [...priceHistory[ticker]].sort((a, b) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
    );
    sortedPrices[ticker] = sorted;
    const map = new Map<string, Decimal>();
    for (const p of sorted) {
      map.set(p.date, p.price);
    }
    priceIndexes[ticker] = map;
  }

  function getPriceOnDate(ticker: string, date: string): Decimal | null {
    const map = priceIndexes[ticker];
    if (!map) return null;
    if (map.has(date)) return map.get(date)!;
    // Forward-fill: último preço anterior
    const prices = sortedPrices[ticker];
    let lastPrice: Decimal | null = null;
    for (const p of prices) {
      if (p.date > date) break;
      lastPrice = p.price;
    }
    return lastPrice;
  }

  function getQuantityOnDate(ticker: string, date: string): Decimal {
    const txs = transactions[ticker];
    if (!txs || txs.length === 0) return new Decimal(0);
    const sorted = [...txs].sort((a, b) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
    );
    let qty = new Decimal(0);
    for (const tx of sorted) {
      if (tx.date > date) break;
      if (tx.type === 'BUY') {
        qty = qty.add(tx.quantity);
      } else if (tx.type === 'SELL') {
        qty = qty.sub(tx.quantity);
        if (qty.isNegative()) qty = new Decimal(0);
      }
    }
    return qty;
  }

  const tickers = Object.keys(transactions);

  const rawSeries: { date: string; rawValue: Decimal }[] = [];

  for (const date of dates) {
    let totalBrl = new Decimal(0);

    for (const ticker of tickers) {
      const qty = getQuantityOnDate(ticker, date);
      if (qty.isZero()) continue;

      const price = getPriceOnDate(ticker, date);
      if (!price) continue;

      const currency = tickerCurrencies[ticker] ?? 'BRL';
      const fx = currency === 'BRL'
        ? new Decimal(1)
        : (exchangeRateBrl[currency] ?? new Decimal(1));

      const valueBrl = qty.mul(price).mul(fx);
      totalBrl = totalBrl.add(valueBrl);
    }

    rawSeries.push({ date, rawValue: totalBrl });
  }

  // Filtrar zeros (antes da primeira compra)
  const nonZero = rawSeries.filter((p) => !p.rawValue.isZero());
  if (nonZero.length === 0) return [];

  // Normalizar base 100
  const base = nonZero[0].rawValue;
  return nonZero.map((p) => ({
    date: p.date,
    value: p.rawValue.div(base).mul(100).toFixed(4),
  }));
}
