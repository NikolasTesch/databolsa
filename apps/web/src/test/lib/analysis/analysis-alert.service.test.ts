// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AlertCondition } from '@prisma/client';
import { Decimal } from 'decimal.js';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrismaCreate = vi.fn();
const mockPrismaFindMany = vi.fn();
const mockPrismaFindUnique = vi.fn();
const mockPrismaUpdate = vi.fn();
const mockPrismaDelete = vi.fn();
const mockPrismaUpdateMany = vi.fn();

vi.mock('@/lib/prisma', () => ({
  default: {
    analysisAlertRule: {
      create: (...args: unknown[]) => mockPrismaCreate(...args),
      findMany: (...args: unknown[]) => mockPrismaFindMany(...args),
      findUnique: (...args: unknown[]) => mockPrismaFindUnique(...args),
      update: (...args: unknown[]) => mockPrismaUpdate(...args),
      delete: (...args: unknown[]) => mockPrismaDelete(...args),
      updateMany: (...args: unknown[]) => mockPrismaUpdateMany(...args),
    },
  },
}));

const mockGetAssetAnalysis = vi.fn();
vi.mock('@/lib/analysis/asset-analysis.service', () => ({
  getAssetAnalysis: (...args: unknown[]) => mockGetAssetAnalysis(...args),
}));

import {
  createAlert,
  listAlerts,
  updateAlert,
  deleteAlert,
} from '@/lib/analysis/analysis-alert.service';
import { EMPTY_FUNDAMENTALS } from '@/lib/fundamentals/fundamentals-adapter.interface';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockAnalysis(overrides?: {
  dy?: string | null;
  pe?: string | null;
  pb?: string | null;
  roe?: string | null;
  score?: string;
  stale?: boolean;
}) {
  return {
    ticker: 'PETR4',
    name: 'PETR4',
    assetClass: 'STOCK_BR' as const,
    sector: null,
    industry: null,
    asOf: '2026-07-02T12:00:00.000Z',
    stale: overrides?.stale ?? false,
    fundamentals: {
      ...EMPTY_FUNDAMENTALS,
      dy: overrides?.dy ?? null,
      pe: overrides?.pe ?? null,
      pb: overrides?.pb ?? null,
      roe: overrides?.roe ?? null,
    },
    totalScore: overrides?.score ?? '80',
    scoreLevel: 'positive' as const,
    breakdown: [],
    alerts: [],
    peers: [],
  };
}

