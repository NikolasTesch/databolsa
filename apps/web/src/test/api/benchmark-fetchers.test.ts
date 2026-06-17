// @vitest-environment node
/**
 * SPEC-0034 TC-15..TC-16: Testes de benchmark-fetchers com fetch mockado.
 *
 * Cobre: fetchCdiSeries base-100 correto, return_pct = último-100,
 * fetch com erro → throw propagado.
 * Também cobre fetchIbovSeries normalização via normalizeBase100.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Decimal } from 'decimal.js';

// Mock global.fetch antes de importar os fetchers
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// normalizeBase100 e seriesReturnPct são testados indiretamente
import { fetchCdiSeries, fetchIbovSeries, fetchIpcaSeries } from '@/lib/market/benchmark-fetchers';
import { normalizeBase100, seriesReturnPct } from '@/lib/market/benchmark-cache';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockOkResponse(body: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => body,
  } as unknown as Response);
}

function mockErrorResponse(status: number) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({ error: 'fail' }),
  } as unknown as Response);
}

beforeEach(() => {
  vi.clearAllMocks();
  // Stub AbortSignal.timeout para evitar problemas de ambiente
  if (!AbortSignal.timeout) {
    vi.stubGlobal('AbortSignal', {
      timeout: vi.fn(() => new AbortController().signal),
    });
  }
});

// ---------------------------------------------------------------------------
// TC-15: fetchCdiSeries — base 100 no início, return_pct = último − 100
// ---------------------------------------------------------------------------

describe('TC-15: fetchCdiSeries base-100 e return_pct', () => {
  it('série de 2 pontos → base 100 no início e return_pct correto', async () => {
    // Taxa CDI diária em % (BCB formato)
    const bcbData = [
      { data: '01/06/2026', valor: '0.05' }, // fator: 1.0005
      { data: '02/06/2026', valor: '0.05' }, // fator: 1.0005 × 1.0005 = 1.00100025
    ];
    mockOkResponse(bcbData);

    const { series, return_pct } = await fetchCdiSeries('1M');

    expect(series).toHaveLength(2);

    // O código usa factor.mul(100) e os pontos são armazenados como Decimal.
    // Primeiro ponto: fator = 1.0005, price = 1.0005 × 100 = 100.0500
    const firstValue = new Decimal(series[0].value);
    expect(firstValue.toFixed(4)).toBe('100.0500');

    // Segundo ponto: fator = 1.0005 × 1.0005 = 1.00100025, price = 100.100025
    // O valor é armazenado como toFixed(4) → '100.1000' (arredondado)
    const secondValue = new Decimal(series[1].value);
    // O código usa price.toFixed(4) → valor arredondado a 4 casas
    expect(secondValue.toFixed(4)).toBe('100.1000');

    // return_pct = último_ponto_price - 100 (usando o Decimal antes do toFixed)
    // O return_pct é calculado sobre o Decimal não arredondado:
    // points[last].price.sub(100).toFixed(4) = (100.100025 - 100).toFixed(4) = '0.1000'
    expect(new Decimal(return_pct).toFixed(4)).toBe('0.1000');
  });

  it('série de 1 ponto → return_pct = valor_do_ponto − 100', async () => {
    const bcbData = [{ data: '01/06/2026', valor: '0.10' }];
    mockOkResponse(bcbData);

    const { series, return_pct } = await fetchCdiSeries('1M');

    expect(series).toHaveLength(1);
    const pointValue = new Decimal(series[0].value);
    // fator = 1.001, price = 100.1
    expect(pointValue.toFixed(4)).toBe('100.1000');

    // return_pct = 100.1 - 100 = 0.1
    expect(new Decimal(return_pct).toFixed(4)).toBe('0.1000');
  });

  it('data no formato dd/MM/yyyy é convertida para yyyy-MM-dd', async () => {
    const bcbData = [{ data: '13/06/2026', valor: '0.05' }];
    mockOkResponse(bcbData);

    const { series } = await fetchCdiSeries('1M');

    expect(series[0].date).toBe('2026-06-13');
  });

  it('série vazia → return_pct = "0"', async () => {
    mockOkResponse([]);

    const { series, return_pct } = await fetchCdiSeries('1M');

    expect(series).toHaveLength(0);
    expect(return_pct).toBe('0');
  });
});

// ---------------------------------------------------------------------------
// TC-16: fetchCdiSeries com erro → throw propagado
// ---------------------------------------------------------------------------

describe('TC-16: fetchCdiSeries com erro de rede', () => {
  it('resposta não-ok → throw com mensagem BCB CDI', async () => {
    mockErrorResponse(503);

    await expect(fetchCdiSeries('1M')).rejects.toThrow('BCB CDI 503');
  });

  it('fetch rejeitado (rede) → rejeita a promise', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Network error'));

    await expect(fetchCdiSeries('1M')).rejects.toThrow('Network error');
  });
});

// ---------------------------------------------------------------------------
// fetchIbovSeries — normalização via normalizeBase100
// ---------------------------------------------------------------------------

describe('fetchIbovSeries: normalização base-100', () => {
  it('série de 3 preços → base 100 no primeiro, valores proporcionais', async () => {
    const brapiResponse = {
      results: [{
        historicalDataPrice: [
          { date: Math.floor(new Date('2026-06-01').getTime() / 1000), close: 130000 },
          { date: Math.floor(new Date('2026-06-02').getTime() / 1000), close: 131300 },  // +1%
          { date: Math.floor(new Date('2026-06-03').getTime() / 1000), close: 136500 },  // +5%
        ],
      }],
    };
    mockOkResponse(brapiResponse);

    const { series, return_pct } = await fetchIbovSeries('1M');

    expect(series).toHaveLength(3);
    expect(series[0].value).toBe('100.0000'); // base 100
    expect(new Decimal(series[1].value).toFixed(4)).toBe('101.0000'); // +1%
    expect(new Decimal(series[2].value).toFixed(4)).toBe('105.0000'); // +5%

    // return_pct = (105 - 100) / 100 × 100 = 5%
    expect(new Decimal(return_pct).toFixed(4)).toBe('5.0000');
  });

  it('resposta com close null → pontos sem close são filtrados', async () => {
    const brapiResponse = {
      results: [{
        historicalDataPrice: [
          { date: Math.floor(new Date('2026-06-01').getTime() / 1000), close: 130000 },
          { date: Math.floor(new Date('2026-06-02').getTime() / 1000), close: null },
          { date: Math.floor(new Date('2026-06-03').getTime() / 1000), close: 131300 },
        ],
      }],
    };
    mockOkResponse(brapiResponse);

    const { series } = await fetchIbovSeries('1M');

    // Ponto com close null é filtrado
    expect(series).toHaveLength(2);
  });

  it('brapi retorna erro → throw propagado', async () => {
    mockErrorResponse(429);

    await expect(fetchIbovSeries('1M')).rejects.toThrow('brapi IBOV 429');
  });
});

// ---------------------------------------------------------------------------
// fetchIpcaSeries — acumulação de fator mensal
// ---------------------------------------------------------------------------

describe('fetchIpcaSeries: acumulação de fator mensal', () => {
  it('2 meses de IPCA → valores acumulados corretamente', async () => {
    const bcbData = [
      { data: '01/05/2026', valor: '0.50' }, // fator: 1.005
      { data: '01/06/2026', valor: '0.60' }, // fator: 1.005 × 1.006
    ];
    mockOkResponse(bcbData);

    const { series, return_pct } = await fetchIpcaSeries('1M');

    expect(series).toHaveLength(2);

    const p1 = new Decimal(series[0].value);
    const p2 = new Decimal(series[1].value);

    // primeiro: 1.005 × 100 = 100.5
    expect(p1.toFixed(4)).toBe('100.5000');
    // segundo: 1.005 × 1.006 × 100 = 101.1030
    expect(p2.toFixed(4)).toBe('101.1030');

    // return_pct = 101.1030 - 100 = 1.1030
    expect(new Decimal(return_pct).toFixed(4)).toBe('1.1030');
  });
});

// ---------------------------------------------------------------------------
// normalizeBase100 e seriesReturnPct — funções utilitárias
// ---------------------------------------------------------------------------

describe('normalizeBase100 (utilitário)', () => {
  it('série vazia → []', () => {
    expect(normalizeBase100([])).toEqual([]);
  });

  it('série de 1 ponto → [100]', () => {
    const result = normalizeBase100([{ date: '2026-01-01', price: new Decimal('50') }]);
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('100.0000');
  });

  it('base zero → todos os pontos retornam 100', () => {
    const points = [
      { date: '2026-01-01', price: new Decimal('0') },
      { date: '2026-01-02', price: new Decimal('0') },
    ];
    const result = normalizeBase100(points);
    expect(result[0].value).toBe('100');
    expect(result[1].value).toBe('100');
  });

  it('3 pontos → base 100 no primeiro e proporcionais nos outros', () => {
    const points = [
      { date: '2026-01-01', price: new Decimal('200') },
      { date: '2026-01-02', price: new Decimal('220') },
      { date: '2026-01-03', price: new Decimal('210') },
    ];
    const result = normalizeBase100(points);
    expect(result[0].value).toBe('100.0000');
    expect(result[1].value).toBe('110.0000');
    expect(result[2].value).toBe('105.0000');
  });
});

describe('seriesReturnPct (utilitário)', () => {
  it('série vazia → "0"', () => {
    expect(seriesReturnPct([])).toBe('0');
  });

  it('série de 1 ponto → "0"', () => {
    expect(seriesReturnPct([{ date: '2026-01-01', value: '100.0000' }])).toBe('0');
  });

  it('série de 2 pontos → retorno percentual entre primeiro e último', () => {
    const series = [
      { date: '2026-01-01', value: '100.0000' },
      { date: '2026-01-02', value: '110.0000' },
    ];
    // return_pct = (110 - 100) / 100 × 100 = 10%
    expect(new Decimal(seriesReturnPct(series)).toFixed(4)).toBe('10.0000');
  });
});
