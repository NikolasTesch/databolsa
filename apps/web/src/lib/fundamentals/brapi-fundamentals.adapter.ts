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
    const modulesUrl = `https://brapi.dev/api/quote/${symbol}?modules=defaultKeyStatistics,financialData&token=${token ?? ''}`;

    try {
      console.log(`[fundamentals] trying modules query for ${symbol}`);
      const response = await fetch(modulesUrl, { signal: AbortSignal.timeout(5000) });
      
      if (response.ok) {
        const data = await response.json();
        const q = data?.results?.[0];
        if (q && (q.defaultKeyStatistics || q.financialData)) {
          const stats = q.defaultKeyStatistics ?? {};
          const fin = q.financialData ?? {};

          const toPctStr = (val: unknown) => {
            const d = safeDecimalStr(val);
            return d ? new Decimal(d).times(100).toString() : null;
          };

          return {
            ...EMPTY_FUNDAMENTALS,
            pe: safeDecimalStr(stats.trailingPE ?? q.priceEarnings),
            pb: safeDecimalStr(stats.priceToBook),
            evEbitda: safeDecimalStr(stats.enterpriseToEbitda),
            debtToEquity: safeDecimalStr(fin.debtToEquity),
            dy: toPctStr(stats.dividendYield),
            roe: toPctStr(fin.returnOnEquity),
            netMargin: toPctStr(fin.profitMargins),
            eps: safeDecimalStr(stats.earningsPerShare ?? q.earningsPerShare),
            marketCap: safeDecimalStr(q.marketCap ?? stats.marketCap),
            // FII specific
            vacancyRate: safeDecimalStr(q.vacancyRate),
            lastDividend: safeDecimalStr(q.lastDividend),
            netWorth: safeDecimalStr(q.sumEquity),
            totalShares: safeDecimalStr(q.sharesOutstanding ?? stats.sharesOutstanding),
            dailyLiquidity: safeDecimalStr(q.averageDailyVolume10Day),
            adminFee: safeDecimalStr(q.annualHoldingsTurnover),
          };
        }
      }
      
      console.warn(`[fundamentals] brapi modules failed with status ${response.status} for ${symbol}, falling back to fundamental=true`);
    } catch (err) {
      console.warn(`[fundamentals] brapi modules error for ${symbol}: ${String(err)}, falling back to fundamental=true`);
    }

    // Fallback: usar fundamental=true para obter os campos básicos retornados no quote raiz
    const fallbackUrl = `https://brapi.dev/api/quote/${symbol}?fundamental=true&token=${token ?? ''}`;
    try {
      const response = await fetch(fallbackUrl, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) {
        console.warn(`[fundamentals] brapi fallback returned ${response.status} for ${symbol}`);
        return { ...EMPTY_FUNDAMENTALS };
      }

      const data = await response.json();
      const q = data?.results?.[0];
      if (!q) {
        console.warn(`[fundamentals] brapi fallback no result for ${symbol}`);
        return { ...EMPTY_FUNDAMENTALS };
      }

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
        vacancyRate: safeDecimalStr(q.vacancyRate),
        lastDividend: safeDecimalStr(q.lastDividend),
        netWorth: safeDecimalStr(q.sumEquity),
        totalShares: safeDecimalStr(q.sharesOutstanding),
        dailyLiquidity: safeDecimalStr(q.averageDailyVolume10Day),
        adminFee: safeDecimalStr(q.annualHoldingsTurnover),
      };
    } catch (err) {
      console.warn(`[fundamentals] brapi fallback error for ${symbol}: ${String(err)}`);
      return { ...EMPTY_FUNDAMENTALS };
    }
  }
}
