'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listWatch } from '@/lib/api/portfolio';
import { queryKeys } from '@/lib/query-keys';
import { WishlistTable } from '@/components/portfolio/WishlistTable';
import { WishlistAddDialog } from '@/components/portfolio/WishlistAddDialog';
import { AlertRuleModal } from '@/components/analysis/AlertRuleModal';
import { useAlertRules } from '@/hooks/useAlertRules';
import { Spinner } from '@/components/ui/Spinner';

export default function WishlistPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertTicker, setAlertTicker] = useState<string | undefined>();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.portfolio.watchList(),
    queryFn: listWatch,
  });

  const { alerts, loading: alertsLoading, createAlert, refresh: refreshAlerts } = useAlertRules();

  const alertRulesByTicker: Record<string, typeof alerts> = {};
  for (const alert of alerts) {
    if (!alertRulesByTicker[alert.ticker]) {
      alertRulesByTicker[alert.ticker] = [];
    }
    alertRulesByTicker[alert.ticker].push(alert);
  }

  function handleOpenAlertModal(ticker: string) {
    setAlertTicker(ticker);
    setAlertModalOpen(true);
  }

  async function handleSaveAlert(data: {
    ticker: string;
    metric: string;
    condition: string;
    target_value: string | number;
  }) {
    await createAlert(data);
    refreshAlerts();
  }

  return (
    <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[28px] text-primary">star</span>
          <h1 className="text-xl font-semibold text-on-surface">Watchlist</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDialogOpen(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Adicionar Ativo
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-danger bg-loss-surface p-4 text-sm text-loss">
          Erro ao carregar watchlist:{' '}
          {error instanceof Error ? error.message : 'Tente novamente'}
        </div>
      )}

      {!isLoading && !isError && data && (
        <WishlistTable
          items={data.watches}
          alertRules={alertRulesByTicker}
          onCreateAlert={handleOpenAlertModal}
        />
      )}

      <WishlistAddDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />

      <AlertRuleModal
        open={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        onSave={handleSaveAlert}
        ticker={alertTicker}
      />
    </div>
  );
}
