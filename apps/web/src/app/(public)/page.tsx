import { Suspense } from 'react';
import { HeroSection } from '@/components/market/HeroSection';
import { MarketSection } from '@/components/market/MarketSection';
import { RelatedNewsSection } from '@/components/market/RelatedNewsSection';
import { ToolsSection } from '@/components/market/ToolsSection';
import { B3CoursesSection } from '@/components/market/B3CoursesSection';
import { Spinner } from '@/components/ui/Spinner';

export const dynamic = 'force-dynamic';

export default async function PublicHomePage() {
  return (
    <>
      <HeroSection />

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
