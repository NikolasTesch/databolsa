'use client';

import dynamic from 'next/dynamic';

const SectionSkeleton = ({ height = 'h-64' }: { height?: string }) => (
  <div className={`${height} mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop`}>
    <div className="h-full rounded-lg bg-surface-muted/40 animate-pulse" />
  </div>
);

export const LazyInvestorProfileQuiz = dynamic(
  () => import('@/components/widgets/InvestorProfileQuiz'),
  {
    loading: () => <SectionSkeleton height="h-80" />,
    ssr: false,
  },
);

export const LazyGlossarySection = dynamic(
  () => import('@/components/widgets/GlossarySection'),
  {
    loading: () => <SectionSkeleton height="h-72" />,
    ssr: false,
  },
);
