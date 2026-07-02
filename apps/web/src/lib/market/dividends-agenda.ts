import { fetchBrapiDividends, fetchBrapiQuote } from './market-fetchers';
import { fetchCachedMarketValue } from '@/lib/market/market-cache';
import { DataSource } from '@prisma/client';
import { CURATED_LISTS } from './curated-lists';

export interface AgendaItem {
  ticker: string;
  assetClass: 'STOCK_BR' | 'FII';
  type: string;
  dateCom: string;
  payment: string;
  value: string;
  yieldPct: string;
}

// Cache em memória
let cachedAgenda: { data: AgendaItem[]; expiresAt: number } | null = null;
const TTL_MS = 60 * 60 * 1000;

function chunk<T>(arr: T[], size: number): T[][] {
  const r: T[][] = [];
  for (let i = 0; i < arr.length; i += size) r.push(arr.slice(i, i + size));
  return r;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function getDividendsAgenda(): Promise<AgendaItem[]> {
  if (cachedAgenda && Date.now() < cachedAgenda.expiresAt) return cachedAgenda.data;

  const tickers: Array<{ ticker: string; assetClass: 'STOCK_BR' | 'FII' }> = [
    ...CURATED_LISTS.STOCK_BR.map((t) => ({ ticker: t, assetClass: 'STOCK_BR' as const })),
    ...CURATED_LISTS.FII.map((t) => ({ ticker: t, assetClass: 'FII' as const })),
  ];

  const results: AgendaItem[] = [];
  const batches = chunk(tickers, 5);

  for (const batch of batches) {
    const batchResults = await Promise.allSettled(
      batch.map(async ({ ticker, assetClass }) => {
        const [dividends, cacheResult] = await Promise.all([
          fetchBrapiDividends(ticker),
          fetchCachedMarketValue(
            ticker,
            DataSource.BRAPI,
            undefined,
            () => fetchBrapiQuote(ticker),
          ).catch(() => null),
        ]);
        const price = cacheResult?.price ?? null;
        return dividends.map((d) => {
          let yieldPct: string;
          if (price && parseFloat(d.value) > 0) {
            const yieldValue = (parseFloat(d.value) / parseFloat(price.toString())) * 100;
            yieldPct = yieldValue.toFixed(2) + '%';
          } else {
            yieldPct = '—';
          }
          return {
            ticker,
            assetClass,
            type:
              d.type === 'Juros Sobre Capital Próprio'
                ? 'JCP'
                : d.type === 'Dividendo'
                  ? 'Dividendo'
                  : d.type,
            dateCom: d.paymentDate
              ? new Date(d.paymentDate).toLocaleDateString('pt-BR')
              : '—',
            payment: d.paymentDate
              ? new Date(d.paymentDate).toLocaleDateString('pt-BR')
              : '—',
            value: d.value,
            yieldPct,
          };
        });
      }),
    );
    for (const r of batchResults) {
      if (r.status === 'fulfilled') results.push(...r.value);
    }
    if (batches.length > 1) await delay(200);
  }

  results.sort((a, b) => a.payment.localeCompare(b.payment));
  cachedAgenda = { data: results, expiresAt: Date.now() + TTL_MS };
  return results;
}
