import { Decimal } from 'decimal.js';
import type { AssetClass } from '@/types/api';
import type { FundamentalsAdapter, NormalizedFundamentals } from './fundamentals-adapter.interface';
import { EMPTY_FUNDAMENTALS } from './fundamentals-adapter.interface';
import { CRYPTO_TICKER_MAP } from '@/lib/quotes/ticker-map';

function safeDecimalStr(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  try {
    const d = new Decimal(String(value));
    if (!d.isFinite()) return null;
    return d.toString();
  } catch {
    return null;
  }
}

export class CoinGeckoFundamentalsAdapter implements FundamentalsAdapter {
  readonly assetClass: AssetClass = 'CRYPTO';

  async fetchFundamentals(symbol: string): Promise<NormalizedFundamentals> {
    // symbol pode ser BTC, ETH, etc. ou coinId (bitcoin, ethereum)
    const upper = symbol.toUpperCase();
    const coinId = CRYPTO_TICKER_MAP[upper] ?? symbol.toLowerCase();

    const url = `https://api.coingecko.com/api/v3/coins/${coinId}?market_data=true&community_data=false&developer_data=false`;

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) {
        console.warn(`[fundamentals] coingecko returned ${response.status} for ${coinId}`);
        return { ...EMPTY_FUNDAMENTALS };
      }

      const data = await response.json();
      const md = data?.market_data;
      if (!md) {
        return { ...EMPTY_FUNDAMENTALS };
      }

      return {
        ...EMPTY_FUNDAMENTALS,
        marketCap: safeDecimalStr(md.market_cap?.brl),
        volume24h: safeDecimalStr(md.total_volume?.brl),
        circulatingSupply: safeDecimalStr(md.circulating_supply),
        maxSupply: safeDecimalStr(md.max_supply),
        change7d: safeDecimalStr(md.price_change_percentage_7d),
        change30d: safeDecimalStr(md.price_change_percentage_30d),
      };
    } catch (err) {
      console.warn(`[fundamentals] coingecko error for ${symbol}: ${String(err)}`);
      return { ...EMPTY_FUNDAMENTALS };
    }
  }
}
