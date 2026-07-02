import { Decimal } from 'decimal.js';
import type { AssetClass } from '@/types/api';
import type { NormalizedFundamentals } from '@/lib/fundamentals/fundamentals-adapter.interface';
import type {
  AnalysisAlert,
  AnalysisCategory,
  AnalysisScoreBreakdown,
  AnalysisSignalLevel,
  AssetAnalysisScoreResult,
} from './asset-analysis.types';

type IndicatorKey = keyof NormalizedFundamentals;

interface CategoryRule {
  category: AnalysisCategory;
  weight: string;
  indicators: IndicatorKey[];
  evaluate: (fundamentals: NormalizedFundamentals) => CategoryEvaluation;
}

interface CategoryEvaluation {
  score: Decimal;
  reasons: string[];
  missing: string[];
  alerts?: AnalysisAlert[];
}

const ZERO = new Decimal(0);
const HUNDRED = new Decimal(100);

function decimal(value: string | null): Decimal | null {
  if (value === null) return null;
  try {
    const result = new Decimal(value);
    return result.isFinite() ? result : null;
  } catch {
    return null;
  }
}

function clampScore(score: Decimal): Decimal {
  return Decimal.max(ZERO, Decimal.min(HUNDRED, score));
}

function levelForScore(score: Decimal, hasData: boolean): AnalysisSignalLevel {
  if (!hasData) return 'unknown';
  if (score.greaterThanOrEqualTo(70)) return 'positive';
  if (score.greaterThanOrEqualTo(45)) return 'neutral';
  if (score.greaterThanOrEqualTo(25)) return 'warning';
  return 'negative';
}

function formatScore(score: Decimal): string {
  const clamped = clampScore(score);
  if (clamped.isInteger()) return clamped.toFixed(0);
  return clamped.toDecimalPlaces(2).toString();
}

function missingIndicators(
  fundamentals: NormalizedFundamentals,
  indicators: IndicatorKey[],
): string[] {
  return indicators.filter((key) => decimal(fundamentals[key]) === null);
}

function hasAnyData(fundamentals: NormalizedFundamentals, indicators: IndicatorKey[]): boolean {
  return indicators.some((key) => decimal(fundamentals[key]) !== null);
}

function scoreRange(value: Decimal | null, min: string, max: string): Decimal {
  if (!value) return ZERO;
  const lower = new Decimal(min);
  const upper = new Decimal(max);
  if (value.greaterThanOrEqualTo(lower) && value.lessThanOrEqualTo(upper)) return HUNDRED;
  if (value.lessThan(lower) && value.greaterThan(ZERO)) return new Decimal(65);
  return new Decimal(25);
}

function scoreMax(value: Decimal | null, max: string): Decimal {
  if (!value) return ZERO;
  return value.lessThanOrEqualTo(new Decimal(max)) ? HUNDRED : new Decimal(35);
}

function scoreMin(value: Decimal | null, min: string): Decimal {
  if (!value) return ZERO;
  return value.greaterThanOrEqualTo(new Decimal(min)) ? HUNDRED : new Decimal(35);
}

function average(scores: Decimal[]): Decimal {
  if (scores.length === 0) return ZERO;
  return scores.reduce((sum, score) => sum.plus(score), ZERO).div(scores.length);
}

function category(
  categoryName: AnalysisCategory,
  weight: string,
  indicators: IndicatorKey[],
  evaluate: CategoryRule['evaluate'],
): CategoryRule {
  return { category: categoryName, weight, indicators, evaluate };
}

