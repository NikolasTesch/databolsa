import { Suspense } from 'react';
import { HeroSection } from '@/components/market/HeroSection';
import { RelatedNewsSection } from '@/components/market/RelatedNewsSection';
import { Spinner } from '@/components/ui/Spinner';
import MarketTickerBar from '@/components/widgets/MarketTickerBar';
import HighlightsSection from '@/components/widgets/HighlightsSection';
import DividendsSection from '@/components/widgets/DividendsSection';
import ToolsSection from '@/components/widgets/ToolsSection';
import InvestorProfileQuiz from '@/components/widgets/InvestorProfileQuiz';
import B3CoursesSection from '@/components/widgets/B3CoursesSection';
import CryptoSections from '@/components/widgets/CryptoSections';
import GlossarySection from '@/components/widgets/GlossarySection';

export const dynamic = 'force-dynamic';

export default async function PublicHomePage() {
  return (
    <>
      {/* Hero */}
      <HeroSection />

      {/* Market Ticker Bar */}
      <Suspense fallback={<div className="h-32" />}>
        <MarketTickerBar />
      </Suspense>

      {/* Highlights: gainers / losers */}
      <HighlightsSection />

      {/* News */}
      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <Spinner size="md" />
          </div>
        }
      >
        <RelatedNewsSection limit={6} />
      </Suspense>

      {/* Dividends */}
      <DividendsSection />

      {/* Tools */}
      <ToolsSection />

      {/* Quiz */}
      <InvestorProfileQuiz />

      {/* Courses */}
      <B3CoursesSection />

      {/* Crypto */}
      <Suspense fallback={<div className="h-64" />}>
        <CryptoSections />
      </Suspense>

      {/* Glossary */}
      <GlossarySection />
    </>
  );
}
