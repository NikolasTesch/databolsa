/**
 * Chaves de query para TanStack Query.
 * Uso centralizado evita strings duplicadas e garante invalidação correta.
 */

export const queryKeys = {
  portfolio: {
    all: ['portfolio'] as const,
    summary: (targetUserId?: string) =>
      ['portfolio', 'summary', targetUserId] as const,
    history: (targetUserId?: string) =>
      ['portfolio', 'history', targetUserId] as const,
    monthlyActivity: (targetUserId?: string) =>
      ['portfolio', 'monthly-activity', targetUserId] as const,
    dividends: (targetUserId?: string) =>
      ['portfolio', 'dividends', targetUserId] as const,
    dividendProjection: (targetUserId?: string) =>
      ['portfolio', 'dividends', 'projection', targetUserId] as const,
    allocation: (targetUserId?: string) =>
      ['portfolio', 'allocation', targetUserId] as const,
    aportesComparativo: (targetUserId?: string) =>
      ['portfolio', 'aportes', targetUserId] as const,
    benchmark: (benchmark: string, period: string, targetUserId?: string) =>
      ['portfolio', 'benchmark', benchmark, period, targetUserId] as const,
  },
  assets: {
    all: ['assets'] as const,
    list: () => [...queryKeys.assets.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.assets.all, 'detail', id] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    byAsset: (assetId: string) =>
      [...queryKeys.transactions.all, 'byAsset', assetId] as const,
  },
  groups: {
    all: ['groups'] as const,
    list: () => [...queryKeys.groups.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.groups.all, 'detail', id] as const,
  },
} as const;
