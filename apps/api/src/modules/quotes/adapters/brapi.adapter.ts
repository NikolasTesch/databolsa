import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Decimal } from 'decimal.js';
import { QuoteAdapter, QuoteResult } from './quote-adapter.interface';

@Injectable()
export class BrapiAdapter implements QuoteAdapter {
  private readonly logger = new Logger(BrapiAdapter.name);
  private readonly token = process.env.BRAPI_TOKEN;

  async fetch(symbol: string): Promise<QuoteResult> {
    const url = `https://brapi.dev/api/quote/${symbol}?token=${this.token}`;
    this.logger.log(`Fetching B3 quote for ${symbol}`);
    const response = await axios.get(url, { timeout: 5000 });
    const quote = response.data?.results?.[0];
    if (!quote?.regularMarketPrice) {
      throw new Error(`No price for ${symbol}`);
    }
    return {
      price: new Decimal(String(quote.regularMarketPrice)),
      currency: 'BRL',
    };
  }
}
