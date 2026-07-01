import { apiFetch } from './client';
import type {
  PortfolioSummaryDto,
  PortfolioHistoryDto,
  MonthlyActivityDto,
  AllocationResponse,
  BenchmarkResponse,
  DividendsResponse,
  DividendProjectionResponse,
} from '@/types/api';

export async function getPortfolioSummary(targetUserId?: string): Promise<PortfolioSummaryDto> {
  const params = targetUserId ? `?targetUserId=${encodeURIComponent(targetUserId)}` : '';
  return apiFetch<PortfolioSummaryDto>(`/portfolio/summary${params}`);
}

export async function getPortfolioHistory(targetUserId?: string): Promise<PortfolioHistoryDto> {
  const params = targetUserId ? `?targetUserId=${encodeURIComponent(targetUserId)}` : '';
  return apiFetch<PortfolioHistoryDto>(`/portfolio/history${params}`);
}

export async function getMonthlyActivity(targetUserId?: string): Promise<MonthlyActivityDto> {
  const params = targetUserId ? `?targetUserId=${encodeURIComponent(targetUserId)}` : '';
  return apiFetch<MonthlyActivityDto>(`/portfolio/monthly-activity${params}`);
}

export async function getBenchmark(
  benchmark: string,
  period: string,
  targetUserId?: string,
): Promise<BenchmarkResponse> {
  const params = new URLSearchParams({ benchmark, period });
  if (targetUserId) params.set('targetUserId', targetUserId);
  return apiFetch<BenchmarkResponse>(`/portfolio/benchmark?${params}`);
}

export async function getDividends(targetUserId?: string): Promise<DividendsResponse> {
  const params = targetUserId ? `?targetUserId=${encodeURIComponent(targetUserId)}` : '';
  return apiFetch<DividendsResponse>(`/portfolio/dividends${params}`);
}

export async function getDividendProjection(targetUserId?: string): Promise<DividendProjectionResponse> {
  const params = targetUserId ? `?targetUserId=${encodeURIComponent(targetUserId)}` : '';
  return apiFetch<DividendProjectionResponse>(`/portfolio/dividends/projection${params}`);
}

export async function getAllocation(targetUserId?: string): Promise<AllocationResponse> {
  const params = targetUserId ? `?targetUserId=${encodeURIComponent(targetUserId)}` : '';
  return apiFetch<AllocationResponse>(`/portfolio/allocation${params}`);
}

export async function getAportesComparativo(targetUserId?: string): Promise<{ by_year: Record<string, Record<string, string>> }> {
  const params = targetUserId ? `?targetUserId=${encodeURIComponent(targetUserId)}` : '';
  return apiFetch<{ by_year: Record<string, Record<string, string>> }>(`/portfolio/aportes${params}`);
}

export async function listWatch(): Promise<{
  watches: {
    id: string;
    ticker: string;
    name: string | null;
    asset_class: string;
    current_price_brl: string | null;
    price_change_pct: string | null;
    added_at: string;
  }[];
}> {
  return apiFetch('/portfolio/watch');
}

export async function addWatch(data: {
  ticker: string;
  name?: string;
  asset_class?: string;
}): Promise<{
  id: string;
  ticker: string;
  name: string | null;
  asset_class: string;
  added_at: string;
}> {
  return apiFetch('/portfolio/watch', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function removeWatch(id: string): Promise<void> {
  await apiFetch(`/portfolio/watch/${id}`, { method: 'DELETE' });
}
