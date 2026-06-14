import { apiFetch } from './client';
import type { PortfolioSummaryDto, PortfolioHistoryDto, MonthlyActivityDto } from '@/types/api';

export async function getPortfolioSummary(): Promise<PortfolioSummaryDto> {
  return apiFetch<PortfolioSummaryDto>('/portfolio/summary');
}

export async function getPortfolioHistory(): Promise<PortfolioHistoryDto> {
  return apiFetch<PortfolioHistoryDto>('/portfolio/history');
}

export async function getMonthlyActivity(): Promise<MonthlyActivityDto> {
  return apiFetch<MonthlyActivityDto>('/portfolio/monthly-activity');
}
