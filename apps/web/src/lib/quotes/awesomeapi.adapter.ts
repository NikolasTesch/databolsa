import { Decimal } from 'decimal.js';
import { QuoteAdapter, QuoteResult } from './quote-adapter.interface';

export class AwesomeApiAdapter implements QuoteAdapter {
  async fetch(_symbol: string): Promise<QuoteResult> {
    const url = 'https://economia.awesomeapi.com.br/last/USD-BRL';
    console.log('Fetching USD/BRL exchange rate from AwesomeAPI');
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      throw new Error(`AwesomeAPI returned ${response.status}`);
    }
    const data = await response.json();
    const rate = data?.USDBRL?.bid;
    if (!rate) {
      throw new Error('No USD/BRL rate available');
    }
    return { price: new Decimal(String(rate)), currency: 'BRL' };
  }
}
