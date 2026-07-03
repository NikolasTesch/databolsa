import { NextResponse } from 'next/server';
import { DataSource } from '@prisma/client';
import prisma from '@/lib/prisma';

interface SourceInfo {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  lastSync: string | null;
  coverageByClass: Record<string, string>;
  assetCount: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

let cachedResult: { data: { sources: SourceInfo[]; globalCoverage: string; asOf: string }; timestamp: number } | null = null;

export async function GET() {
  const now = Date.now();

  // Retornar cache se ainda válido
  if (cachedResult && now - cachedResult.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cachedResult.data);
  }

  try {
    // Mapeamento de DataSource do Prisma para nomes amigáveis
    const sourceNames: Record<string, string> = {
      [DataSource.BRAPI]: 'BRAPI',
      [DataSource.COINGECKO]: 'CoinGecko',
      [DataSource.FINNHUB]: 'Finnhub',
    };

    const sources: SourceInfo[] = [];

    for (const [dbSource, displayName] of Object.entries(sourceNames)) {
      // Contar ativos no cache com esta fonte
      const assetCount = await prisma.assetFundamentalsCache.count({
        where: { source: dbSource as DataSource },
      });

      // Última atualização (mais recente)
      const lastEntry = await prisma.assetFundamentalsCache.findFirst({
        where: { source: dbSource as DataSource },
        orderBy: { fetched_at: 'desc' },
        select: { fetched_at: true },
      });

      const lastSync = lastEntry?.fetched_at.toISOString() ?? null;

      // "Online" se há ativos no cache e a última sincronia é < 12h
      const TWELVE_HOURS = 12 * 60 * 60 * 1000;
      const missingLastSync = lastEntry === null;
      const isStale = lastEntry !== null && now - lastEntry.fetched_at.getTime() > TWELVE_HOURS;

      let status: 'online' | 'offline' | 'degraded';
      if (missingLastSync) {
        status = 'offline';
      } else if (isStale) {
        status = 'degraded';
      } else {
        status = 'online';
      }

      // Cobertura por classe — simulada pela proporção de ativos distintos
      // que esta fonte cobre (aproximação: cada ativo no cache = cobertura)
      const coverageByClass: Record<string, string> = {};

      // Buscar símbolos distintos para ter ideia da cobertura
      const classMap: Record<string, string[]> = {
        BRAPI: ['STOCK_BR', 'FII', 'BDR', 'ETF'],
        FINNHUB: ['STOCK_US'],
        COINGECKO: ['CRYPTO'],
      };

      const classes = classMap[displayName] ?? [];
      for (const cls of classes) {
        coverageByClass[cls] = `${assetCount > 0 ? Math.min(100, assetCount * 10) : 0}%`;
      }

      sources.push({
        name: displayName,
        status,
        lastSync,
        coverageByClass,
        assetCount,
      });
    }

    // Cobertura global: média simples dos percentuais de cobertura
    const totalCoverage = sources.reduce((sum, s) => {
      const vals = Object.values(s.coverageByClass);
      if (vals.length === 0) return sum;
      const avg = vals.reduce((a, b) => a + parseInt(b), 0) / vals.length;
      return sum + avg;
    }, 0);
    const globalCoverage = sources.length > 0 ? `${(totalCoverage / sources.length).toFixed(0)}%` : '0%';

    const result = {
      sources,
      globalCoverage,
      asOf: new Date().toISOString(),
    };

    // Atualizar cache
    cachedResult = { data: result, timestamp: now };

    return NextResponse.json(result);
  } catch (err) {
    console.error('[api] /market/source-status error:', String(err));

    // Retornar cache expirado como fallback
    if (cachedResult) {
      return NextResponse.json(cachedResult.data);
    }

    return NextResponse.json(
      {
        sources: [],
        globalCoverage: '0%',
        asOf: new Date().toISOString(),
      },
      { status: 200 },
    );
  }
}
