import { NextRequest, NextResponse } from 'next/server';
import { calculatePosition } from '@databolsa/core';
import { buildPortfolioSeriesWithCurrencies } from '@databolsa/core';
import type { PricePoint } from '@databolsa/core';
import { Decimal } from 'decimal.js';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';
import { assertCanViewPortfolio } from '@/lib/auth/groups';
import { quoteService } from '@/lib/quotes/quote.service';
import { jsonError } from '@/lib/http/errors';
import { prismaToCoreTx } from '@/lib/portfolio/tx-mapper';
import {
  getCachedSeries,
  setCachedSeries,
  periodStartDate,
  type BenchmarkId,
  type PeriodId,
} from '@/lib/market/benchmark-cache';
import {
  fetchIbovSeries,
  fetchCdiSeries,
  fetchIpcaSeries,
  fetchSp500Series,
} from '@/lib/market/benchmark-fetchers';
import { fetchAssetPriceHistory } from '@/lib/market/asset-history-fetcher';

const VALID_BENCHMARKS: BenchmarkId[] = ['IBOVESPA', 'CDI', 'IPCA', 'SP500'];
const VALID_PERIODS: PeriodId[] = ['1M', '3M', '6M', '1Y', 'ALL'];

async function fetchBenchmarkSeries(
  benchmark: BenchmarkId,
  period: PeriodId,
  firstTxDate?: Date,
) {
  // Tenta cache primeiro (RN-10)
  const cached = await getCachedSeries(benchmark, period);
  if (cached && !cached.is_stale) {
    return { ...cached, from_cache: true };
  }

  try {
    let result: { series: { date: string; value: string }[]; return_pct: string };
    if (benchmark === 'IBOVESPA') result = await fetchIbovSeries(period);
    else if (benchmark === 'CDI') result = await fetchCdiSeries(period, firstTxDate);
    else if (benchmark === 'IPCA') result = await fetchIpcaSeries(period, firstTxDate);
    else result = await fetchSp500Series(period);

    await setCachedSeries(benchmark, period, result.series, result.return_pct);
    return { ...result, is_stale: false, from_cache: false };
  } catch (err) {
    console.warn(`[benchmark] fetch failed for ${benchmark}/${period}: ${String(err)}`);
    // Degrada para stale se disponível (RN-10)
    if (cached) return { ...cached, is_stale: true };
    return null;
  }
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  const targetUserId = request.nextUrl.searchParams.get('targetUserId') ?? user.id;
  if (targetUserId !== user.id) {
    try {
      await assertCanViewPortfolio(user.id, targetUserId);
    } catch {
      return jsonError('FORBIDDEN', 'Você não tem permissão para ver esta carteira', 403);
    }
  }

  const { searchParams } = new URL(request.url);
  const period = (searchParams.get('period') ?? '1Y') as PeriodId;
  const benchmark = (searchParams.get('benchmark') ?? 'IBOVESPA') as BenchmarkId;

  if (!VALID_PERIODS.includes(period)) {
    return NextResponse.json({ error: 'period inválido. Use: ' + VALID_PERIODS.join('|') }, { status: 422 });
  }
  if (!VALID_BENCHMARKS.includes(benchmark)) {
    return NextResponse.json({ error: 'benchmark inválido. Use: ' + VALID_BENCHMARKS.join('|') }, { status: 422 });
  }

  // Busca ativos do usuário com posições (RN-11)
  const assets = await prisma.asset.findMany({
    where: { user_id: targetUserId },
    include: { transactions: { orderBy: { date: 'asc' } } },
  });

  const assetsWithTxs = assets.filter((a) =>
    a.transactions.some((tx) => tx.type === 'BUY' || tx.type === 'SELL'),
  );

  if (assetsWithTxs.length === 0) {
    return NextResponse.json({
      period,
      benchmark,
      portfolio_return_pct: '0',
      benchmark_return_pct: '0',
      portfolio_series: [],
      benchmark_series: [],
      is_stale: false,
      note: 'Sem posições no portfólio',
    });
  }

  // Data da primeira transação (para período ALL)
  const allDates = assetsWithTxs.flatMap((a) => a.transactions.map((tx) => tx.date));
  const firstTxDate =
    allDates.length > 0
      ? new Date(Math.min(...allDates.map((d) => d.getTime())))
      : undefined;

  // Retorno da carteira: P&L% atual sobre o valor investido
  const quoteResults = await Promise.all(
    assetsWithTxs.map((a) => quoteService.getQuote(a.ticker, a.asset_class, a.currency)),
  );

  let totalInvested = new Decimal(0);
  let totalCurrentBrl = new Decimal(0);
  let anyStale = false;

  for (let i = 0; i < assetsWithTxs.length; i++) {
    const asset = assetsWithTxs[i];
    const quote = quoteResults[i];
    if (!quote) continue;
    if (quote.isStale) anyStale = true;

    const coreTxs = asset.transactions.map(prismaToCoreTx);
    const pos = calculatePosition(coreTxs, quote.priceBrl);
    if (pos.current_quantity.isZero()) continue;

    totalInvested = totalInvested.add(pos.invested_value);
    totalCurrentBrl = totalCurrentBrl.add(pos.current_value);
  }

  const portfolioReturnPct = totalInvested.isZero()
    ? new Decimal(0)
    : totalCurrentBrl.sub(totalInvested).div(totalInvested).mul(100);

  // Período de cálculo da série
  const periodStart = periodStartDate(period, firstTxDate);
  const startDateStr = periodStart.toISOString().slice(0, 10);
  const endDateStr = new Date().toISOString().slice(0, 10);

  // -----------------------------------------------------------------------
  // Série temporal real do portfólio (SPEC-0035)
  // -----------------------------------------------------------------------
  // 1. Buscar histórico de preços para cada ativo em paralelo (com cache)
  const priceHistoryResults = await Promise.all(
    assetsWithTxs.map((a) => fetchAssetPriceHistory(a.ticker, a.asset_class)),
  );

  // 2. Montar mapas para buildPortfolioSeriesWithCurrencies
  const transactionsMap: Record<string, import('@databolsa/core').Transaction[]> = {};
  const priceHistoryMap: Record<string, PricePoint[]> = {};
  const tickerCurrencies: Record<string, string> = {};

  for (let i = 0; i < assetsWithTxs.length; i++) {
    const asset = assetsWithTxs[i];
    transactionsMap[asset.ticker] = asset.transactions.map(prismaToCoreTx);
    priceHistoryMap[asset.ticker] = priceHistoryResults[i];
    tickerCurrencies[asset.ticker] = asset.currency; // 'BRL' | 'USD'
  }

  // 3. Câmbio USD/BRL atual (não histórico — limitação documentada em ADR-0014)
  const fxResult = await quoteService.getFxRate();
  const exchangeRateBrl: Record<string, Decimal> = {};
  if (fxResult) {
    exchangeRateBrl['USD'] = fxResult.priceBrl;
    if (fxResult.isStale) anyStale = true;
  } else {
    // Fallback: câmbio não disponível → sem conversão (assume 1:1, impreciso)
    // Documentado como limitação de degradação RN-10
    exchangeRateBrl['USD'] = new Decimal(1);
    anyStale = true;
  }

  // 4. Construir série diária normalizada base 100
  const portfolioSeries = buildPortfolioSeriesWithCurrencies(
    transactionsMap,
    priceHistoryMap,
    exchangeRateBrl,
    tickerCurrencies,
    startDateStr,
    endDateStr,
  );

  // return_pct da série temporal (último ponto − 100)
  const portfolioSeriesReturnPct =
    portfolioSeries.length > 0
      ? new Decimal(portfolioSeries[portfolioSeries.length - 1].value).sub(100).toFixed(4)
      : portfolioReturnPct.toFixed(4); // fallback para o P&L% calculado

  // -----------------------------------------------------------------------
  // Série do benchmark
  // -----------------------------------------------------------------------
  const bmResult = await fetchBenchmarkSeries(benchmark, period, firstTxDate);

  return NextResponse.json({
    period,
    benchmark,
    portfolio_return_pct: portfolioSeriesReturnPct,
    benchmark_return_pct: bmResult?.return_pct ?? '0',
    portfolio_series: portfolioSeries,
    benchmark_series: bmResult?.series ?? [],
    is_stale: anyStale || (bmResult?.is_stale ?? false),
    note: [
      'Série temporal do portfólio calculada com preços históricos diários (SPEC-0035).',
      'Câmbio USD/BRL usa valor atual, não histórico — imprecisão para ativos USD em períodos longos (ADR-0014).',
    ].join(' '),
  });
}
