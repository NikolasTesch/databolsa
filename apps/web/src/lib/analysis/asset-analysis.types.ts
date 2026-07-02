import type { AssetClass } from '@/types/api';
import type { NormalizedFundamentals } from '@/lib/fundamentals/fundamentals-adapter.interface';

export type AnalysisSignalLevel = 'positive' | 'neutral' | 'warning' | 'negative' | 'unknown';

export type AnalysisCategory =
  | 'valuation'
  | 'quality'
  | 'dividends'
  | 'risk'
  | 'liquidity'
  | 'momentum'
  | 'data'
  | 'cost';

export interface AnalysisScoreBreakdown {
  category: AnalysisCategory;
  score: string;
  level: AnalysisSignalLevel;
  weight: string;
  reasons: string[];
  missing: string[];
}

export interface AnalysisAlert {
  id: string;
  level: 'warning' | 'negative' | 'unknown';
  title: string;
  description: string;
  category: AnalysisCategory;
}

export interface PeerComparisonItem {
  ticker: string;
  name?: string | null;
  sector?: string | null;
  industry?: string | null;
  indicators: Pick<
    NormalizedFundamentals,
    'pe' | 'pb' | 'dy' | 'roe' | 'netMargin' | 'dailyLiquidity'
  >;
  totalScore: string;
  scoreLevel: AnalysisSignalLevel;
  stale: boolean;
  asOf: string;
}

export interface AssetAnalysis {
  ticker: string;
  name: string;
  assetClass: AssetClass;
  sector?: string | null;
  industry?: string | null;
  asOf: string;
  stale: boolean;
  fundamentals: NormalizedFundamentals;
  totalScore: string;
  scoreLevel: AnalysisSignalLevel;
  breakdown: AnalysisScoreBreakdown[];
  alerts: AnalysisAlert[];
  peers: PeerComparisonItem[];
}

export interface AssetAnalysisScoreResult {
  totalScore: string;
  scoreLevel: AnalysisSignalLevel;
  breakdown: AnalysisScoreBreakdown[];
  alerts: AnalysisAlert[];
}
