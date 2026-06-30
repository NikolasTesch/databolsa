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
import { RevealOnScroll } from '@/components/layout/RevealOnScroll';

export const dynamic = 'force-dynamic';

export default async function PublicHomePage() {
  return (
    <>
      {/* Hero */}
      <HeroSection />

      {/* Market Ticker Bar */}
      <RevealOnScroll delay="short">
        <Suspense fallback={<div className="h-32" />}>
          <MarketTickerBar />
        </Suspense>
      </RevealOnScroll>

      {/* Highlights: gainers / losers */}
      <RevealOnScroll>
        <HighlightsSection />
      </RevealOnScroll>

      {/* News */}
      <RevealOnScroll delay="short">
        <Suspense
          fallback={
            <div className="flex justify-center py-12">
              <Spinner size="md" />
            </div>
          }
        >
          <RelatedNewsSection limit={6} />
        </Suspense>
      </RevealOnScroll>

      {/* Dividends */}
      <RevealOnScroll>
        <Suspense fallback={<div className="flex justify-center py-12"><Spinner size="md" /></div>}>
          <DividendsSection />
        </Suspense>
      </RevealOnScroll>

      {/* Tools */}
      <RevealOnScroll delay="short">
        <ToolsSection />
      </RevealOnScroll>

      {/* Quiz */}
      <RevealOnScroll>
        <InvestorProfileQuiz />
      </RevealOnScroll>

      {/* Courses */}
      <RevealOnScroll delay="short">
        <B3CoursesSection />
      </RevealOnScroll>

      {/* Crypto */}
      <RevealOnScroll>
        <Suspense fallback={<div className="h-64" />}>
          <CryptoSections />
        </Suspense>
      </RevealOnScroll>

      {/* Glossary */}
      <RevealOnScroll delay="short">
        <GlossarySection />
      </RevealOnScroll>
    </>
  );
}
