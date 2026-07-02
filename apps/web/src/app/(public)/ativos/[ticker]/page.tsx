import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
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
import { getSectorInfo, getRelatedTickers, getSectorIcon } from '@/lib/market/sector-data';
import {
  fetchBrapiQuote,
  fetchCoinGeckoMulti,
  fetchFinnhubQuote,
  fetchUsdBrlRate,
  fetchBrapiDividends,
} from '@/lib/market/market-fetchers';

export const revalidate = 300;

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
      dividends = await fetchBrapiDividends(ticker);
    } catch {
      // ignorar falha de dividendos
    }
  }

  const price = cached ? cached.price.toFixed(assetClass === 'CRYPTO' ? 8 : 2) : '—';

  const sectorInfo = getSectorInfo(ticker);
  const relatedTickers = sectorInfo ? getRelatedTickers(ticker, 6) : [];

  return (
    <div className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop pb-12">
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
        sector={sectorInfo?.sector}
        industry={sectorInfo?.industry}
      />

      {fundamentals && (
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">monitoring</span>
            <h2 className="text-lg font-semibold text-on-surface">Indicadores Fundamentalistas</h2>
          </div>
          <IndicatorGrid
            indicators={fundamentals.indicators}
            assetClass={assetClass}
          />
        </section>
      )}

      {/* Setor */}
      {sectorInfo && (
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">{getSectorIcon(sectorInfo.sector)}</span>
            <h2 className="text-lg font-semibold text-on-surface">Setor</h2>
          </div>
          <div className="bg-surface border border-border rounded-lg p-5">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[2rem] text-primary">
                {getSectorIcon(sectorInfo.sector)}
              </span>
              <div>
                <p className="text-base font-semibold text-on-surface">{sectorInfo.sector}</p>
                <p className="text-sm text-on-surface-variant">{sectorInfo.industry}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Ativos Relacionados (mesmo setor) */}
      {relatedTickers.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">layers</span>
            <h2 className="text-lg font-semibold text-on-surface">Ativos Relacionados</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {relatedTickers.map((t) => {
              const tInfo = getSectorInfo(t);
              return (
                <Link
                  key={t}
                  href={`/ativos/${t}`}
                  className="flex flex-col gap-1.5 rounded-lg border border-border bg-surface p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-200"
                >
                  <span className="text-sm font-mono font-bold text-on-surface">{t}</span>
                  {tInfo && (
                    <span className="text-caption text-on-surface-variant line-clamp-1">
                      {tInfo.industry}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary">show_chart</span>
          <h2 className="text-lg font-semibold text-on-surface">Histórico de Preços</h2>
        </div>
        <PriceHistorySection ticker={ticker} />
      </section>

      {hasDividends && dividends.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">payments</span>
            <h2 className="text-lg font-semibold text-on-surface">Proventos</h2>
          </div>
          <DividendsTable dividends={dividends} assetClass={assetClass} />
        </section>
      )}

      <section className="mt-8">
        <Suspense fallback={null}>
          <RelatedNewsSection ticker={ticker} limit={6} />
        </Suspense>
      </section>

      {/* Próximos Eventos */}
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary">event</span>
          <h2 className="text-lg font-semibold text-on-surface">Próximos Eventos</h2>
        </div>
        <div className="bg-surface border border-border rounded-lg p-8 flex flex-col items-center justify-center text-center gap-3">
          <span className="material-symbols-outlined text-[2.5rem] text-on-surface-variant/50">
            event_busy
          </span>
          <p className="text-sm text-on-surface-variant">
            Nenhum evento encontrado para os próximos dias.
          </p>
          <p className="text-caption text-on-surface-variant/60 max-w-md">
            Os eventos corporativos como assembleias, pagamentos de proventos e
            divulgação de resultados aparecerão aqui quando disponíveis.
          </p>
        </div>
      </section>
    </div>
  );
}
