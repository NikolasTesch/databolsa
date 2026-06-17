// @vitest-environment node
/**
 * SPEC-0034 TC-22..TC-30: Testes de integração dos endpoints de portfólio.
 *
 * Endpoints cobertos:
 *   - GET  /api/portfolio/allocation  (SPEC-0023)
 *   - GET  /api/portfolio/dividends   (SPEC-0022)
 *   - POST /api/portfolio/simulate    (SPEC-0027)
 *   - POST /api/portfolio/import      (SPEC-0026)
 *   - GET  /api/alerts                (SPEC-0025)
 *   - POST /api/alerts                (SPEC-0025)
 *   - PATCH /api/alerts/[id]          (SPEC-0025)
 *   - DELETE /api/alerts/[id]         (SPEC-0025)
 *
 * Regras de negócio cobertas: RN-02, RN-03, RN-10, RN-11
 */
import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Decimal } from 'decimal.js';

// ---------------------------------------------------------------------------
// Mocks globais
// ---------------------------------------------------------------------------

vi.mock('@/lib/prisma', () => ({
  default: {
    user: { findUnique: vi.fn() },
    asset: { findMany: vi.fn(), findFirst: vi.fn() },
    transaction: { findMany: vi.fn() },
    priceAlert: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    benchmarkSeriesCache: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/quotes/quote.service', () => ({
  quoteService: {
    getQuote: vi.fn(),
    getFxRate: vi.fn(),
  },
  QuoteService: class {},
}));

vi.mock('@/lib/portfolio/positions', () => ({
  computePositions: vi.fn(),
}));

vi.mock('@/lib/alerts/alert.service', () => ({
  evaluateAlerts: vi.fn(),
}));

// Importações após mocks
import prisma from '@/lib/prisma';
import { quoteService } from '@/lib/quotes/quote.service';
import { computePositions } from '@/lib/portfolio/positions';
import { signAccessToken } from '@/lib/auth/jwt';
import { GET as allocationGet } from '@/app/api/portfolio/allocation/route';
import { GET as dividendsGet } from '@/app/api/portfolio/dividends/route';
import { POST as simulatePost } from '@/app/api/portfolio/simulate/route';
import { POST as importPost } from '@/app/api/portfolio/import/route';
import { GET as alertsGet, POST as alertsPost } from '@/app/api/alerts/route';
import { PATCH as alertPatch, DELETE as alertDelete } from '@/app/api/alerts/[id]/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function makeAuthRequest(
  url: string,
  options: RequestInit = {},
): Promise<NextRequest> {
  const token = await signAccessToken({ sub: 'user-1', email: 'test@test.com' });
  return new NextRequest(url, {
    ...options,
    headers: {
      ...(options.headers as Record<string, string> ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
}

function mockAuthUser() {
  (prisma.user.findUnique as any).mockResolvedValue({ role: 'USER' });
}

function mockPrismaDecimal(value: string) {
  return { toString: () => value } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthUser();
});

// ===========================================================================
// GET /api/portfolio/allocation (SPEC-0023)
// ===========================================================================

describe('GET /api/portfolio/allocation', () => {
  // TC-22: 401 sem JWT
  it('TC-22: retorna 401 sem JWT', async () => {
    const req = new NextRequest('http://localhost:3000/api/portfolio/allocation');
    const res = await allocationGet(req);
    expect(res.status).toBe(401);
  });

  // TC-23: venda parcial → posição reduzida reflete na alocação
  it('TC-23: venda parcial reduz posição e reflete na alocação', async () => {
    // Simula 1 ativo com posição parcial após venda
    // computePositions retorna posição com 50 unidades restantes (de 100 iniciais)
    (computePositions as any).mockResolvedValue({
      positions: [
        {
          asset: {
            id: 'asset-1',
            ticker: 'PETR4',
            name: 'Petrobras',
            asset_class: 'STOCK_BR',
            currency: 'BRL',
            sector: 'Energia',
          },
          position: {
            current_quantity: new Decimal('50'),
            average_price: new Decimal('30'),
            invested_value: new Decimal('1500'),
            current_value: new Decimal('1750'), // 50 × 35
            profit_loss: new Decimal('250'),
            profit_loss_pct: new Decimal('16.67'),
            total_dividends: new Decimal('0'),
            total_return: new Decimal('250'),
            total_return_pct: new Decimal('16.67'),
            yield_on_cost_pct: new Decimal('0'),
          },
          valueBrl: new Decimal('1750'),
          currentPriceBrl: new Decimal('35'),
          allocationPct: new Decimal('100'),
          isStale: false,
        },
      ],
      totalBrl: new Decimal('1750'),
      anyStale: false,
    });

    const req = await makeAuthRequest('http://localhost:3000/api/portfolio/allocation');
    const res = await allocationGet(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.patrimonio_total_brl).toBe('1750');
    // Por classe: STOCK_BR = 1750 de 1750 = 100%
    expect(body.by_class).toHaveLength(1);
    expect(body.by_class[0].key).toBe('STOCK_BR');
    expect(body.by_class[0].pct).toBe('100.0000');
  });

  // TC-24: ativo sem cotação excluído do total (RN-10)
  it('TC-24: ativo sem cotação (valueBrl=null) é excluído do total', async () => {
    (computePositions as any).mockResolvedValue({
      positions: [
        {
          asset: {
            id: 'asset-1',
            ticker: 'PETR4',
            name: 'Petrobras',
            asset_class: 'STOCK_BR',
            currency: 'BRL',
            sector: null,
          },
          position: { current_quantity: new Decimal('10') } as any,
          valueBrl: new Decimal('350'), // tem cotação
          currentPriceBrl: new Decimal('35'),
          allocationPct: new Decimal('100'),
          isStale: false,
        },
        {
          asset: {
            id: 'asset-2',
            ticker: 'UNKNOWN',
            name: 'Ativo sem cotação',
            asset_class: 'CRYPTO',
            currency: 'BRL',
            sector: null,
          },
          position: { current_quantity: new Decimal('5') } as any,
          valueBrl: null, // sem cotação disponível (RN-10)
          currentPriceBrl: null,
          allocationPct: null,
          isStale: false,
        },
      ],
      totalBrl: new Decimal('350'), // apenas PETR4 entra no total
      anyStale: false,
    });

    const req = await makeAuthRequest('http://localhost:3000/api/portfolio/allocation');
    const res = await allocationGet(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    // Total deve ser apenas o ativo com cotação
    expect(body.patrimonio_total_brl).toBe('350');
    // UNKNOWN não entra em by_class (valueBrl null → filtrado)
    expect(body.by_class.find((c: any) => c.key === 'CRYPTO')).toBeUndefined();
    // STOCK_BR entra
    expect(body.by_class.find((c: any) => c.key === 'STOCK_BR')).toBeDefined();
  });

  // Patrimônio zero → sem divisão por zero
  it('patrimônio zero → alocação retorna 0 sem divisão por zero', async () => {
    (computePositions as any).mockResolvedValue({
      positions: [],
      totalBrl: new Decimal('0'),
      anyStale: false,
    });

    const req = await makeAuthRequest('http://localhost:3000/api/portfolio/allocation');
    const res = await allocationGet(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.patrimonio_total_brl).toBe('0');
    expect(body.by_class).toHaveLength(0);
  });
});

// ===========================================================================
// GET /api/portfolio/dividends (SPEC-0022)
// ===========================================================================

describe('GET /api/portfolio/dividends', () => {
  it('retorna 401 sem JWT', async () => {
    const req = new NextRequest('http://localhost:3000/api/portfolio/dividends');
    const res = await dividendsGet(req);
    expect(res.status).toBe(401);
  });

  it('agrega dividendos por mês, trimestre, ano e ativo', async () => {
    (prisma.transaction.findMany as any).mockResolvedValue([
      {
        type: 'DIVIDEND',
        quantity: mockPrismaDecimal('100'),
        unit_price: mockPrismaDecimal('2.50'),
        date: new Date('2026-06-13'),
        asset: { ticker: 'PETR4', currency: 'BRL', asset_class: 'STOCK_BR' },
      },
      {
        type: 'DIVIDEND',
        quantity: mockPrismaDecimal('50'),
        unit_price: mockPrismaDecimal('3.00'),
        date: new Date('2026-03-15'),
        asset: { ticker: 'VALE3', currency: 'BRL', asset_class: 'STOCK_BR' },
      },
    ]);

    const req = await makeAuthRequest('http://localhost:3000/api/portfolio/dividends');
    const res = await dividendsGet(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    // total: 100×2.5 + 50×3 = 400
    expect(body.total_brl).toBe('400');
    // by_month
    const jun = body.by_month.find((m: any) => m.key === '2026-06');
    expect(jun).toBeDefined();
    expect(jun.value_brl).toBe('250');
    const mar = body.by_month.find((m: any) => m.key === '2026-03');
    expect(mar).toBeDefined();
    expect(mar.value_brl).toBe('150');
    // by_asset: PETR4 primeiro (maior valor)
    expect(body.by_asset[0].key).toBe('PETR4');
  });

  it('sem dividendos → total 0 e listas vazias', async () => {
    (prisma.transaction.findMany as any).mockResolvedValue([]);
    (quoteService.getFxRate as any).mockResolvedValue(null);

    const req = await makeAuthRequest('http://localhost:3000/api/portfolio/dividends');
    const res = await dividendsGet(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.total_brl).toBe('0');
    expect(body.by_month).toHaveLength(0);
    expect(body.by_year).toHaveLength(0);
  });

  it('dividendo USD é convertido via FX (RN-10 degradação aceita stale)', async () => {
    (prisma.transaction.findMany as any).mockResolvedValue([
      {
        type: 'DIVIDEND',
        quantity: mockPrismaDecimal('10'),
        unit_price: mockPrismaDecimal('1.00'), // $1 USD por ação
        date: new Date('2026-06-13'),
        asset: { ticker: 'AAPL', currency: 'USD', asset_class: 'STOCK_US' },
      },
    ]);
    (quoteService.getFxRate as any).mockResolvedValue({
      priceBrl: new Decimal('5.5'),
      isStale: false,
    });

    const req = await makeAuthRequest('http://localhost:3000/api/portfolio/dividends');
    const res = await dividendsGet(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    // 10 × $1 × 5.5 = R$55
    expect(body.total_brl).toBe('55');
  });
});

// ===========================================================================
// POST /api/portfolio/simulate (SPEC-0027)
// ===========================================================================

describe('POST /api/portfolio/simulate', () => {
  it('retorna 401 sem JWT', async () => {
    const req = new NextRequest('http://localhost:3000/api/portfolio/simulate', {
      method: 'POST',
      body: JSON.stringify({ ticker: 'PETR4', type: 'BUY', quantity: 10, price: 30 }),
    });
    const res = await simulatePost(req);
    expect(res.status).toBe(401);
  });

  it('TC-25: SELL > posição → 422 SELL_EXCEEDS_POSITION (RN-02)', async () => {
    // Asset com 10 unidades
    (prisma.asset.findFirst as any).mockResolvedValue({
      id: 'asset-1',
      ticker: 'PETR4',
      user_id: 'user-1',
      asset_class: 'STOCK_BR',
      currency: 'BRL',
      transactions: [
        {
          type: 'BUY',
          date: new Date('2026-01-01'),
          unit_price: mockPrismaDecimal('30'),
          quantity: mockPrismaDecimal('10'),
          fees: mockPrismaDecimal('0'),
        },
      ],
    });
    (computePositions as any).mockResolvedValue({
      positions: [{
        asset: { ticker: 'PETR4' },
        currentPriceBrl: new Decimal('35'),
        isStale: false,
      }],
      totalBrl: new Decimal('350'),
      anyStale: false,
    });

    const req = await makeAuthRequest(
      'http://localhost:3000/api/portfolio/simulate',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ticker: 'PETR4', type: 'SELL', quantity: 999, price: 35 }),
      },
    );
    const res = await simulatePost(req);
    expect(res.status).toBe(422);

    const body = await res.json();
    expect(body.error).toBe('SELL_EXCEEDS_POSITION');
  });

  it('TC-26: BUY em posição zero com portfólio zero → sem erro, sem divisão por zero', async () => {
    // Ticker novo (não na carteira): asset=null, sem quote disponível
    (prisma.asset.findFirst as any).mockResolvedValue(null);
    (computePositions as any).mockResolvedValue({
      positions: [],
      totalBrl: new Decimal('0'), // patrimônio zero
      anyStale: false,
    });

    const req = await makeAuthRequest(
      'http://localhost:3000/api/portfolio/simulate',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ticker: 'PETR4', type: 'BUY', quantity: 10, price: 30 }),
      },
    );
    const res = await simulatePost(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.simulation.new_quantity).toBe('10');
    expect(body.simulation.new_avg_price).toBe('30');
    expect(body.simulation.new_invested_brl).toBe('300');
    // Sem cotação (ticker novo), new_current_value_brl e new_allocation_pct são null (RN-10)
    // Isso é comportamento correto — nenhuma divisão por zero ocorre
    expect(body.simulation.new_current_value_brl).toBeNull();
    expect(body.simulation.new_allocation_pct).toBeNull();
    // delta_quantity deve ser positivo
    expect(body.simulation.delta_quantity).toBe('10');
  });

  it('SELL de ticker não na carteira → 404 POSITION_NOT_FOUND', async () => {
    (prisma.asset.findFirst as any).mockResolvedValue(null);
    (computePositions as any).mockResolvedValue({
      positions: [],
      totalBrl: new Decimal('0'),
      anyStale: false,
    });

    const req = await makeAuthRequest(
      'http://localhost:3000/api/portfolio/simulate',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ticker: 'UNKNOWN', type: 'SELL', quantity: 10, price: 30 }),
      },
    );
    const res = await simulatePost(req);
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error).toBe('POSITION_NOT_FOUND');
  });

  it('input inválido → 422 INVALID_INPUT', async () => {
    const req = await makeAuthRequest(
      'http://localhost:3000/api/portfolio/simulate',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ticker: '', type: 'BUY', quantity: -1, price: 30 }),
      },
    );
    const res = await simulatePost(req);
    expect(res.status).toBe(422);
  });
});

