import { Decimal } from 'decimal.js';
import { CRYPTO_TICKER_MAP } from './ticker-map';
import { QuoteAdapter, QuoteResult } from './quote-adapter.interface';
import { coinGeckoFetch } from '@/lib/market/coingecko-fetch';

export class CoinGeckoAdapter implements QuoteAdapter {
  async fetch(symbol: string): Promise<QuoteResult> {
    const coinId = CRYPTO_TICKER_MAP[symbol.toUpperCase()];
    if (!coinId) {
      throw new Error(`Unknown crypto symbol: ${symbol}`);
    }

    console.log(`Fetching CoinGecko quote for ${symbol} (${coinId})`);
    const response = await coinGeckoFetch(`/simple/price?ids=${coinId}&vs_currencies=brl`);
    if (!response.ok) {
      throw new Error(`CoinGecko returned ${response.status}`);
    }
    const data = await response.json();
    const price = data?.[coinId]?.brl;
    if (!price) {
      throw new Error(`No price for ${symbol}`);
    }
    return { price: new Decimal(String(price)), currency: 'BRL' };
  }
}
