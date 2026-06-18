import { apiFetch } from './client';
import type { PortfolioSummaryDto, PortfolioHistoryDto, MonthlyActivityDto } from '@/types/api';

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
