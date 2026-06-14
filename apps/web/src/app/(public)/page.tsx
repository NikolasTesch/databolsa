import { Suspense } from 'react';
import { SearchBar } from '@/components/market/SearchBar';
import { QuickChip } from '@/components/market/QuickChip';
import { IndexBar } from '@/components/market/IndexBar';
import { MarketSection } from '@/components/market/MarketSection';
import { Spinner } from '@/components/ui/Spinner';

export const dynamic = 'force-dynamic';

const QUICK_CHIPS = [
  { label: 'PETR4', href: '/ativos/PETR4?class=STOCK_BR' },
  { label: 'VALE3', href: '/ativos/VALE3?class=STOCK_BR' },
  { label: 'ITUB4', href: '/ativos/ITUB4?class=STOCK_BR' },
  { label: 'BBDC4', href: '/ativos/BBDC4?class=STOCK_BR' },
  { label: 'BTC', href: '/ativos/BTC?class=CRYPTO' },
  { label: 'AAPL', href: '/ativos/AAPL?class=STOCK_US' },
];

async function fetchIndices() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/market/indices`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function PublicHomePage() {
  const indicesData = await fetchIndices();

  return (
    <>
      <section className="bg-background py-16 md:py-24" aria-label="Busca de ativos">
        <div className="mx-auto max-w-3xl px-4 flex flex-col items-center text-center gap-6">
          <h1 className="text-3xl md:text-4xl font-bold text-content max-w-2xl">
            Análise de ativos e acompanhamento de carteira
          </h1>
          <p className="text-lg text-content-muted">
            B3, criptos, stocks americanos e muito mais.
          </p>

          <div className="w-full">
            <Suspense fallback={null}>
              <SearchBar variant="hero" />
            </Suspense>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-content-muted">Mais buscados:</span>
            {QUICK_CHIPS.map((chip) => (
              <QuickChip key={chip.label} label={chip.label} href={chip.href} />
            ))}
          </div>
        </div>
      </section>

      {indicesData?.indices ? (
        <IndexBar indices={indicesData.indices} />
      ) : (
        <div className="bg-surface border-y border-border py-3 px-4 text-center text-xs text-content-muted">
          Indicadores de mercado indisponíveis no momento
        </div>
      )}

      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner size="md" />
          </div>
        }
      >
        <MarketSection />
      </Suspense>
    </>
  );
}
