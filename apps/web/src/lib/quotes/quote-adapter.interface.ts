import { Decimal } from 'decimal.js';

export interface QuoteResult {
  price: Decimal;
  currency: string;
}

export interface QuoteAdapter {
  fetch(symbol: string): Promise<QuoteResult>;
}
