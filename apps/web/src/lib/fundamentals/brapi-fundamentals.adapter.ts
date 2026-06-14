import { Decimal } from 'decimal.js';
import type { AssetClass } from '@/types/api';
import type { FundamentalsAdapter, NormalizedFundamentals } from './fundamentals-adapter.interface';
import { EMPTY_FUNDAMENTALS } from './fundamentals-adapter.interface';

function safeDecimalStr(value: unknown): string | null {
  if (value === null || value === undefined || value === '' || value === 0) return null;
  try {
    const d = new Decimal(String(value));
    if (!d.isFinite()) return null;
    return d.toString();
  } catch {
    return null;
  }
}

export class BrapiFundamentalsAdapter implements FundamentalsAdapter {
  readonly assetClass: AssetClass;

  constructor(assetClass: AssetClass = 'STOCK_BR') {
    this.assetClass = assetClass;
  }

  async fetchFundamentals(symbol: string): Promise<NormalizedFundamentals> {
    const token = process.env.BRAPI_TOKEN;
    const url = `https://brapi.dev/api/quote/${symbol}?fundamental=true&token=${token ?? ''}`;

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) {
        console.warn(`[fundamentals] brapi returned ${response.status} for ${symbol}`);
        return { ...EMPTY_FUNDAMENTALS };
      }

      const data = await response.json();
      const q = data?.results?.[0];
      if (!q) {
        console.warn(`[fundamentals] brapi no result for ${symbol}`);
        return { ...EMPTY_FUNDAMENTALS };
      }

      // brapi retorna os campos fundamentalistas diretamente no objeto quote
      return {
        ...EMPTY_FUNDAMENTALS,
        pe: safeDecimalStr(q.priceEarnings),
        pb: safeDecimalStr(q.priceToBook),
        evEbitda: safeDecimalStr(q.enterpriseValueEbitda),
        debtToEquity: safeDecimalStr(q.debtToEquity),
        dy: safeDecimalStr(q.dividendYield),
        roe: safeDecimalStr(q.returnOnEquity),
        netMargin: safeDecimalStr(q.profitMargins),
        eps: safeDecimalStr(q.eps),
        marketCap: safeDecimalStr(q.marketCap),
        // FII specific
        vacancyRate: safeDecimalStr(q.vacancyRate),
        lastDividend: safeDecimalStr(q.lastDividend),
        netWorth: safeDecimalStr(q.sumEquity),
        totalShares: safeDecimalStr(q.sharesOutstanding),
        dailyLiquidity: safeDecimalStr(q.averageDailyVolume10Day),
        adminFee: safeDecimalStr(q.annualHoldingsTurnover),
      };
    } catch (err) {
      console.warn(`[fundamentals] brapi error for ${symbol}: ${String(err)}`);
      return { ...EMPTY_FUNDAMENTALS };
    }
  }
}
