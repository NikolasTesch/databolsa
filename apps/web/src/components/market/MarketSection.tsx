'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { MarketTabs } from './MarketTabs';
import { AssetMiniCard } from './AssetMiniCard';
import { Spinner } from '@/components/ui/Spinner';
import type { AssetClass } from '@/types/api';

interface HighlightItem {
  ticker: string;
  name: string;
  assetClass: AssetClass;
  price: string;
  changePercent: string;
  stale?: boolean;
}

interface HighlightsResponse {
  gainers: HighlightItem[];
  losers: HighlightItem[];
  type: AssetClass;
  asOf: string;
}

async function fetchHighlights(type: AssetClass): Promise<HighlightsResponse> {
  const res = await fetch(`/api/market/highlights?type=${type}`);
  if (!res.ok) throw new Error('Falha ao buscar destaques');
  return res.json();
}

export function MarketSection() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type') as AssetClass | null;
  const [activeType, setActiveType] = useState<AssetClass>(typeParam ?? 'STOCK_BR');

  useEffect(() => {
    if (typeParam && typeParam !== activeType) {
      setActiveType(typeParam);
    }
  }, [typeParam]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['market-highlights', activeType],
    queryFn: () => fetchHighlights(activeType),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return (
    <section className="bg-background py-10 px-4 md:px-8" aria-label="Destaques de mercado">
      <div className="mx-auto max-w-6xl">
        <MarketTabs activeType={activeType} onTabChange={setActiveType} />

        <div className="mt-6" role="tabpanel" aria-label={`Destaques ${activeType}`}>
          {isLoading && (
            <div className="flex justify-center py-12">
              <Spinner size="md" />
            </div>
          )}

          {isError && (
            <p className="text-center text-content-muted py-12">
              Não foi possível carregar os dados de mercado no momento.
            </p>
          )}

          {data && !isLoading && (
            <div className="flex flex-col gap-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-content">Maiores Altas</h3>
                  <a
                    href={`/ativos?type=${activeType}&sort=change`}
                    className="text-sm text-primary hover:underline"
                  >
                    Ver todos
                  </a>
                </div>
                {data.gainers.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {data.gainers.map((item) => (
                      <AssetMiniCard key={item.ticker} {...item} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-content-muted">Nenhuma alta registrada no momento.</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-content">Maiores Baixas</h3>
                  <a
                    href={`/ativos?type=${activeType}&sort=change_asc`}
                    className="text-sm text-primary hover:underline"
                  >
                    Ver todos
                  </a>
                </div>
                {data.losers.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {data.losers.map((item) => (
                      <AssetMiniCard key={item.ticker} {...item} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-content-muted">Nenhuma baixa registrada no momento.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
