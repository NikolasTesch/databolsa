'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { getPortfolioSummary, getAllocation, getDividends, getDividendProjection } from '@/lib/api/portfolio';
import { listAssets } from '@/lib/api/assets';
import { listTransactions } from '@/lib/api/transactions';
import { Spinner } from '@/components/ui/Spinner';
import { BannerReadOnly } from '@/components/groups/BannerReadOnly';
import { DetailedPositionTable } from '@/components/portfolio/DetailedPositionTable';
import { RentabilidadePanel } from '@/components/portfolio/RentabilidadePanel';
import { ComposicaoCharts } from '@/components/portfolio/ComposicaoCharts';
import { ProventosTable } from '@/components/portfolio/ProventosTable';
import { AssetComparison } from '@/components/portfolio/AssetComparison';
import type { Transaction, DividendsResponse, DividendProjectionResponse } from '@/types/api';

const tabs = [
  { id: 'posicao', label: 'Posição' },
  { id: 'rentabilidade', label: 'Rentabilidade' },
  { id: 'composicao', label: 'Composição' },
  { id: 'proventos', label: 'Proventos' },
  { id: 'comparacao', label: 'Comparação' },
] as const;

type TabId = (typeof tabs)[number]['id'];

function PortfolioPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = (searchParams.get('tab') as TabId) ?? 'posicao';
  const targetUserId = searchParams.get('targetUserId') ?? undefined;
  const targetUserEmail = searchParams.get('userEmail') ?? undefined;

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: queryKeys.portfolio.summary(targetUserId),
    queryFn: () => getPortfolioSummary(targetUserId),
    enabled: true,
  });

  const { data: assets = [], isLoading: loadingAssets } = useQuery({
    queryKey: queryKeys.assets.list(),
    queryFn: listAssets,
  });

  const { data: allocation } = useQuery({
    queryKey: queryKeys.portfolio.allocation(targetUserId),
    queryFn: () => getAllocation(targetUserId),
    enabled: activeTab === 'composicao',
  });

  const { data: dividendsData } = useQuery({
    queryKey: queryKeys.portfolio.dividends(targetUserId),
    queryFn: () => getDividends(targetUserId),
    enabled: activeTab === 'proventos',
  });

  const { data: dividendProjection } = useQuery({
    queryKey: queryKeys.portfolio.dividendProjection(targetUserId),
    queryFn: () => getDividendProjection(targetUserId),
    enabled: activeTab === 'proventos',
  });

  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loadingTxs, setLoadingTxs] = useState(false);

  useEffect(() => {
    if (activeTab === 'proventos' && assets.length > 0) {
      setLoadingTxs(true);
      Promise.all(assets.map((a) => listTransactions(a.id)))
        .then((results) => setAllTransactions(results.flat()))
        .finally(() => setLoadingTxs(false));
    }
  }, [activeTab, assets]);

  function setTab(tab: TabId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`${pathname}?${params.toString()}`);
  }

  const isLoading = loadingSummary || loadingAssets;
  const isReadOnly = Boolean(targetUserId);

  return (
    <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-6 space-y-6">
      {isReadOnly && targetUserEmail && (
        <BannerReadOnly targetUserEmail={targetUserEmail} />
      )}

      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-[28px] text-primary">pie_chart</span>
        <h1 className="text-2xl font-semibold text-on-surface">Portfólio</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-0 overflow-x-auto" aria-label="Abas do portfólio">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:border-border hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner />
        </div>
      ) : !summary ? (
        <p className="text-sm text-on-surface-variant">Sem dados de portfólio.</p>
      ) : (
        <>
          {activeTab === 'posicao' && (
            <DetailedPositionTable positions={summary.positions} />
          )}
          {activeTab === 'rentabilidade' && (
            <RentabilidadePanel summary={summary} />
          )}
          {activeTab === 'composicao' && (
            <ComposicaoCharts
              positions={summary.positions}
              assets={assets}
              sectorData={allocation?.by_sector}
            />
          )}
          {activeTab === 'proventos' &&
            (loadingTxs ? (
              <div className="flex h-48 items-center justify-center">
                <Spinner />
              </div>
            ) : (
              <ProventosTable transactions={allTransactions} assets={assets} dividendsData={dividendsData} projectionData={dividendProjection} />
            ))}
          {activeTab === 'comparacao' && (
            <AssetComparison summary={summary} assets={assets} />
          )}
        </>
      )}
    </div>
  );
}

export default function PortfolioPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <PortfolioPageInner />
    </Suspense>
  );
}
