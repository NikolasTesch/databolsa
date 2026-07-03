import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  corporateEventCache: {
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  default: mockPrisma,
}));

// Mock event-fetchers
vi.mock('@/lib/market/event-fetchers', () => ({
  fetchEvents: vi.fn(),
}));

describe('getEvents', () => {
  let getEvents: (params: any) => Promise<any>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import('@/lib/market/events.service');
    getEvents = mod.getEvents;
  });

  it('retorna dados do cache quando disponível e não expirado', async () => {
    const now = new Date();
    mockPrisma.corporateEventCache.findMany.mockResolvedValue([
      {
        symbol: 'PETR4',
        event_type: 'EARNINGS',
        event_date: new Date('2026-08-25'),
        description: 'Resultados 3º Trimestre',
        data: null,
        fetched_at: now,
      },
    ]);

    const result = await getEvents({ ticker: 'PETR4', limit: 10 });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].symbol).toBe('PETR4');
    expect(result.stale).toBe(false);
    expect(result.total).toBe(1);
  });

  it('retorna stale=true quando cache existe mas está expirado e fetcher falha', async () => {
    const oldDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h atrás (expirado)
    mockPrisma.corporateEventCache.findMany.mockResolvedValue([
      {
        symbol: 'PETR4',
        event_type: 'EARNINGS',
        event_date: new Date('2026-08-25'),
        description: 'Resultados 3º Trimestre',
        data: null,
        fetched_at: oldDate,
      },
    ]);

    const { fetchEvents } = await import('@/lib/market/event-fetchers');
    (fetchEvents as any).mockRejectedValue(new Error('API error'));

    const result = await getEvents({ ticker: 'PETR4', limit: 10 });
    expect(result.data).toHaveLength(1);
    expect(result.stale).toBe(true);
  });

  it('retorna array vazio quando não há cache e não há ticker', async () => {
    mockPrisma.corporateEventCache.findMany.mockResolvedValue([]);

    const result = await getEvents({ limit: 10 });
    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.stale).toBe(false);
  });

  it('aplica limite máximo de 50', async () => {
    mockPrisma.corporateEventCache.findMany.mockResolvedValue([]);

    await getEvents({ limit: 100 });
    // Deve ter passado 50 para o findMany
    expect(mockPrisma.corporateEventCache.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 50,
      }),
    );
  });
});
