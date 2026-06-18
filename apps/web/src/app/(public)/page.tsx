import { Suspense } from 'react';
import { HeroSection } from '@/components/market/HeroSection';
import { IndexBar } from '@/components/market/IndexBar';
import { MarketSection } from '@/components/market/MarketSection';
import { RelatedNewsSection } from '@/components/market/RelatedNewsSection';
import { ToolsSection } from '@/components/market/ToolsSection';
import { B3CoursesSection } from '@/components/market/B3CoursesSection';
import { Spinner } from '@/components/ui/Spinner';
import { GET as getIndices } from '@/app/api/market/indices/route';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

async function fetchIndices() {
  try {
    const req = new NextRequest('http://localhost/api/market/indices');
    const res = await getIndices(req);
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.error('[PublicHomePage] Error fetching indices:', err);
    return null;
  }
}

export default async function PublicHomePage() {
  const indicesData = await fetchIndices();

  return (
    <>
      <HeroSection />

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

      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <Spinner size="md" />
          </div>
        }
      >
        <RelatedNewsSection limit={6} />
      </Suspense>

      <ToolsSection />

      <B3CoursesSection />
    </>
  );
}
