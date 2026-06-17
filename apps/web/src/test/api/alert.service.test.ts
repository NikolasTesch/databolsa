// @vitest-environment node
/**
 * SPEC-0034 TC-10..TC-14: Testes unitários de alert.service.evaluateAlerts.
 *
 * Cobre: ABOVE/BELOW disparo, idempotência, sem cotação (RN-10),
 * dedupe de chamadas ao quoteService.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Decimal } from 'decimal.js';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/prisma', () => ({
  default: {
    priceAlert: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/quotes/quote.service', () => ({
  quoteService: {
    getQuote: vi.fn(),
  },
}));

// Importações após mocks
import prisma from '@/lib/prisma';
import { quoteService } from '@/lib/quotes/quote.service';
import { evaluateAlerts } from '@/lib/alerts/alert.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAlert(overrides: {
  id?: string;
  asset_ticker?: string;
  condition?: 'ABOVE' | 'BELOW';
  target_price?: string;
  is_active?: boolean;
  triggered_at?: Date | null;
}) {
  const asset = {
    ticker: overrides.asset_ticker ?? 'PETR4',
    asset_class: 'STOCK_BR',
    currency: 'BRL',
  };
  return {
    id: overrides.id ?? 'alert-1',
    asset_ticker: overrides.asset_ticker ?? 'PETR4',
    condition: overrides.condition ?? 'ABOVE',
    target_price: new Decimal(overrides.target_price ?? '35'),
    is_active: overrides.is_active ?? true,
    triggered_at: overrides.triggered_at ?? null,
    user: {
      assets: [asset],
    },
  };
}

function mockQuote(ticker: string, price: string) {
  (quoteService.getQuote as any).mockImplementation(
    async (t: string) => {
      if (t === ticker) {
        return { priceBrl: new Decimal(price), isStale: false };
      }
      return null;
    },
  );
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.priceAlert.updateMany as any).mockResolvedValue({ count: 0 });
});

// ---------------------------------------------------------------------------
// TC-10: ABOVE dispara quando preço atual >= target
// ---------------------------------------------------------------------------

describe('TC-10: alerta ABOVE', () => {
  it('dispara quando cotação atual >= target_price', async () => {
    const alert = makeAlert({ condition: 'ABOVE', target_price: '35' });
    (prisma.priceAlert.findMany as any).mockResolvedValue([alert]);
    mockQuote('PETR4', '36.00'); // acima do target

    await evaluateAlerts('user-1');

    expect(prisma.priceAlert.updateMany).toHaveBeenCalledOnce();
    const call = (prisma.priceAlert.updateMany as any).mock.calls[0][0];
    expect(call.where.id.in).toContain('alert-1');
    expect(call.data.is_active).toBe(false);
    expect(call.data.triggered_at).toBeInstanceOf(Date);
  });

  it('dispara exatamente no target_price (boundary)', async () => {
    const alert = makeAlert({ condition: 'ABOVE', target_price: '35' });
    (prisma.priceAlert.findMany as any).mockResolvedValue([alert]);
    mockQuote('PETR4', '35.00'); // exatamente no target

    await evaluateAlerts('user-1');

    expect(prisma.priceAlert.updateMany).toHaveBeenCalledOnce();
  });

  it('NÃO dispara quando cotação < target_price', async () => {
    const alert = makeAlert({ condition: 'ABOVE', target_price: '35' });
    (prisma.priceAlert.findMany as any).mockResolvedValue([alert]);
    mockQuote('PETR4', '34.00');

    await evaluateAlerts('user-1');

    expect(prisma.priceAlert.updateMany).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// TC-11: BELOW dispara quando preço atual <= target
// ---------------------------------------------------------------------------

describe('TC-11: alerta BELOW', () => {
  it('dispara quando cotação atual <= target_price', async () => {
    const alert = makeAlert({ condition: 'BELOW', target_price: '25' });
    (prisma.priceAlert.findMany as any).mockResolvedValue([alert]);
    mockQuote('PETR4', '24.00'); // abaixo do target

    await evaluateAlerts('user-1');

    expect(prisma.priceAlert.updateMany).toHaveBeenCalledOnce();
    const call = (prisma.priceAlert.updateMany as any).mock.calls[0][0];
    expect(call.where.id.in).toContain('alert-1');
    expect(call.data.triggered_at).toBeInstanceOf(Date);
  });

  it('dispara exatamente no target_price (boundary)', async () => {
    const alert = makeAlert({ condition: 'BELOW', target_price: '25' });
    (prisma.priceAlert.findMany as any).mockResolvedValue([alert]);
    mockQuote('PETR4', '25.00');

    await evaluateAlerts('user-1');

    expect(prisma.priceAlert.updateMany).toHaveBeenCalledOnce();
  });

  it('NÃO dispara quando cotação > target_price', async () => {
    const alert = makeAlert({ condition: 'BELOW', target_price: '25' });
    (prisma.priceAlert.findMany as any).mockResolvedValue([alert]);
    mockQuote('PETR4', '26.00');

    await evaluateAlerts('user-1');

    expect(prisma.priceAlert.updateMany).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// TC-12: alerta já disparado → idempotência (findMany retorna apenas is_active=true)
// ---------------------------------------------------------------------------

describe('TC-12: idempotência — alerta já disparado não reavalia', () => {
  it('alerta com triggered_at já preenchido NÃO aparece em findMany (filtrado pelo where)', async () => {
    // evaluateAlerts filtra where: { is_active: true }
    // O prisma já não retorna alertas inativos — simulamos isso retornando lista vazia
    (prisma.priceAlert.findMany as any).mockResolvedValue([]); // alerta já disparado → inativo → não retornado

    await evaluateAlerts('user-1');

    expect(quoteService.getQuote).not.toHaveBeenCalled();
    expect(prisma.priceAlert.updateMany).not.toHaveBeenCalled();
  });

  it('quando findMany retorna alerta ativo, updateMany só é chamado se condição satisfeita', async () => {
    const alert = makeAlert({ condition: 'ABOVE', target_price: '35', triggered_at: null });
    (prisma.priceAlert.findMany as any).mockResolvedValue([alert]);
    mockQuote('PETR4', '34.00'); // não satisfaz → NÃO dispara

    await evaluateAlerts('user-1');

    expect(prisma.priceAlert.updateMany).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// TC-13: ticker sem cotação → alerta não dispara (RN-10)
// ---------------------------------------------------------------------------

describe('TC-13: ticker sem cotação não dispara alerta (RN-10)', () => {
  it('getQuote retorna null → updateMany não é chamado', async () => {
    const alert = makeAlert({ condition: 'ABOVE', target_price: '35' });
    (prisma.priceAlert.findMany as any).mockResolvedValue([alert]);

    // Sem cotação disponível
    (quoteService.getQuote as any).mockResolvedValue(null);

    await evaluateAlerts('user-1');

    expect(prisma.priceAlert.updateMany).not.toHaveBeenCalled();
  });

  it('ativo não encontrado no portfólio do usuário → pula silenciosamente', async () => {
    const alert = {
      ...makeAlert({ condition: 'ABOVE', target_price: '35' }),
      user: { assets: [] }, // asset não encontrado
    };
    (prisma.priceAlert.findMany as any).mockResolvedValue([alert]);

    await evaluateAlerts('user-1');

    expect(quoteService.getQuote).not.toHaveBeenCalled();
    expect(prisma.priceAlert.updateMany).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// TC-14: múltiplos alertas do mesmo ticker → quoteService chamado apenas uma vez
// ---------------------------------------------------------------------------

describe('TC-14: dedupe — múltiplos alertas do mesmo ticker buscam cotação uma vez', () => {
  it('dois alertas PETR4 → getQuote chamado uma vez para PETR4', async () => {
    const alert1 = makeAlert({ id: 'a1', condition: 'ABOVE', target_price: '35' });
    const alert2 = makeAlert({ id: 'a2', condition: 'BELOW', target_price: '20' });
    (prisma.priceAlert.findMany as any).mockResolvedValue([alert1, alert2]);

    (quoteService.getQuote as any).mockResolvedValue({
      priceBrl: new Decimal('30'),
      isStale: false,
    });

    await evaluateAlerts('user-1');

    // getQuote deve ser chamado apenas 1 vez para PETR4 (dedupe por ticker único)
    const calls = (quoteService.getQuote as any).mock.calls;
    const petr4Calls = calls.filter((c: any[]) => c[0] === 'PETR4');
    expect(petr4Calls).toHaveLength(1);
  });

  it('alertas de tickers diferentes buscam cotações individuais', async () => {
    const alert1 = makeAlert({ id: 'a1', asset_ticker: 'PETR4', condition: 'ABOVE', target_price: '35' });
    const alert2 = {
      ...makeAlert({ id: 'a2', asset_ticker: 'VALE3', condition: 'ABOVE', target_price: '60' }),
      asset_ticker: 'VALE3',
      user: {
        assets: [{ ticker: 'VALE3', asset_class: 'STOCK_BR', currency: 'BRL' }],
      },
    };
    (prisma.priceAlert.findMany as any).mockResolvedValue([alert1, alert2]);

    (quoteService.getQuote as any).mockResolvedValue({
      priceBrl: new Decimal('30'),
      isStale: false,
    });

    await evaluateAlerts('user-1');

    const calls = (quoteService.getQuote as any).mock.calls;
    // Uma chamada por ticker único
    expect(calls).toHaveLength(2);
  });

  it('lista vazia → retorna sem chamar quoteService nem updateMany', async () => {
    (prisma.priceAlert.findMany as any).mockResolvedValue([]);

    await evaluateAlerts('user-1');

    expect(quoteService.getQuote).not.toHaveBeenCalled();
    expect(prisma.priceAlert.updateMany).not.toHaveBeenCalled();
  });
});
