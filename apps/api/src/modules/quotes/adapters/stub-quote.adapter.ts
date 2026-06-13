import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { QuoteAdapter, QuoteResult } from './quote-adapter.interface';

/**
 * Preços fixos determinísticos para uso em testes E2E e CI.
 * Ativado via USE_QUOTE_STUB=true — inerte em produção.
 *
 * Preços:
 *   PETR4   = R$ 36,00  (BRL)
 *   BTC     = R$ 300.000 (BRL, via CoinGecko path)
 *   AAPL    = 180 USD   (USD, via Finnhub path)
 *   USDBRL  = R$ 5,00   (para conversão USD→BRL)
 */
const STUB_PRICES: Record<string, { price: string; currency: string }> = {
  PETR4: { price: '36', currency: 'BRL' },
  BTC: { price: '300000', currency: 'BRL' },
  BTCUSDT: { price: '300000', currency: 'BRL' },
  AAPL: { price: '180', currency: 'USD' },
  // FX symbol usado pelo QuoteService internamente
  USDBRL: { price: '5', currency: 'BRL' },
};

@Injectable()
export class StubQuoteAdapter implements QuoteAdapter {
  async fetch(symbol: string): Promise<QuoteResult> {
    const entry = STUB_PRICES[symbol.toUpperCase()];
    if (!entry) {
      throw new Error(`[StubQuoteAdapter] No stub price for symbol: ${symbol}`);
    }
    return {
      price: new Decimal(entry.price),
      currency: entry.currency,
    };
  }
}