function stockRules(): CategoryRule[] {
  return [
    category('valuation', '0.3', ['pe', 'pb'], (f) => ({
      score: average([scoreRange(decimal(f.pe), '1', '12'), scoreMax(decimal(f.pb), '2.5')]),
      reasons: ['P/L e P/VP comparados com faixas historicamente usadas para valuation.'],
      missing: missingIndicators(f, ['pe', 'pb']),
    })),
    category('quality', '0.3', ['roe', 'netMargin'], (f) => ({
      score: average([scoreMin(decimal(f.roe), '12'), scoreMin(decimal(f.netMargin), '8')]),
      reasons: ['ROE e margem liquida indicam eficiencia operacional e rentabilidade.'],
      missing: missingIndicators(f, ['roe', 'netMargin']),
    })),
    category('dividends', '0.2', ['dy'], (f) => ({
      score: scoreRange(decimal(f.dy), '3', '12'),
      reasons: ['Dividend yield dentro de faixa sustentavel conta como sinal positivo.'],
      missing: missingIndicators(f, ['dy']),
    })),
    category('risk', '0.2', ['debtToEquity'], (f) => {
      const debtToEquity = decimal(f.debtToEquity);
      const isHighDebt = debtToEquity !== null && debtToEquity.greaterThan(new Decimal(2));
      return {
        score: debtToEquity === null ? ZERO : isHighDebt ? new Decimal(25) : HUNDRED,
        reasons: ['Divida/PL menor reduz o ponto de atencao por alavancagem.'],
        missing: missingIndicators(f, ['debtToEquity']),
        alerts: isHighDebt
          ? [
              {
                id: 'high-debt',
                level: 'warning',
                title: 'Alavancagem elevada',
                description: 'Divida/PL acima de 2 exige leitura cuidadosa da estrutura de capital.',
                category: 'risk',
              },
            ]
          : [],
      };
    }),
  ];
}

function fiiRules(): CategoryRule[] {
  return [
    category('valuation', '0.25', ['pb'], (f) => ({
      score: scoreRange(decimal(f.pb), '0.75', '1.05'),
      reasons: ['P/VP proximo de 1 ajuda a contextualizar preco contra valor patrimonial.'],
      missing: missingIndicators(f, ['pb']),
    })),
    category('dividends', '0.3', ['dy'], (f) => ({
      score: scoreRange(decimal(f.dy), '6', '14'),
      reasons: ['DY dentro de faixa usual para FIIs conta como sinal positivo.'],
      missing: missingIndicators(f, ['dy']),
    })),
    category('liquidity', '0.2', ['dailyLiquidity'], (f) => ({
      score: scoreMin(decimal(f.dailyLiquidity), '1000000'),
      reasons: ['Liquidez diaria maior reduz dificuldade de entrada e saida.'],
      missing: missingIndicators(f, ['dailyLiquidity']),
    })),
    category('risk', '0.25', ['vacancyRate'], (f) => {
      const vacancyRate = decimal(f.vacancyRate);
      const isHighVacancy = vacancyRate !== null && vacancyRate.greaterThan(new Decimal(15));
      return {
        score: vacancyRate === null ? ZERO : isHighVacancy ? new Decimal(25) : HUNDRED,
        reasons: ['Vacancia elevada pode pressionar receitas do fundo.'],
        missing: missingIndicators(f, ['vacancyRate']),
        alerts: isHighVacancy
          ? [
              {
                id: 'high-vacancy',
                level: 'warning',
                title: 'Vacancia elevada',
                description: 'Vacancia acima de 15% e um ponto de atencao para fundos imobiliarios.',
                category: 'risk',
              },
            ]
          : [],
      };
    }),
  ];
}

function etfRules(): CategoryRule[] {
  return [
    category('cost', '0.35', ['adminFee'], (f) => ({
      score: scoreMax(decimal(f.adminFee), '0.5'),
      reasons: ['Taxa de administracao menor preserva mais retorno bruto do indice.'],
      missing: missingIndicators(f, ['adminFee']),
    })),
    category('liquidity', '0.35', ['dailyLiquidity'], (f) => ({
      score: scoreMin(decimal(f.dailyLiquidity), '1000000'),
      reasons: ['Liquidez diaria maior melhora negociabilidade do ETF.'],
      missing: missingIndicators(f, ['dailyLiquidity']),
    })),
    category('data', '0.15', ['netWorth'], (f) => ({
      score: decimal(f.netWorth) === null ? ZERO : HUNDRED,
      reasons: ['Patrimonio disponivel melhora confianca da leitura.'],
      missing: missingIndicators(f, ['netWorth']),
    })),
    category('risk', '0.15', ['marketCap'], (f) => ({
      score: decimal(f.marketCap) === null ? ZERO : HUNDRED,
      reasons: ['Dados de porte ajudam a contextualizar risco operacional do produto.'],
      missing: missingIndicators(f, ['marketCap']),
    })),
  ];
}