// ===========================================================================
// POST /api/portfolio/import (SPEC-0026)
// ===========================================================================

describe('POST /api/portfolio/import', () => {
  it('retorna 401 sem JWT', async () => {
    const req = new NextRequest('http://localhost:3000/api/portfolio/import?mode=preview', {
      method: 'POST',
      body: 'ticker,type,date,quantity,unit_price\nPETR4,BUY,2026-06-13,10,30',
    });
    const res = await importPost(req);
    expect(res.status).toBe(401);
  });

  // TC-27: CSV acima de 1MB via content-length → 413
  it('TC-27: content-length > 1MB → 413 FILE_TOO_LARGE', async () => {
    const req = await makeAuthRequest(
      'http://localhost:3000/api/portfolio/import?mode=preview',
      {
        method: 'POST',
        headers: {
          'content-type': 'text/plain',
          'content-length': String(1_048_577), // > 1MB
        },
        body: 'ticker,type,date,quantity,unit_price\nPETR4,BUY,2026-06-13,10,30',
      },
    );
    const res = await importPost(req);
    expect(res.status).toBe(413);

    const body = await res.json();
    expect(body.error?.code ?? body.error).toMatch(/FILE_TOO_LARGE/);
  });

  // TC-28: CSV com mais de 1000 linhas válidas → 422
  it('TC-28: CSV com mais de 1000 linhas válidas → 422 IMPORT_TOO_MANY_ROWS', async () => {
    // Geração de CSV com 1001 linhas de dados válidas
    const header = 'ticker,type,date,quantity,unit_price,fees';
    const rows = Array.from({ length: 1001 }, (_, i) => `PETR4,BUY,2026-06-13,${i + 1},30.00,0`);
    const csv = [header, ...rows].join('\n');

    (prisma.asset.findMany as any).mockResolvedValue([]);

    const req = await makeAuthRequest(
      'http://localhost:3000/api/portfolio/import?mode=preview',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ csv }),
      },
    );
    const res = await importPost(req);
    expect(res.status).toBe(422);

    const body = await res.json();
    expect(body.error?.code ?? body.error).toMatch(/IMPORT_TOO_MANY_ROWS/);
  });

  // TC-29: preview — linha inválida coexiste com linhas válidas
  it('TC-29: preview: linha inválida coexiste com linhas válidas', async () => {
    const csv = [
      'ticker,type,date,quantity,unit_price,fees',
      'PETR4,BUY,2026-06-13,100,30.00,0',  // válida
      'INVALIDA',                              // inválida (poucos campos)
      'VALE3,BUY,2026-06-14,50,45.00,0',    // válida
    ].join('\n');

    (prisma.asset.findMany as any).mockResolvedValue([]);

    const req = await makeAuthRequest(
      'http://localhost:3000/api/portfolio/import?mode=preview',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ csv }),
      },
    );
    const res = await importPost(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.mode).toBe('preview');
    expect(body.valid_rows).toBe(2);
    expect(body.invalid_rows).toBeGreaterThanOrEqual(1);
    // Preview mostra as linhas válidas
    expect(body.preview).toHaveLength(2);
    expect(body.preview[0].ticker).toBe('PETR4');
    expect(body.preview[1].ticker).toBe('VALE3');
  });

  // TC-30: commit — SELL maior que posição → linha rejeitada, restante importado
  it('TC-30: commit: SELL maior que posição → linha rejeitada, restante importado (RN-02)', async () => {
    const csv = [
      'ticker,type,date,quantity,unit_price,fees',
      'PETR4,BUY,2026-06-13,10,30.00,0',    // válida
      'PETR4,SELL,2026-06-14,999,35.00,0',  // inválida: vende mais do que tem
    ].join('\n');

    // Sem transações existentes para PETR4
    (prisma.asset.findMany as any).mockResolvedValue([]);

    const req = await makeAuthRequest(
      'http://localhost:3000/api/portfolio/import?mode=commit',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ csv }),
      },
    );

    // $transaction deve criar apenas a linha válida
    (prisma.$transaction as any).mockImplementation(async (fn: Function) => {
      // Simula o callback com um tx mock
      const txMock = {
        asset: { create: vi.fn().mockResolvedValue({ id: 'new-asset' }) },
        transaction: { create: vi.fn().mockResolvedValue({}) },
      };
      await fn(txMock);
    });

    const res = await importPost(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.mode).toBe('commit');
    // 1 linha válida importada, 1 rejeitada
    expect(body.imported).toBe(1);
    expect(body.skipped).toBeGreaterThanOrEqual(1);
    // Erros incluem a venda excessiva
    const sellError = body.errors.find((e: any) => e.message?.includes('RN-02'));
    expect(sellError).toBeDefined();
  });

  it('CSV totalmente vazio → 422', async () => {
    const req = await makeAuthRequest(
      'http://localhost:3000/api/portfolio/import?mode=preview',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ csv: '' }),
      },
    );
    const res = await importPost(req);
    expect(res.status).toBe(422);
  });
});

