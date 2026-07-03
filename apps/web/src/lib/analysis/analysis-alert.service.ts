import { AlertCondition } from '@prisma/client';
import { Decimal } from 'decimal.js';
import prisma from '@/lib/prisma';
import { getAssetAnalysis } from './asset-analysis.service';

export type AlertMetric = 'dy' | 'pe' | 'pb' | 'roe' | 'score' | 'stale';

const VALID_METRICS: ReadonlySet<string> = new Set<AlertMetric>([
  'dy',
  'pe',
  'pb',
  'roe',
  'score',
  'stale',
]);

export interface CreateAlertParams {
  ticker: string;
  metric: AlertMetric;
  condition: AlertCondition;
  target_value: string | number | Decimal;
}

export interface UpdateAlertParams {
  is_active?: boolean;
  condition?: AlertCondition;
  target_value?: string | number | Decimal;
}

export interface AlertRuleDto {
  id: string;
  ticker: string;
  metric: AlertMetric;
  condition: AlertCondition;
  target_value: string;
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
  current_value: string | null;
  triggered: boolean;
}

/**
 * Cria uma nova regra de alerta fundamentalista.
 * Valida metric, target_value > 0.
 */
export async function createAlert(
  userId: string,
  params: CreateAlertParams,
): Promise<AlertRuleDto> {
  const metric = params.metric as string;
  if (!VALID_METRICS.has(metric)) {
    throw new Error(`Metric inválida: ${metric}. Use: dy, pe, pb, roe, score, stale`);
  }

  if (metric === 'stale') {
    // stale não precisa de target_value nem condition
    const alert = await prisma.analysisAlertRule.create({
      data: {
        user_id: userId,
        ticker: params.ticker.toUpperCase(),
        metric,
        condition: AlertCondition.ABOVE,
        target_value: new Decimal(24), // 24h default
      },
    });

    return toDto(alert, null, false);
  }

  let targetDecimal: Decimal;
  try {
    targetDecimal = new Decimal(params.target_value);
    if (targetDecimal.lte(0)) {
      throw new Error('target_value deve ser maior que zero');
    }
  } catch {
    throw new Error('target_value inválido ou não-positivo');
  }

  if (![AlertCondition.ABOVE, AlertCondition.BELOW].includes(params.condition)) {
    throw new Error("condition deve ser 'ABOVE' ou 'BELOW'");
  }

  const alert = await prisma.analysisAlertRule.create({
    data: {
      user_id: userId,
      ticker: params.ticker.toUpperCase(),
      metric,
      condition: params.condition,
      target_value: targetDecimal.toFixed(4),
    },
  });

  return toDto(alert, null, false);
}

/**
 * Lista alertas do usuário, opcionalmente filtrados por ticker.
 * Avalia triggers lazy nos alertas ativos.
 */
export async function listAlerts(
  userId: string,
  ticker?: string,
): Promise<AlertRuleDto[]> {
  const where: Record<string, unknown> = { user_id: userId };
  if (ticker) {
    where.ticker = ticker.toUpperCase();
  }

  const alerts = await prisma.analysisAlertRule.findMany({
    where: where as { user_id: string; ticker?: string },
    orderBy: { created_at: 'desc' },
  });

  // Lazy evaluation: avalia alertas ativos
  const activeAlerts = alerts.filter((a) => a.is_active);

  // Agrupa por ticker para evitar chamadas duplicadas ao getAssetAnalysis
  const uniqueTickers = [...new Set(activeAlerts.map((a) => a.ticker))];
  const analysisByTicker = new Map<string, Awaited<ReturnType<typeof getAssetAnalysis>>>();

  await Promise.all(
    uniqueTickers.map(async (ticker) => {
      try {
        const analysis = await getAssetAnalysis(ticker);
        analysisByTicker.set(ticker, analysis);
      } catch {
        // Ignora erros de análise
      }
    }),
  );

  const now = new Date();
  const toTrigger: string[] = [];

  const results: AlertRuleDto[] = alerts.map((alert) => {
    const analysis = analysisByTicker.get(alert.ticker);
    const currentValue = getMetricValue(analysis ?? null, alert.metric as AlertMetric);
    const triggered = evaluateTrigger(alert, currentValue, analysis?.stale ?? false);

    if (triggered && alert.is_active) {
      toTrigger.push(alert.id);
    }

    return toDto(alert, currentValue, triggered);
  });

  // Atualiza triggered_at para alertas que dispararam
  if (toTrigger.length > 0) {
    await prisma.analysisAlertRule.updateMany({
      where: { id: { in: toTrigger } },
      data: { is_active: false, triggered_at: now },
    });

    // Atualiza os resultados com triggered_at para os que dispararam
    for (const result of results) {
      if (toTrigger.includes(result.id)) {
        result.triggered_at = now.toISOString();
        result.is_active = false;
      }
    }
  }

  return results;
}

