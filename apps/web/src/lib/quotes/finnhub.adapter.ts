import { Decimal } from 'decimal.js';
import { QuoteAdapter, QuoteResult } from './quote-adapter.interface';

export class FinnhubAdapter implements QuoteAdapter {
  private readonly apiKey = process.env.FINNHUB_KEY;

  async fetch(symbol: string): Promise<QuoteResult> {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.apiKey}`;
    console.log(`Fetching Finnhub quote for ${symbol}`);
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      throw new Error(`Finnhub returned ${response.status}`);
    }
    const data = await response.json();
    const price = data?.c;
    if (!price) {
      throw new Error(`No price for ${symbol}`);
    }
    return { price: new Decimal(String(price)), currency: 'USD' };
  }
}
