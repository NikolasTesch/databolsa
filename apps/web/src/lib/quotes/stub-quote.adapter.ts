import { Decimal } from 'decimal.js';
import { QuoteAdapter, QuoteResult } from './quote-adapter.interface';

const STUB_PRICES: Record<string, { price: string; currency: string }> = {
  PETR4: { price: '36', currency: 'BRL' },
  BTC: { price: '300000', currency: 'BRL' },
  BTCUSDT: { price: '300000', currency: 'BRL' },
  AAPL: { price: '180', currency: 'USD' },
  USDBRL: { price: '5', currency: 'BRL' },
};

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
