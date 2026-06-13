import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Decimal } from 'decimal.js';
import { QuoteAdapter, QuoteResult } from './quote-adapter.interface';

@Injectable()
export class FinnhubAdapter implements QuoteAdapter {
  private readonly logger = new Logger(FinnhubAdapter.name);
  private readonly apiKey = process.env.FINNHUB_KEY;

  async fetch(symbol: string): Promise<QuoteResult> {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.apiKey}`;
    this.logger.log(`Fetching Finnhub quote for ${symbol}`);
    const response = await axios.get(url, { timeout: 5000 });
    const price = response.data?.c;
    if (!price) {
      throw new Error(`No price for ${symbol}`);
    }
    return { price: new Decimal(String(price)), currency: 'USD' };
  }
}
