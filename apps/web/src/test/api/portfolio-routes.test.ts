// @vitest-environment node
/**
 * TC-05: GET /api/portfolio/history retorna 401 sem JWT.
 * TC-06: GET /api/portfolio/monthly-activity retorna 401 sem JWT.
 * TC-06b: GET /api/portfolio/monthly-activity agrega corretamente para usuário autenticado.
 *
 * Cobre: REQ-04, REQ-13, AC-08.
 */
import { NextRequest } from 'next/server';
import { GET as historyGet } from '@/app/api/portfolio/history/route';
import { GET as monthlyActivityGet } from '@/app/api/portfolio/monthly-activity/route';
import prisma from '@/lib/prisma';
import { signAccessToken } from '@/lib/auth/jwt';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    transaction: {
      findMany: vi.fn(),
    },
    asset: {
      findMany: vi.fn(),
    },
  },
}));

describe('TC-05: GET /api/portfolio/history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // getAuthUser precisa de user.findUnique para carregar role (SPEC-0037)
    (prisma.user.findUnique as any).mockResolvedValue({ role: 'USER' });
  });

  it('retorna 401 sem JWT (AC-08)', async () => {
    const req = new NextRequest('http://localhost:3000/api/portfolio/history');
    const res = await historyGet(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toContain('Não autorizado');
  });

  it('retorna 200 com data_points para usuário autenticado', async () => {
    const token = await signAccessToken({ sub: 'user-1', email: 'test@example.com' });

    (prisma.transaction.findMany as any).mockResolvedValue([
      {
        type: 'BUY',
        date: new Date('2026-01-10'),
        unit_price: '30.00',
        quantity: '10',
        fees: '5.00',
        asset_id: 'asset-1',
      },
      {
        type: 'BUY',
        date: new Date('2026-02-15'),
        unit_price: '35.00',
        quantity: '5',
        fees: '0',
        asset_id: 'asset-1',
      },
      {
        type: 'SELL',
        date: new Date('2026-03-01'),
        unit_price: '40.00',
        quantity: '3',
        fees: '0',
        asset_id: 'asset-1',
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/portfolio/history', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await historyGet(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data_points).toBeDefined();
    expect(Array.isArray(body.data_points)).toBe(true);
    // 3 transações em datas distintas => 3 pontos
    expect(body.data_points).toHaveLength(3);
    // Primeiro ponto: BUY 10 x 30 + fees 5 = 305; avgPrice = 30.5
    expect(body.data_points[0].cumulative_invested_brl).toBe('305');
    // Segundo ponto: avgPrice = (10×30.5 + 5×35) / 15 = 32; invested = 15×32 = 480
    expect(body.data_points[1].cumulative_invested_brl).toBe('480');
    // Terceiro ponto: SELL 3 → qty = 12; invested = 12×32 = 384 (custo médio, não preço de venda)
    expect(body.data_points[2].cumulative_invested_brl).toBe('384');
  });

  it('agrupa transações do mesmo dia num único data_point', async () => {
    const token = await signAccessToken({ sub: 'user-1', email: 'test@example.com' });

    (prisma.transaction.findMany as any).mockResolvedValue([
      {
        type: 'BUY',
        date: new Date('2026-01-10'),
        unit_price: '10.00',
        quantity: '10',
        fees: '0',
        asset_id: 'asset-1',
      },
      {
        type: 'BUY',
        date: new Date('2026-01-10'),
        unit_price: '20.00',
        quantity: '5',
        fees: '0',
        asset_id: 'asset-1',
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/portfolio/history', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await historyGet(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    // Duas transações no mesmo dia => 1 data_point
    expect(body.data_points).toHaveLength(1);
    // 10x10 + 5x20 = 200
    expect(body.data_points[0].cumulative_invested_brl).toBe('200');
  });
});

describe('TC-06: GET /api/portfolio/monthly-activity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // getAuthUser precisa de user.findUnique para carregar role (SPEC-0037)
    (prisma.user.findUnique as any).mockResolvedValue({ role: 'USER' });
  });

  it('retorna 401 sem JWT (AC-08)', async () => {
    const req = new NextRequest('http://localhost:3000/api/portfolio/monthly-activity');
    const res = await monthlyActivityGet(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toContain('Não autorizado');
  });

  it('agrega corretamente BUY, SELL e DIVIDEND do mês (AC-02)', async () => {
    const token = await signAccessToken({ sub: 'user-1', email: 'test@example.com' });

    (prisma.transaction.findMany as any).mockResolvedValue([
      {
        type: 'BUY',
        unit_price: '30.00',
        quantity: '10',
        fees: '5.00',
      },
      {
        type: 'SELL',
        unit_price: '40.00',
        quantity: '5',
        fees: '0',
      },
      {
        type: 'DIVIDEND',
        unit_price: '2.50',
        quantity: '100',
        fees: '0',
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/portfolio/monthly-activity', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await monthlyActivityGet(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    // BUY: 10 x 30 + fees 5 = 305
    expect(body.total_bought_brl).toBe('305');
    // SELL: 5 x 40 = 200
    expect(body.total_sold_brl).toBe('200');
    // DIVIDEND: 100 x 2.50 = 250
    expect(body.total_dividends_brl).toBe('250');
    expect(body.estimated_realized_gain_brl).toBe('0');
    expect(body.transaction_count).toBe(3);
  });

  it('retorna zeros quando não há transações no mês', async () => {
    const token = await signAccessToken({ sub: 'user-1', email: 'test@example.com' });

    (prisma.transaction.findMany as any).mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/portfolio/monthly-activity', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await monthlyActivityGet(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total_bought_brl).toBe('0');
    expect(body.total_sold_brl).toBe('0');
    expect(body.total_dividends_brl).toBe('0');
    expect(body.transaction_count).toBe(0);
  });

  it('calcula estimated_realized_gain_brl usando custo médio corrido', async () => {
    const now = new Date();
    const token = await signAccessToken({ sub: 'user-1', email: 'test@example.com' });

    // Primeira chamada: transações do mês atual (inclui SELL)
    // Segunda chamada: histórico completo do ativo para calcular avgPrice
    (prisma.transaction.findMany as any)
      .mockResolvedValueOnce([
        // transações do mês corrente
        {
          type: 'SELL',
          unit_price: '50.00',
          quantity: '5',
          fees: '0',
          asset_id: 'asset-x',
        },
      ])
      .mockResolvedValueOnce([
        // histórico completo: compra anterior + venda do mês
        {
          type: 'BUY',
          date: new Date(now.getFullYear(), now.getMonth() - 1, 10), // mês anterior
          unit_price: '40.00',
          quantity: '10',
          fees: '0',
          asset_id: 'asset-x',
        },
        {
          type: 'SELL',
          date: new Date(now.getFullYear(), now.getMonth(), 5), // este mês
          unit_price: '50.00',
          quantity: '5',
          fees: '0',
          asset_id: 'asset-x',
        },
      ]);

    const req = new NextRequest('http://localhost:3000/api/portfolio/monthly-activity', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await monthlyActivityGet(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    // avgPrice = 40; venda 5 a 50 → ganho = 5 * (50 - 40) = 50
    expect(body.estimated_realized_gain_brl).toBe('50');
    expect(body.total_sold_brl).toBe('250');
  });
});
