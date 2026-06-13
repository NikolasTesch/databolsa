import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Decimal } from 'decimal.js';
import { QuoteAdapter, QuoteResult } from './quote-adapter.interface';

@Injectable()
export class AwesomeApiAdapter implements QuoteAdapter {
  private readonly logger = new Logger(AwesomeApiAdapter.name);

  async fetch(_symbol: string): Promise<QuoteResult> {
    const url = 'https://economia.awesomeapi.com.br/last/USD-BRL';
    this.logger.log('Fetching USD/BRL exchange rate from AwesomeAPI');
    const response = await axios.get(url, { timeout: 5000 });
    const rate = response.data?.USDBRL?.bid;
    if (!rate) {
      throw new Error('No USD/BRL rate available');
    }
    return { price: new Decimal(String(rate)), currency: 'BRL' };
  }
}
