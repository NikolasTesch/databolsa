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

export class FinnhubFundamentalsAdapter implements FundamentalsAdapter {
  readonly assetClass: AssetClass = 'STOCK_US';

  async fetchFundamentals(symbol: string): Promise<NormalizedFundamentals> {
    const token = process.env.FINNHUB_TOKEN ?? process.env.FINNHUB_KEY;
    const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${token ?? ''}`;
    const metricUrl = `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${token ?? ''}`;

    try {
      const [profileRes, metricRes] = await Promise.all([
        fetch(profileUrl, { signal: AbortSignal.timeout(5000) }),
        fetch(metricUrl, { signal: AbortSignal.timeout(5000) }),
      ]);

      if (!profileRes.ok && !metricRes.ok) {
        console.warn(`[fundamentals] finnhub both endpoints failed for ${symbol}`);
        return { ...EMPTY_FUNDAMENTALS };
      }

      const profile = profileRes.ok ? await profileRes.json() : {};
      const metricData = metricRes.ok ? await metricRes.json() : {};
      const metric = metricData?.metric ?? {};

      return {
        ...EMPTY_FUNDAMENTALS,
        pe: safeDecimalStr(metric['peNormalizedAnnual'] ?? metric['peTTM']),
        pb: safeDecimalStr(metric['pbAnnual'] ?? metric['pbQuarterly']),
        evEbitda: safeDecimalStr(metric['evEbitdaAnnual'] ?? metric['evEbitdaTTM']),
        debtToEquity: safeDecimalStr(metric['totalDebt/totalEquityAnnual']),
        dy: safeDecimalStr(metric['currentDividendYieldTTM']),
        roe: safeDecimalStr(metric['roeAnnual'] ?? metric['roeTTM']),
        netMargin: safeDecimalStr(metric['netProfitMarginAnnual'] ?? metric['netProfitMarginTTM']),
        eps: safeDecimalStr(metric['epsNormalizedAnnual']),
        marketCap: safeDecimalStr(profile?.marketCapitalization
          ? new Decimal(String(profile.marketCapitalization)).times(1_000_000).toString()
          : null),
        revenue: safeDecimalStr(metric['revenuePerShareAnnual']),
        change52w: safeDecimalStr(metric['52WeekHighDate'] ? null : metric['52WeekPriceReturnDaily']),
      };
    } catch (err) {
      console.warn(`[fundamentals] finnhub error for ${symbol}: ${String(err)}`);
      return { ...EMPTY_FUNDAMENTALS };
    }
  }
}
