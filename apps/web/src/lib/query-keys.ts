/**
 * Chaves de query para TanStack Query.
 * Uso centralizado evita strings duplicadas e garante invalidação correta.
 */

export const queryKeys = {
  portfolio: {
    all: ['portfolio'] as const,
    summary: () => [...queryKeys.portfolio.all, 'summary'] as const,
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
} as const;
