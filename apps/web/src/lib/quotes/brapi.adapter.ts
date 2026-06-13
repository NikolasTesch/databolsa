import { Decimal } from 'decimal.js';
import { QuoteAdapter, QuoteResult } from './quote-adapter.interface';

export class BrapiAdapter implements QuoteAdapter {
  private readonly token = process.env.BRAPI_TOKEN;

  async fetch(symbol: string): Promise<QuoteResult> {
    const url = `https://brapi.dev/api/quote/${symbol}?token=${this.token}`;
    console.log(`Fetching B3 quote for ${symbol}`);
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      throw new Error(`brapi.dev returned ${response.status}`);
    }
    const data = await response.json();
    const quote = data?.results?.[0];
    if (!quote?.regularMarketPrice) {
      throw new Error(`No price for ${symbol}`);
    }
    return {
      price: new Decimal(String(quote.regularMarketPrice)),
      currency: 'BRL',
    };
  }
}