// ===========================================================================
// GET /api/alerts (SPEC-0025)
// ===========================================================================

describe('GET /api/alerts', () => {
  it('retorna 401 sem JWT', async () => {
    const req = new NextRequest('http://localhost:3000/api/alerts');
    const res = await alertsGet(req);
    expect(res.status).toBe(401);
  });

  it('retorna lista de alertas do usuário autenticado', async () => {
    const now = new Date();
    (prisma.priceAlert.findMany as any).mockResolvedValue([
      {
        id: 'alert-1',
        asset_ticker: 'PETR4',
        condition: 'ABOVE',
        target_price: { toString: () => '35' },
        is_active: true,
        triggered_at: null,
        created_at: now,
      },
    ]);

    const req = await makeAuthRequest('http://localhost:3000/api/alerts');
    const res = await alertsGet(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.alerts).toHaveLength(1);
    expect(body.alerts[0].asset_ticker).toBe('PETR4');
    expect(body.alerts[0].condition).toBe('ABOVE');
    expect(body.alerts[0].triggered_at).toBeNull();
  });
});

// ===========================================================================
// POST /api/alerts (SPEC-0025)
// ===========================================================================

describe('POST /api/alerts', () => {
  it('retorna 401 sem JWT', async () => {
    const req = new NextRequest('http://localhost:3000/api/alerts', {
      method: 'POST',
      body: JSON.stringify({ asset_ticker: 'PETR4', condition: 'ABOVE', target_price: 35 }),
    });
    const res = await alertsPost(req);
    expect(res.status).toBe(401);
  });

  it('cria alerta ABOVE com sucesso → 201', async () => {
    const now = new Date();
    (prisma.priceAlert.create as any).mockResolvedValue({
      id: 'alert-new',
      asset_ticker: 'PETR4',
      condition: 'ABOVE',
      target_price: { toString: () => '35' },
      is_active: true,
      triggered_at: null,
      created_at: now,
    });

    const req = await makeAuthRequest('http://localhost:3000/api/alerts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ asset_ticker: 'PETR4', condition: 'ABOVE', target_price: 35 }),
    });
    const res = await alertsPost(req);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.id).toBe('alert-new');
    expect(body.is_active).toBe(true);
    expect(body.triggered_at).toBeNull();
  });

  it('target_price inválido → 422', async () => {
    const req = await makeAuthRequest('http://localhost:3000/api/alerts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ asset_ticker: 'PETR4', condition: 'ABOVE', target_price: -5 }),
    });
    const res = await alertsPost(req);
    expect(res.status).toBe(422);
  });

  it('condition inválido → 422', async () => {
    const req = await makeAuthRequest('http://localhost:3000/api/alerts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ asset_ticker: 'PETR4', condition: 'INVALID', target_price: 35 }),
    });
    const res = await alertsPost(req);
    expect(res.status).toBe(422);
  });
});