function cryptoRules(): CategoryRule[] {
  return [
    category('liquidity', '0.35', ['volume24h'], (f) => ({
      score: scoreMin(decimal(f.volume24h), '100000000'),
      reasons: ['Volume 24h maior melhora liquidez e qualidade da referencia de preco.'],
      missing: missingIndicators(f, ['volume24h']),
    })),
    category('momentum', '0.3', ['change7d', 'change30d'], (f) => ({
      score: average([
        scoreMin(decimal(f.change7d), '0.00000001'),
        scoreMin(decimal(f.change30d), '0.00000001'),
      ]),
      reasons: ['Variacoes de 7d e 30d positivas indicam momentum recente favoravel.'],
      missing: missingIndicators(f, ['change7d', 'change30d']),
    })),
    category('risk', '0.25', ['marketCap'], (f) => ({
      score: decimal(f.marketCap) === null ? ZERO : HUNDRED,
      reasons: ['Market cap disponivel melhora leitura de porte e risco relativo.'],
      missing: missingIndicators(f, ['marketCap']),
      alerts:
        decimal(f.marketCap) === null || decimal(f.volume24h) === null
          ? [
              {
                id: 'missing-crypto-market-data',
                level: 'warning',
                title: 'Dados de mercado incompletos',
                description: 'Market cap ou volume 24h ausente reduz a confianca da analise.',
                category: 'risk',
              },
            ]
          : [],
    })),
    category('data', '0.1', ['circulatingSupply'], (f) => ({
      score: decimal(f.circulatingSupply) === null ? ZERO : HUNDRED,
      reasons: ['Supply circulante disponivel ajuda a contextualizar a emissao do ativo.'],
      missing: missingIndicators(f, ['circulatingSupply']),
    })),
  ];
}

function rulesForAssetClass(assetClass: AssetClass): CategoryRule[] {
  if (assetClass === 'FII') return fiiRules();
  if (assetClass === 'ETF') return etfRules();
  if (assetClass === 'CRYPTO') return cryptoRules();
  return stockRules();
}

function missingFundamentalsAlert(): AnalysisAlert {
  return {
    id: 'missing-fundamentals',
    level: 'unknown',
    title: 'Dados fundamentalistas insuficientes',
    description: 'Nao ha indicadores suficientes para calcular uma leitura confiavel deste ativo.',
    category: 'data',
  };
}

export function calculateAssetAnalysisScore(
  assetClass: AssetClass,
  fundamentals: NormalizedFundamentals,
): AssetAnalysisScoreResult {
  const rules = rulesForAssetClass(assetClass);
  const alerts: AnalysisAlert[] = [];
  let weightedScore = ZERO;
  let availableWeight = ZERO;

  const breakdown: AnalysisScoreBreakdown[] = rules.map((rule) => {
    const hasData = hasAnyData(fundamentals, rule.indicators);
    const evaluated = rule.evaluate(fundamentals);
    const score = hasData ? clampScore(evaluated.score) : ZERO;
    const weight = new Decimal(rule.weight);

    if (hasData) {
      weightedScore = weightedScore.plus(score.times(weight));
      availableWeight = availableWeight.plus(weight);
    }

    if (evaluated.alerts) alerts.push(...evaluated.alerts);

    return {
      category: rule.category,
      score: formatScore(score),
      level: levelForScore(score, hasData),
      weight: rule.weight,
      reasons: evaluated.reasons,
      missing: evaluated.missing,
    };
  });

  if (availableWeight.isZero()) {
    return {
      totalScore: '0',
      scoreLevel: 'unknown',
      breakdown,
      alerts: [missingFundamentalsAlert(), ...alerts],
    };
  }

  const totalScore = weightedScore.div(availableWeight);

  return {
    totalScore: formatScore(totalScore),
    scoreLevel: levelForScore(totalScore, true),
    breakdown,
    alerts,
  };
}