function makePrismaAlert(overrides: {
  id?: string;
  ticker?: string;
  metric?: string;
  condition?: AlertCondition;
  target_value?: string;
  is_active?: boolean;
  triggered_at?: Date | null;
}) {
  return {
    id: overrides.id ?? 'alert-1',
    ticker: overrides.ticker ?? 'PETR4',
    metric: overrides.metric ?? 'dy',
    condition: overrides.condition ?? AlertCondition.ABOVE,
    target_value: new Decimal(overrides.target_value ?? '6'),
    is_active: overrides.is_active ?? true,
    triggered_at: overrides.triggered_at ?? null,
    created_at: new Date('2026-07-01'),
    user_id: 'user-1',
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// createAlert
// ---------------------------------------------------------------------------

describe('createAlert', () => {
  it('cria alerta DY com dados válidos', async () => {
    mockPrismaCreate.mockResolvedValue(makePrismaAlert({
      metric: 'dy',
      target_value: '6',
      condition: AlertCondition.ABOVE,
    }));

    const result = await createAlert('user-1', {
      ticker: 'PETR4',
      metric: 'dy',
      condition: AlertCondition.ABOVE,
      target_value: '6',
    });

    expect(mockPrismaCreate).toHaveBeenCalledWith({
      data: {
        user_id: 'user-1',
        ticker: 'PETR4',
        metric: 'dy',
        condition: AlertCondition.ABOVE,
        target_value: '6.0000',
      },
    });
    expect(result.ticker).toBe('PETR4');
    expect(result.metric).toBe('dy');
  });

  it('lança erro para métrica inválida', async () => {
    await expect(
      createAlert('user-1', {
        ticker: 'PETR4',
        metric: 'invalid' as any,
        condition: AlertCondition.ABOVE,
        target_value: '10',
      }),
    ).rejects.toThrow('Metric inválida');
  });

  it('lança erro para target_value <= 0', async () => {
    await expect(
      createAlert('user-1', {
        ticker: 'PETR4',
        metric: 'dy',
        condition: AlertCondition.ABOVE,
        target_value: '0',
      }),
    ).rejects.toThrow('target_value inválido ou não-positivo');
  });

  it('cria alerta stale sem target_value', async () => {
    mockPrismaCreate.mockResolvedValue(makePrismaAlert({
      metric: 'stale',
      target_value: '24',
      condition: AlertCondition.ABOVE,
    }));

    const result = await createAlert('user-1', {
      ticker: 'PETR4',
      metric: 'stale',
      condition: AlertCondition.ABOVE,
      target_value: '24',
    });

    expect(mockPrismaCreate).toHaveBeenCalled();
    expect(result.metric).toBe('stale');
  });
});

// ---------------------------------------------------------------------------
// listAlerts
// ---------------------------------------------------------------------------

describe('listAlerts', () => {
  it('retorna lista vazia quando não há alertas', async () => {
    mockPrismaFindMany.mockResolvedValue([]);

    const result = await listAlerts('user-1');

    expect(result).toEqual([]);
    expect(mockGetAssetAnalysis).not.toHaveBeenCalled();
  });

  it('avalia lazy triggers em alertas ativos', async () => {
    const alert = makePrismaAlert({
      metric: 'dy',
      target_value: '5',
      condition: AlertCondition.ABOVE,
    });
    mockPrismaFindMany.mockResolvedValue([alert]);
    mockGetAssetAnalysis.mockResolvedValue(mockAnalysis({ dy: '6' }));

    const result = await listAlerts('user-1');

    expect(mockGetAssetAnalysis).toHaveBeenCalledWith('PETR4');
    expect(result).toHaveLength(1);
    expect(result[0].triggered).toBe(true);
    expect(result[0].is_active).toBe(false);
    expect(result[0].current_value).toBe('6');
  });

  it('NÃO dispara quando condição não é satisfeita', async () => {
    const alert = makePrismaAlert({
      metric: 'dy',
      target_value: '10',
      condition: AlertCondition.ABOVE,
    });
    mockPrismaFindMany.mockResolvedValue([alert]);
    mockGetAssetAnalysis.mockResolvedValue(mockAnalysis({ dy: '6' }));

    const result = await listAlerts('user-1');

    expect(result[0].triggered).toBe(false);
    expect(result[0].is_active).toBe(true);
    expect(mockPrismaUpdateMany).not.toHaveBeenCalled();
  });

  it('trigger alerta stale quando dados desatualizados', async () => {
    const alert = makePrismaAlert({
      metric: 'stale',
      target_value: '24',
      condition: AlertCondition.ABOVE,
    });
    mockPrismaFindMany.mockResolvedValue([alert]);
    mockGetAssetAnalysis.mockResolvedValue(mockAnalysis({ stale: true }));

    const result = await listAlerts('user-1');

    expect(result[0].triggered).toBe(true);
  });

  it('NÃO trigger stale quando dados atualizados', async () => {
    const alert = makePrismaAlert({
      metric: 'stale',
      target_value: '24',
      condition: AlertCondition.ABOVE,
    });
    mockPrismaFindMany.mockResolvedValue([alert]);
    mockGetAssetAnalysis.mockResolvedValue(mockAnalysis({ stale: false }));

    const result = await listAlerts('user-1');

    expect(result[0].triggered).toBe(false);
  });

  it('filtra por ticker', async () => {
    mockPrismaFindMany.mockResolvedValue([]);

    await listAlerts('user-1', 'VALE3');

    expect(mockPrismaFindMany).toHaveBeenCalledWith({
      where: { user_id: 'user-1', ticker: 'VALE3' },
      orderBy: { created_at: 'desc' },
    });
  });

  it('dedupe chamadas ao getAssetAnalysis por ticker único', async () => {
    const alert1 = makePrismaAlert({ id: 'a1', ticker: 'PETR4' });
    const alert2 = makePrismaAlert({ id: 'a2', ticker: 'PETR4', metric: 'pe' });
    mockPrismaFindMany.mockResolvedValue([alert1, alert2]);
    mockGetAssetAnalysis.mockResolvedValue(mockAnalysis({ dy: '6', pe: '8' }));

    await listAlerts('user-1');

    // getAssetAnalysis deve ser chamado apenas 1 vez para PETR4
    expect(mockGetAssetAnalysis).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// updateAlert
// ---------------------------------------------------------------------------

describe('updateAlert', () => {
  it('atualiza is_active e reseta triggered_at', async () => {
    mockPrismaFindUnique.mockResolvedValue(makePrismaAlert({
      triggered_at: new Date('2026-07-01'),
      is_active: false,
    }));
    mockPrismaUpdate.mockResolvedValue(makePrismaAlert({ is_active: true }));

    const result = await updateAlert('alert-1', 'user-1', { is_active: true });

    expect(mockPrismaUpdate).toHaveBeenCalledWith({
      where: { id: 'alert-1' },
      data: { is_active: true, triggered_at: null },
    });
    expect(result.is_active).toBe(true);
  });

  it('lança NOT_FOUND para alerta de outro usuário', async () => {
    mockPrismaFindUnique.mockResolvedValue(makePrismaAlert({}));

    await expect(
      updateAlert('alert-1', 'other-user', { is_active: true }),
    ).rejects.toThrow('NOT_FOUND');
  });

  it('lança NOT_FOUND quando alerta não existe', async () => {
    mockPrismaFindUnique.mockResolvedValue(null);

    await expect(
      updateAlert('nonexistent', 'user-1', { is_active: true }),
    ).rejects.toThrow('NOT_FOUND');
  });

  it('lança erro para condition inválida', async () => {
    mockPrismaFindUnique.mockResolvedValue(makePrismaAlert({}));

    await expect(
      updateAlert('alert-1', 'user-1', { condition: 'INVALID' as any }),
    ).rejects.toThrow("condition deve ser 'ABOVE' ou 'BELOW'");
  });

  it('lança erro para target_value <= 0', async () => {
    mockPrismaFindUnique.mockResolvedValue(makePrismaAlert({}));

    await expect(
      updateAlert('alert-1', 'user-1', { target_value: '-1' }),
    ).rejects.toThrow('target_value deve ser maior que zero');
  });
});

// ---------------------------------------------------------------------------
// deleteAlert
// ---------------------------------------------------------------------------

describe('deleteAlert', () => {
  it('deleta alerta existente do usuário', async () => {
    mockPrismaFindUnique.mockResolvedValue(makePrismaAlert({}));
    mockPrismaDelete.mockResolvedValue(makePrismaAlert({}));

    await deleteAlert('alert-1', 'user-1');

    expect(mockPrismaDelete).toHaveBeenCalledWith({ where: { id: 'alert-1' } });
  });

  it('lança NOT_FOUND para alerta de outro usuário', async () => {
    mockPrismaFindUnique.mockResolvedValue(makePrismaAlert({}));

    await expect(
      deleteAlert('alert-1', 'other-user'),
    ).rejects.toThrow('NOT_FOUND');
  });

  it('lança NOT_FOUND quando alerta não existe', async () => {
    mockPrismaFindUnique.mockResolvedValue(null);

    await expect(
      deleteAlert('nonexistent', 'user-1'),
    ).rejects.toThrow('NOT_FOUND');
  });
});
