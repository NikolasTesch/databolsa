import { apiFetch } from './client';
import type { PortfolioSummaryDto } from '@/types/api';

export async function getPortfolioSummary(): Promise<PortfolioSummaryDto> {
  return apiFetch<PortfolioSummaryDto>('/portfolio/summary');
}
