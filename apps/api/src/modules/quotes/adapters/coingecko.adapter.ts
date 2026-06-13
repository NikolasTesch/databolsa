import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Decimal } from 'decimal.js';
import { CRYPTO_TICKER_MAP } from '../ticker-map';
import { QuoteAdapter, QuoteResult } from './quote-adapter.interface';

@Injectable()
export class CoinGeckoAdapter implements QuoteAdapter {
  private readonly logger = new Logger(CoinGeckoAdapter.name);

  async fetch(symbol: string): Promise<QuoteResult> {
    const coinId = CRYPTO_TICKER_MAP[symbol.toUpperCase()];
    if (!coinId) {
      throw new Error(`Unknown crypto symbol: ${symbol}`);
    }

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=brl`;
    this.logger.log(`Fetching CoinGecko quote for ${symbol} (${coinId})`);
    const response = await axios.get(url, { timeout: 5000 });
    const price = response.data?.[coinId]?.brl;
    if (!price) {
      throw new Error(`No price for ${symbol}`);
    }
    return { price: new Decimal(String(price)), currency: 'BRL' };
  }
}
