import prisma from '@/lib/prisma';
import { fetchEvents } from '@/lib/market/event-fetchers';
import type { DataSource, Prisma } from '@prisma/client';

export interface CorporateEventResult {
  symbol: string;
  event_type: string;
  event_date: string; // ISO date
  description: string | null;
  data: Record<string, unknown> | null;
}

export interface EventsResponse {
  data: CorporateEventResult[];
  total: number;
  asOf: string;
  stale: boolean;
}

const EVENTS_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas

function isExpired(fetchedAt: Date): boolean {
  return Date.now() - fetchedAt.getTime() > EVENTS_TTL_MS;
}

/**
 * Busca eventos corporativos, usando cache do banco com fallback stale (RN-10).
 *
 * @param params.ticker - Símbolo do ativo (opcional)
 * @param params.type - Tipo de evento (opcional)
 * @param params.from - Data inicial ISO (opcional)
 * @param params.to - Data final ISO (opcional)
 * @param params.limit - Máximo de resultados (default 20, max 50)
 */
export async function getEvents(params: {
  ticker?: string;
  type?: string;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<EventsResponse> {
  const limit = Math.min(params.limit ?? 20, 50);

  // Monta filtro where dinâmico
  const where: Prisma.CorporateEventCacheWhereInput = {};
  if (params.ticker) {
    where.symbol = params.ticker.toUpperCase();
  }
  if (params.type) {
    where.event_type = params.type.toUpperCase();
  }
  if (params.from || params.to) {
    where.event_date = {};
    if (params.from) {
      (where.event_date as Prisma.DateTimeFilter).gte = new Date(params.from);
    }
    if (params.to) {
      (where.event_date as Prisma.DateTimeFilter).lte = new Date(params.to);
    }
  }

  // 1. Tenta cache
  const cacheWhere: Prisma.CorporateEventCacheWhereInput = { ...where };
  const cached = await prisma.corporateEventCache.findMany({
    where: cacheWhere,
    orderBy: { event_date: 'asc' },
    take: limit,
  });

  const hasFreshCache = cached.length > 0 && !isExpired(cached[0].fetched_at);

  if (hasFreshCache) {
    return {
      data: cached.map(mapCacheToResult),
      total: cached.length,
      asOf: cached[0].fetched_at.toISOString(),
      stale: false,
    };
  }

  // 2. Cache vazio/expirado — busca dados atualizados
  if (params.ticker) {
    try {
      const freshEvents = await fetchEvents(params.ticker, 'BRAPI' as DataSource);

      // Atualiza cache no banco
      for (const event of freshEvents) {
        await prisma.corporateEventCache.upsert({
          where: {
            symbol_event_type_event_date: {
              symbol: event.symbol,
              event_type: event.event_type,
              event_date: new Date(event.event_date),
            },
          },
          update: {
            description: event.description,
            data: (event.data ?? undefined) as Prisma.InputJsonValue | undefined,
            fetched_at: new Date(),
            source: 'BRAPI' as DataSource,
          },
          create: {
            symbol: event.symbol,
            event_type: event.event_type,
            event_date: new Date(event.event_date),
            description: event.description,
            data: (event.data ?? undefined) as Prisma.InputJsonValue | undefined,
            source: 'BRAPI' as DataSource,
          },
        });
      }

      // Re-busca do cache
      const updated = await prisma.corporateEventCache.findMany({
        where: cacheWhere,
        orderBy: { event_date: 'asc' },
        take: limit,
      });

      return {
        data: updated.map(mapCacheToResult),
        total: updated.length,
        asOf: new Date().toISOString(),
        stale: false,
      };
    } catch (err) {
      console.warn(`[events.service] fetch error for ${params.ticker}: ${String(err)}`);
      // Fallback para dados stale (RN-10)
      if (cached.length > 0) {
        return {
          data: cached.map(mapCacheToResult),
          total: cached.length,
          asOf: cached[0].fetched_at.toISOString(),
          stale: true,
        };
      }
      return { data: [], total: 0, asOf: new Date().toISOString(), stale: false };
    }
  }

  // Sem ticker específico — retorna cache existente ou vazio
  if (cached.length > 0) {
    return {
      data: cached.map(mapCacheToResult),
      total: cached.length,
      asOf: cached[0].fetched_at.toISOString(),
      stale: isExpired(cached[0].fetched_at),
    };
  }

  return { data: [], total: 0, asOf: new Date().toISOString(), stale: false };
}

function mapCacheToResult(
  entry: {
    symbol: string;
    event_type: string;
    event_date: Date;
    description: string | null;
    data: Prisma.JsonValue | null;
  },
): CorporateEventResult {
  return {
    symbol: entry.symbol,
    event_type: entry.event_type,
    event_date: entry.event_date.toISOString().split('T')[0],
    description: entry.description,
    data: entry.data as Record<string, unknown> | null,
  };
}
