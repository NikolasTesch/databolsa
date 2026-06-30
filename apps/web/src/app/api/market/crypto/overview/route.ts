import { NextRequest, NextResponse } from 'next/server';
import { Decimal } from 'decimal.js';
import { DataSource } from '@prisma/client';
import { fetchCachedMarketValue } from '@/lib/market/market-cache';
import { fetchCoinGeckoMulti } from '@/lib/market/market-fetchers';
import { CURATED_LISTS, CRYPTO_ID_TO_TICKER, CRYPTO_ID_TO_NAME } from '@/lib/market/curated-lists';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

interface CryptoOverviewItem {
  symbol: string;
  name: string;
  price: string;
  changePercent: string;
  marketCap: string;
  volume24h: string;
  stale: boolean;
}

function formatLargeNumber(value: Decimal): string {
  const num = value.toNumber();
  if (num >= 1_000_000_000_000) return `R$ ${(num / 1_000_000_000_000).toFixed(1).replace('.', ',')}T`;
  if (num >= 1_000_000_000) return `R$ ${(num / 1_000_000_000).toFixed(1).replace('.', ',')}B`;
  if (num >= 1_000_000) return `R$ ${(num / 1_000_000).toFixed(1).replace('.', ',')}M`;
  return `R$ ${num.toFixed(2).replace('.', ',')}`;
}

function formatChangePercent(value: string | null): string {
  if (value === null || value === '0') return '0,00%';
  const num = parseFloat(value);
  if (num > 0) return `+${num.toFixed(2).replace('.', ',')}%`;
  if (num < 0) return `${num.toFixed(2).replace('.', ',')}%`;
  return '0,00%';
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`market:crypto-overview:${ip}`, { limit: 30, windowMs: 60 * 1000 });
  if (!rateLimit.allowed) {
    return NextResponse.json({ message: 'Muitas requisições.' }, { status: 429 });
  }

  const coinIds = CURATED_LISTS.CRYPTO;

  try {
    const liveData = await fetchCoinGeckoMulti(coinIds);
    const items: CryptoOverviewItem[] = [];

    for (const coinId of coinIds) {
      const ticker = CRYPTO_ID_TO_TICKER[coinId] ?? coinId.toUpperCase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = liveData[coinId] as any;

      const cached = await fetchCachedMarketValue(
        ticker,
        DataSource.COINGECKO,
        5 * 60 * 1000,
        async () => {
          if (!d) throw new Error(`No CoinGecko data for ${coinId}`);
          return {
            price: d.price,
            currency: d.currency,
            name: CRYPTO_ID_TO_NAME[coinId] ?? ticker,
            changePercent: d.changePercent,
            changeValue: null,
          };
        },
      );

      if (cached) {
        items.push({
          symbol: ticker,
          name: cached.name ?? ticker,
          price: `R$ ${cached.price.toFixed(2)}`,
          changePercent: formatChangePercent(cached.changePercent),
          marketCap: d?.marketCap ? formatLargeNumber(new Decimal(String(d.marketCap))) : '—',
          volume24h: d?.volume24h ? formatLargeNumber(new Decimal(String(d.volume24h))) : '—',
          stale: cached.isStale,
        });
      }
    }

    if (items.length === 0) {
      return NextResponse.json(
        { message: 'Dados de cripto indisponíveis no momento.', data: [], trending: [] },
        { status: 503 },
      );
    }

    // Trending: top 3 por changePercent absoluto
    const trending = [...items]
      .sort((a, b) => Math.abs(parseFloat(b.changePercent)) - Math.abs(parseFloat(a.changePercent)))
      .slice(0, 3);

    return NextResponse.json({
      data: items,
      trending,
      asOf: new Date().toISOString(),
    });
  } catch (err) {
    console.warn(`[api] /market/crypto/overview error: ${String(err)}`);
    return NextResponse.json(
      { message: 'Erro ao buscar dados de cripto.', data: [], trending: [] },
      { status: 503 },
    );
  }
}
