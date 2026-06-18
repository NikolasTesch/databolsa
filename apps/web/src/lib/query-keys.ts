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
