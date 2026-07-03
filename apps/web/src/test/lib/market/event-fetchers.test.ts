import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetchBrapiDividends before importing the module
vi.mock('@/lib/market/market-fetchers', () => ({
  fetchBrapiDividends: vi.fn(),
}));

describe('event-fetchers', () => {
  let fetchEvents: any;
  let fetchEventsCurated: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import('@/lib/market/event-fetchers');
    fetchEvents = mod.fetchEvents;
    fetchEventsCurated = mod.fetchEventsCurated;
  });

  describe('fetchEventsCurated (apenas dados curatoriais)', () => {
    it('retorna eventos EARNINGS para PETR4', async () => {
      const events = await fetchEventsCurated('PETR4');
      const earnings = events.filter((e: any) => e.event_type === 'EARNINGS');
      expect(earnings.length).toBeGreaterThan(0);
      expect(earnings[0].event_type).toBe('EARNINGS');
      expect(earnings[0].symbol).toBe('PETR4');
      expect(earnings[0].event_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('retorna eventos MEETING para tickers conhecidos', async () => {
      const events = await fetchEventsCurated('ITUB4');
      const meetings = events.filter((e: any) => e.event_type === 'MEETING');
      expect(meetings.length).toBeGreaterThan(0);
      expect(meetings[0].event_type).toBe('MEETING');
    });

    it('retorna array vazio para ticker sem dados curatoriais', async () => {
      const events = await fetchEventsCurated('INVALID123');
      expect(events).toHaveLength(0);
    });

    it('eventos têm formato válido', async () => {
      const events = await fetchEventsCurated('VALE3');
      expect(events.length).toBeGreaterThan(0);
      for (const e of events) {
        expect(e).toHaveProperty('symbol', 'VALE3');
        expect(e).toHaveProperty('event_type');
        expect(e).toHaveProperty('event_date');
        expect(e).toHaveProperty('description');
        expect(typeof e.description).toBe('string');
        expect(e.event_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });
  });

  describe('fetchEvents (com dividendos mockados)', () => {
    it('inclui dividendos quando fetchBrapiDividends retorna dados', async () => {
      const { fetchBrapiDividends } = await import('@/lib/market/market-fetchers');
      (fetchBrapiDividends as any).mockResolvedValue([
        {
          paymentDate: '2026-08-15',
          lastDatePrior: '2026-08-10',
          value: '1.2500',
          type: 'Dividendo',
        },
      ]);

      const events = await fetchEvents('PETR4', 'BRAPI');
      const dividendEvents = events.filter(
        (e: any) => e.event_type === 'DIVIDEND_EX' || e.event_type === 'DIVIDEND_PAYMENT',
      );
      expect(dividendEvents.length).toBeGreaterThanOrEqual(2);

      const exEvent = dividendEvents.find((e: any) => e.event_type === 'DIVIDEND_EX');
      expect(exEvent).toBeDefined();
      expect(exEvent!.event_date).toBe('2026-08-10');

      const payEvent = dividendEvents.find((e: any) => e.event_type === 'DIVIDEND_PAYMENT');
      expect(payEvent).toBeDefined();
      expect(payEvent!.event_date).toBe('2026-08-15');
    });

    it('não quebra quando fetchBrapiDividends lança erro', async () => {
      const { fetchBrapiDividends } = await import('@/lib/market/market-fetchers');
      (fetchBrapiDividends as any).mockRejectedValue(new Error('API error'));

      const events = await fetchEvents('PETR4', 'BRAPI');
      // Ainda deve ter eventos curatoriais
      expect(events.length).toBeGreaterThan(0);
    });
  });
});
