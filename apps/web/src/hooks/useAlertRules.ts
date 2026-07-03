'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  listAnalysisAlerts,
  createAnalysisAlert,
  updateAnalysisAlert,
  deleteAnalysisAlert,
} from '@/lib/api/analysis-alerts';

interface AlertRule {
  id: string;
  ticker: string;
  metric: string;
  condition: 'ABOVE' | 'BELOW';
  target_value: string;
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
  current_value: string | null;
  triggered: boolean;
}

interface CreateAlertParams {
  ticker: string;
  metric: string;
  condition: string;
  target_value: string | number;
}

interface UpdateAlertParams {
  is_active?: boolean;
  condition?: string;
  target_value?: string | number;
}

interface UseAlertRulesReturn {
  alerts: AlertRule[];
  loading: boolean;
  error: string | null;
  createAlert: (data: CreateAlertParams) => Promise<AlertRule>;
  updateAlert: (id: string, data: UpdateAlertParams) => Promise<AlertRule>;
  deleteAlert: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAlertRules(ticker?: string): UseAlertRulesReturn {
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listAnalysisAlerts(ticker);
      setAlerts(data);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Erro ao carregar alertas';
      setError(msg);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const createAlertFn = useCallback(
    async (data: CreateAlertParams): Promise<AlertRule> => {
      const created = await createAnalysisAlert(data);
      setAlerts((prev) => [created, ...prev]);
      return created;
    },
    [],
  );

  const updateAlertFn = useCallback(
    async (id: string, data: UpdateAlertParams): Promise<AlertRule> => {
      const updated = await updateAnalysisAlert(id, data);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? updated : a)),
      );
      return updated;
    },
    [],
  );

  const deleteAlertFn = useCallback(
    async (id: string): Promise<void> => {
      await deleteAnalysisAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    },
    [],
  );

  return {
    alerts,
    loading,
    error,
    createAlert: createAlertFn,
    updateAlert: updateAlertFn,
    deleteAlert: deleteAlertFn,
    refresh: fetchAlerts,
  };
}