// ===========================================================================
// PATCH /api/alerts/[id] (SPEC-0025)
// ===========================================================================

describe('PATCH /api/alerts/[id]', () => {
  it('retorna 401 sem JWT', async () => {
    const req = new NextRequest('http://localhost:3000/api/alerts/alert-1', {
      method: 'PATCH',
      body: JSON.stringify({ is_active: true }),
    });
    const res = await alertPatch(req, { params: { id: 'alert-1' } });
    expect(res.status).toBe(401);
  });

  it('alerta de outro usuário → 404 NOT_FOUND (RN-11)', async () => {
    // alerta pertence ao user-2, não ao user-1 autenticado
    (prisma.priceAlert.findUnique as any).mockResolvedValue({
      id: 'alert-other',
      user_id: 'user-2', // diferente do usuário autenticado (user-1)
    });

    const req = await makeAuthRequest('http://localhost:3000/api/alerts/alert-other', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ is_active: true }),
    });
    const res = await alertPatch(req, { params: { id: 'alert-other' } });
    expect(res.status).toBe(404);
  });

  it('reativar alerta limpa triggered_at (is_active=true)', async () => {
    const triggeredDate = new Date('2026-06-10');
    (prisma.priceAlert.findUnique as any).mockResolvedValue({
      id: 'alert-1',
      user_id: 'user-1',
      triggered_at: triggeredDate,
      is_active: false,
    });
    (prisma.priceAlert.update as any).mockResolvedValue({
      id: 'alert-1',
      is_active: true,
      triggered_at: null,
    });

    const req = await makeAuthRequest('http://localhost:3000/api/alerts/alert-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ is_active: true }),
    });
    const res = await alertPatch(req, { params: { id: 'alert-1' } });
    expect(res.status).toBe(200);

    // Verifica que o update incluiu triggered_at: null
    const updateCall = (prisma.priceAlert.update as any).mock.calls[0][0];
    expect(updateCall.data.is_active).toBe(true);
    expect(updateCall.data.triggered_at).toBeNull();
  });

  it('alerta não encontrado → 404', async () => {
    (prisma.priceAlert.findUnique as any).mockResolvedValue(null);

    const req = await makeAuthRequest('http://localhost:3000/api/alerts/nonexistent', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ target_price: 40 }),
    });
    const res = await alertPatch(req, { params: { id: 'nonexistent' } });
    expect(res.status).toBe(404);
  });

  it('target_price negativo → 400', async () => {
    (prisma.priceAlert.findUnique as any).mockResolvedValue({
      id: 'alert-1',
      user_id: 'user-1',
    });

    const req = await makeAuthRequest('http://localhost:3000/api/alerts/alert-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ target_price: -10 }),
    });
    const res = await alertPatch(req, { params: { id: 'alert-1' } });
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// DELETE /api/alerts/[id] (SPEC-0025)
// ===========================================================================

describe('DELETE /api/alerts/[id]', () => {
  it('retorna 401 sem JWT', async () => {
    const req = new NextRequest('http://localhost:3000/api/alerts/alert-1', {
      method: 'DELETE',
    });
    const res = await alertDelete(req, { params: { id: 'alert-1' } });
    expect(res.status).toBe(401);
  });

  it('deleta alerta do usuário → 204', async () => {
    (prisma.priceAlert.findUnique as any).mockResolvedValue({
      id: 'alert-1',
      user_id: 'user-1',
    });
    (prisma.priceAlert.delete as any).mockResolvedValue({});

    const req = await makeAuthRequest('http://localhost:3000/api/alerts/alert-1', {
      method: 'DELETE',
    });
    const res = await alertDelete(req, { params: { id: 'alert-1' } });
    expect(res.status).toBe(204);
  });

  it('alerta de outro usuário → 404 (RN-11)', async () => {
    (prisma.priceAlert.findUnique as any).mockResolvedValue({
      id: 'alert-other',
      user_id: 'user-2',
    });

    const req = await makeAuthRequest('http://localhost:3000/api/alerts/alert-other', {
      method: 'DELETE',
    });
    const res = await alertDelete(req, { params: { id: 'alert-other' } });
    expect(res.status).toBe(404);
  });
});
