import { notFound } from 'next/navigation';
import type { AssetClass } from '@/types/api';
import { inferAssetClassForFundamentals, getFundamentals } from '@/lib/fundamentals/fundamentals.service';
import { AssetHeader } from '@/components/market/AssetHeader';
import { IndicatorGrid } from '@/components/market/IndicatorGrid';
import { PriceHistorySection } from '@/components/market/PriceHistorySection';
import { DividendsTable } from '@/components/market/DividendsTable';
import { Decimal } from 'decimal.js';
import { DataSource } from '@prisma/client';
import { fetchCachedMarketValue } from '@/lib/market/market-cache';
import { CRYPTO_TICKER_MAP } from '@/lib/quotes/ticker-map';
import { CRYPTO_ID_TO_NAME } from '@/lib/market/curated-lists';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { ticker: string };
  searchParams: { class?: string };
}

async function fetchUsdBrlRate(): Promise<Decimal | null> {
  try {
    const response = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL', {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const rate = data?.USDBRL?.bid;
    return rate ? new Decimal(String(rate)) : null;
  } catch {
    return null;
  }
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
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=brl&include_24hr_change=true`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
        const data = await res.json();
        if (!data[coinId]?.brl) throw new Error(`No price`);
        changePercent = data[coinId].brl_24h_change != null ? String(data[coinId].brl_24h_change) : null;
        name = CRYPTO_ID_TO_NAME[coinId] ?? ticker;
        return { price: new Decimal(String(data[coinId].brl)), currency: 'BRL' };
      }

      if (assetClass === 'STOCK_US') {
        const token = process.env.FINNHUB_TOKEN ?? process.env.FINNHUB_KEY;
        const [qRes, pRes] = await Promise.all([
          fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${token ?? ''}`, { signal: AbortSignal.timeout(5000) }),
          fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${token ?? ''}`, { signal: AbortSignal.timeout(5000) }),
        ]);
        if (!qRes.ok) throw new Error(`Finnhub ${qRes.status}`);
        const qData = await qRes.json();
        if (!qData?.c) throw new Error(`No price`);
        const pData = pRes.ok ? await pRes.json() : {};
        changePercent = qData.dp != null ? String(qData.dp) : null;
        changeValue = qData.d != null ? String(qData.d) : null;
        name = pData?.name ?? ticker;
        currency = 'USD';
        return { price: new Decimal(String(qData.c)), currency: 'USD' };
      }

      // B3 (STOCK_BR, FII, ETF, BDR)
      const token = process.env.BRAPI_TOKEN;
      const res = await fetch(`https://brapi.dev/api/quote/${ticker}?token=${token ?? ''}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`brapi ${res.status}`);
      const data = await res.json();
      const q = data?.results?.[0];
      if (!q?.regularMarketPrice) throw new Error(`No price`);
      changePercent = q.regularMarketChangePercent != null ? String(q.regularMarketChangePercent) : null;
      changeValue = q.regularMarketChange != null ? String(q.regularMarketChange) : null;
      name = q.longName ?? q.shortName ?? ticker;
      return { price: new Decimal(String(q.regularMarketPrice)), currency: 'BRL' };
    },
  );

  return { cached, name, changePercent, changeValue, currency };
}

export default async function AssetAnalysisPage({ params, searchParams }: PageProps) {
  const ticker = params.ticker.toUpperCase();
  const classHint = searchParams.class as AssetClass | undefined;
  const assetClass = classHint ?? inferAssetClassForFundamentals(ticker);

  // Buscar cotação e fundamentalistas em paralelo
  const [quoteResult, fundamentalsResult] = await Promise.allSettled([
    getQuoteData(ticker, assetClass),
    getFundamentals(ticker, assetClass),
  ]);

  // Se não houver cotação, retornar 404
  if (quoteResult.status === 'rejected' || quoteResult.value.cached === null) {
    notFound();
  }

  const { cached, name, changePercent, changeValue, currency } = quoteResult.value;

  let priceInBrl: string | null = null;
  const currencyStr = currency as string;
  if (currencyStr === 'USD' && cached) {
    const rate = await fetchUsdBrlRate();
    if (rate) {
      priceInBrl = cached.price.times(rate).toFixed(2);
    }
  } else if (cached) {
    priceInBrl = cached.price.toFixed(2);
  }

  const fundamentals = fundamentalsResult.status === 'fulfilled'
    ? fundamentalsResult.value
    : null;

  // Buscar dividendos se aplicável
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
    </>
  );
}
