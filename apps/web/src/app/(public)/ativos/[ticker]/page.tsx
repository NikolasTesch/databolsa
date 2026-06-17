import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { AssetClass } from '@/types/api';
import { inferAssetClassForFundamentals, getFundamentals } from '@/lib/fundamentals/fundamentals.service';
import { AssetHeader } from '@/components/market/AssetHeader';
import { IndicatorGrid } from '@/components/market/IndicatorGrid';
import { PriceHistorySection } from '@/components/market/PriceHistorySection';
import { DividendsTable } from '@/components/market/DividendsTable';
import { RelatedNewsSection } from '@/components/market/RelatedNewsSection';
import { Decimal } from 'decimal.js';
import { DataSource } from '@prisma/client';
import { fetchCachedMarketValue } from '@/lib/market/market-cache';
import { CRYPTO_TICKER_MAP } from '@/lib/quotes/ticker-map';
import { CRYPTO_ID_TO_NAME } from '@/lib/market/curated-lists';
import { isValidTicker } from '@/lib/market/ticker-validation';
import {
  fetchBrapiQuote,
  fetchCoinGeckoMulti,
  fetchFinnhubQuote,
  fetchUsdBrlRate,
} from '@/lib/market/market-fetchers';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { ticker: string };
  searchParams: { class?: string };
}

async function getQuoteData(ticker: string, assetClass: AssetClass) {
  const CRYPTO_TICKER_TO_ID: Record<string, string> = Object.fromEntries(
    Object.entries(CRYPTO_TICKER_MAP).map(([t, id]) => [t, id]),
  );

  let name = ticker;
  let changePercent: string | null = null;
  let changeValue: string | null = null;
  let currency: 'BRL' | 'USD' = 'BRL';

  const getSource = (): DataSource => {
    if (assetClass === 'CRYPTO') return DataSource.COINGECKO;
    if (assetClass === 'STOCK_US') return DataSource.FINNHUB;
    return DataSource.BRAPI;
  };

  const source = getSource();

  const cached = await fetchCachedMarketValue(
    ticker,
    source,
    5 * 60 * 1000,
    async () => {
      if (assetClass === 'CRYPTO') {
        const coinId = CRYPTO_TICKER_TO_ID[ticker.toUpperCase()];
        if (!coinId) throw new Error(`Unknown crypto: ${ticker}`);
        const results = await fetchCoinGeckoMulti([coinId]);
        const r = results[coinId];
        if (!r) throw new Error(`No price for ${coinId}`);
        return {
          price: r.price,
          currency: r.currency,
          name: CRYPTO_ID_TO_NAME[coinId] ?? ticker,
          changePercent: r.changePercent,
          changeValue: null,
        };
      }

      if (assetClass === 'STOCK_US') {
        const r = await fetchFinnhubQuote(ticker);
        return {
          price: r.price,
          currency: r.currency,
          name: r.name,
          changePercent: r.changePercent,
          changeValue: r.changeValue,
        };
      }

      // B3 (STOCK_BR, FII, ETF, BDR)
      const r = await fetchBrapiQuote(ticker);
      return {
        price: r.price,
        currency: r.currency,
        name: r.name,
        changePercent: r.changePercent,
        changeValue: r.changeValue,
      };
    },
  );

  if (cached) {
    name = cached.name;
    changePercent = cached.changePercent;
    changeValue = cached.changeValue;
    currency = cached.currency as 'BRL' | 'USD';
  }

  return { cached, name, changePercent, changeValue, currency };
}

export default async function AssetAnalysisPage({ params, searchParams }: PageProps) {
  const ticker = params.ticker.toUpperCase();

  if (!isValidTicker(ticker)) notFound();

  const classHint = searchParams.class as AssetClass | undefined;
  const assetClass = classHint ?? inferAssetClassForFundamentals(ticker);

  const [quoteResult, fundamentalsResult, usdBrlResult] = await Promise.allSettled([
    getQuoteData(ticker, assetClass),
    getFundamentals(ticker, assetClass),
    fetchUsdBrlRate(),
  ]);

  if (quoteResult.status === 'rejected' || quoteResult.value.cached === null) {
    notFound();
  }

  const { cached, name, changePercent, changeValue, currency } = quoteResult.value;

  let priceInBrl: string | null = null;
  const currencyStr = currency as string;
  if (currencyStr === 'USD' && cached) {
    if (usdBrlResult.status === 'fulfilled') {
      priceInBrl = cached.price.times(usdBrlResult.value.price).toFixed(2);
    }
  } else if (cached) {
    priceInBrl = cached.price.toFixed(2);
  }

  const fundamentals = fundamentalsResult.status === 'fulfilled'
    ? fundamentalsResult.value
    : null;

  const hasDividends = !['CRYPTO', 'ETF'].includes(assetClass);
  let dividends: Array<{ paymentDate: string; value: string; type: string }> = [];

  if (hasDividends) {
    try {
      const token = process.env.BRAPI_TOKEN;
      const divRes = await fetch(
        `https://brapi.dev/api/quote/${ticker}?dividends=true&token=${token ?? ''}`,
        { signal: AbortSignal.timeout(5000) },
      );
      if (divRes.ok) {
        const divData = await divRes.json();
        const rawDividends = divData?.results?.[0]?.dividendsData?.cashDividends ?? [];
        dividends = rawDividends.map((d: { paymentDate?: string; rate?: number; type?: string }) => ({
          paymentDate: d.paymentDate?.split('T')[0] ?? '',
          value: d.rate != null ? new Decimal(String(d.rate)).toFixed(4) : '0.0000',
          type: d.type ?? 'Dividendo',
        }));
      }
    } catch {
      // ignorar falha de dividendos
    }
  }

  const price = cached ? cached.price.toFixed(assetClass === 'CRYPTO' ? 8 : 2) : '—';

  return (
    <>
      <AssetHeader
        ticker={ticker}
        name={name}
        assetClass={assetClass}
        price={price}
        priceInBrl={priceInBrl}
        currency={currency}
        changePercent={changePercent}
        changeValue={changeValue}
        stale={cached?.isStale}
      />

      {fundamentals && (
        <IndicatorGrid
          indicators={fundamentals.indicators}
          assetClass={assetClass}
        />
      )}

      <PriceHistorySection ticker={ticker} />

      <DividendsTable dividends={dividends} assetClass={assetClass} />

      <Suspense fallback={null}>
        <RelatedNewsSection ticker={ticker} limit={6} />
      </Suspense>
    </>
  );
}
