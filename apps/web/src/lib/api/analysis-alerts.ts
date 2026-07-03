import { apiFetch } from './client';

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

interface ListAlertsResponse {
  alerts: AlertRule[];
}

export async function listAnalysisAlerts(ticker?: string): Promise<AlertRule[]> {
  const params = ticker ? `?ticker=${encodeURIComponent(ticker)}` : '';
  const res = await apiFetch<ListAlertsResponse>(
    `/api/analysis-alerts${params}`,
  );
  return res.alerts;
}

export async function createAnalysisAlert(data: {
  ticker: string;
  metric: string;
  condition: string;
  target_value: string | number;
}): Promise<AlertRule> {
  return apiFetch<AlertRule>('/api/analysis-alerts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAnalysisAlert(
  id: string,
  data: {
    is_active?: boolean;
    condition?: string;
    target_value?: string | number;
  },
): Promise<AlertRule> {
  return apiFetch<AlertRule>(`/api/analysis-alerts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteAnalysisAlert(id: string): Promise<void> {
  await apiFetch<void>(`/api/analysis-alerts/${id}`, { method: 'DELETE' });
}

export function getMetricLabel(metric: string): string {
  const labels: Record<string, string> = {
    dy: 'DY',
    pe: 'P/L',
    pb: 'P/VP',
    roe: 'ROE',
    score: 'Score',
    stale: 'Stale',
  };
  return labels[metric] ?? metric;
}

export function getMetricUnit(metric: string): string {
  const units: Record<string, string> = {
    dy: '%',
    pe: '',
    pb: '',
    roe: '%',
    score: '',
    stale: '',
  };
  return units[metric] ?? '';
}
