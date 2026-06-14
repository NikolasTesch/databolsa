'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { getPortfolioSummary } from '@/lib/api/portfolio';
import { listAssets } from '@/lib/api/assets';
import { listTransactions } from '@/lib/api/transactions';
import { Spinner } from '@/components/ui/Spinner';
import { DetailedPositionTable } from '@/components/portfolio/DetailedPositionTable';
import { RentabilidadePanel } from '@/components/portfolio/RentabilidadePanel';
import { ComposicaoCharts } from '@/components/portfolio/ComposicaoCharts';
import { ProventosTable } from '@/components/portfolio/ProventosTable';
import { AssetComparison } from '@/components/portfolio/AssetComparison';
import type { Transaction } from '@/types/api';

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

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: queryKeys.portfolio.summary(),
    queryFn: getPortfolioSummary,
  });

  const { data: assets = [], isLoading: loadingAssets } = useQuery({
    queryKey: queryKeys.assets.list(),
    queryFn: listAssets,
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Portfólio</h1>

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
                  : 'border-transparent text-content-muted hover:border-border hover:text-content'
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
        <p className="text-sm text-content-muted">Sem dados de portfólio.</p>
      ) : (
        <>
          {activeTab === 'posicao' && (
            <DetailedPositionTable positions={summary.positions} />
          )}
          {activeTab === 'rentabilidade' && (
            <RentabilidadePanel summary={summary} />
          )}
          {activeTab === 'composicao' && (
            <ComposicaoCharts positions={summary.positions} assets={assets} />
          )}
          {activeTab === 'proventos' &&
            (loadingTxs ? (
              <div className="flex h-48 items-center justify-center">
                <Spinner />
              </div>
            ) : (
              <ProventosTable transactions={allTransactions} assets={assets} />
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
