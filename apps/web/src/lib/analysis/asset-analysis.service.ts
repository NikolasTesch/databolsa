import type { AssetClass } from '@/types/api';
import { getFundamentals } from '@/lib/fundamentals/fundamentals.service';
import type { NormalizedFundamentals } from '@/lib/fundamentals/fundamentals-adapter.interface';
import { getRelatedTickers, getSectorInfo } from '@/lib/market/sector-data';
import { calculateAssetAnalysisScore } from './asset-analysis-score';
import type { AssetAnalysis, PeerComparisonItem } from './asset-analysis.types';

const MAX_PEERS = 5;

function pickPeerIndicators(
  indicators: NormalizedFundamentals,
): PeerComparisonItem['indicators'] {
  return {
    pe: indicators.pe,
    pb: indicators.pb,
    dy: indicators.dy,
    roe: indicators.roe,
    netMargin: indicators.netMargin,
    dailyLiquidity: indicators.dailyLiquidity,
  };
}

async function getPeerAnalysis(
  ticker: string,
  assetClass: AssetClass,
): Promise<PeerComparisonItem> {
  const fundamentals = await getFundamentals(ticker, assetClass);
  const score = calculateAssetAnalysisScore(fundamentals.assetClass, fundamentals.indicators);
  const sectorInfo = getSectorInfo(ticker);

  return {
    ticker,
    name: ticker,
    sector: sectorInfo?.sector ?? null,
    industry: sectorInfo?.industry ?? null,
    indicators: pickPeerIndicators(fundamentals.indicators),
    totalScore: score.totalScore,
    scoreLevel: score.scoreLevel,
    stale: fundamentals.stale,
    asOf: fundamentals.asOf,
  };
}

export async function getAssetAnalysis(
  ticker: string,
  assetClassHint?: AssetClass,
): Promise<AssetAnalysis> {
  const symbol = ticker.toUpperCase();
  const fundamentals = await getFundamentals(symbol, assetClassHint);
  const score = calculateAssetAnalysisScore(fundamentals.assetClass, fundamentals.indicators);
  const sectorInfo = getSectorInfo(symbol);
  const relatedTickers = getRelatedTickers(symbol, MAX_PEERS);

  const peerResults = await Promise.allSettled(
    relatedTickers.map((relatedTicker) =>
      getPeerAnalysis(relatedTicker, fundamentals.assetClass),
    ),
  );

  const peers = peerResults.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : [],
  );

  return {
    ticker: symbol,
    name: symbol,
    assetClass: fundamentals.assetClass,
    sector: sectorInfo?.sector ?? null,
    industry: sectorInfo?.industry ?? null,
    asOf: fundamentals.asOf,
    stale: fundamentals.stale,
    fundamentals: fundamentals.indicators,
    totalScore: score.totalScore,
    scoreLevel: score.scoreLevel,
    breakdown: score.breakdown,
    alerts: score.alerts,
    peers,
  };
}