/**
 * Atualiza um alerta existente (is_active, target_value, condition).
 * Se reativado, reseta triggered_at.
 */
export async function updateAlert(
  id: string,
  userId: string,
  params: UpdateAlertParams,
): Promise<AlertRuleDto> {
  const alert = await prisma.analysisAlertRule.findUnique({ where: { id } });

  if (!alert || alert.user_id !== userId) {
    throw new Error('NOT_FOUND');
  }

  const data: Record<string, unknown> = {};

  if (params.is_active !== undefined) {
    data.is_active = params.is_active;
    if (params.is_active === true) {
      data.triggered_at = null;
    }
  }

  if (params.condition !== undefined) {
    if (![AlertCondition.ABOVE, AlertCondition.BELOW].includes(params.condition)) {
      throw new Error("condition deve ser 'ABOVE' ou 'BELOW'");
    }
    data.condition = params.condition;
  }

  if (params.target_value !== undefined) {
    if (alert.metric === 'stale') {
      throw new Error('Não é possível alterar target_value para alertas de stale');
    }
    const d = new Decimal(params.target_value);
    if (d.lte(0)) {
      throw new Error('target_value deve ser maior que zero');
    }
    data.target_value = d.toFixed(4);
  }

  const updated = await prisma.analysisAlertRule.update({
    where: { id },
    data,
  });

  return toDto(updated, null, false);
}

/**
 * Deleta um alerta. Lança NOT_FOUND se não pertencer ao usuário.
 */
export async function deleteAlert(id: string, userId: string): Promise<void> {
  const alert = await prisma.analysisAlertRule.findUnique({ where: { id } });

  if (!alert || alert.user_id !== userId) {
    throw new Error('NOT_FOUND');
  }

  await prisma.analysisAlertRule.delete({ where: { id } });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMetricValue(
  analysis: Awaited<ReturnType<typeof getAssetAnalysis>> | null,
  metric: AlertMetric,
): string | null {
  if (!analysis) return null;

  switch (metric) {
    case 'dy':
      return analysis.fundamentals.dy;
    case 'pe':
      return analysis.fundamentals.pe;
    case 'pb':
      return analysis.fundamentals.pb;
    case 'roe':
      return analysis.fundamentals.roe;
    case 'score':
      return analysis.totalScore;
    case 'stale':
      return analysis.stale ? '1' : '0';
    default:
      return null;
  }
}

function evaluateTrigger(
  alert: {
    condition: AlertCondition;
    target_value: { toString(): string };
    metric: string;
  },
  currentValue: string | null,
  isStale: boolean,
): boolean {
  if (currentValue === null) return false;

  // stale é especial: dispara quando os dados estão desatualizados (> 24h)
  if (alert.metric === 'stale') {
    return isStale;
  }

  const current = new Decimal(currentValue);
  const target = new Decimal(alert.target_value.toString());

  if (alert.condition === AlertCondition.ABOVE) {
    return current.gte(target);
  } else {
    return current.lte(target);
  }
}

function toDto(
  alert: {
    id: string;
    ticker: string;
    metric: string;
    condition: AlertCondition;
    target_value: { toString(): string };
    is_active: boolean;
    triggered_at: Date | null;
    created_at: Date;
  },
  currentValue: string | null,
  triggered: boolean,
): AlertRuleDto {
  return {
    id: alert.id,
    ticker: alert.ticker,
    metric: alert.metric as AlertMetric,
    condition: alert.condition,
    target_value: alert.target_value.toString(),
    is_active: alert.is_active && !triggered,
    triggered_at: alert.triggered_at?.toISOString() ?? (triggered ? new Date().toISOString() : null),
    created_at: alert.created_at.toISOString(),
    current_value: currentValue,
    triggered: triggered || alert.triggered_at !== null,
  };
}
