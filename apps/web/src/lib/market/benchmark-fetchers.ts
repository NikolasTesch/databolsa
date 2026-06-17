import { Decimal } from 'decimal.js';
import type { BenchmarkId, BenchmarkPoint, PeriodId } from './benchmark-cache';
import { normalizeBase100, periodStartDate, seriesReturnPct } from './benchmark-cache';

const BRAPI_TOKEN = () => process.env.BRAPI_TOKEN ?? '';
const FINNHUB_TOKEN = () => process.env.FINNHUB_TOKEN ?? process.env.FINNHUB_KEY ?? '';

function dateToStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function ptBrDate(d: Date): string {
  // dd/MM/yyyy para BCB
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

function periodToRange(period: PeriodId): string {
  // brapi range param
  const map: Record<PeriodId, string> = { '1M': '1mo', '3M': '3mo', '6M': '6mo', '1Y': '1y', 'ALL': '5y' };
  return map[period];
}

// ---------------------------------------------------------------------------
// IBOVESPA via brapi
// ---------------------------------------------------------------------------
export async function fetchIbovSeries(period: PeriodId): Promise<{ series: BenchmarkPoint[]; return_pct: string }> {
  const token = BRAPI_TOKEN();
  const range = periodToRange(period);
  const url = `https://brapi.dev/api/quote/%5EBVSP?range=${range}&interval=1d&token=${token}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`brapi IBOV ${res.status}`);
  const data = await res.json();
  const prices: Array<{ date: number; close: number }> = data?.results?.[0]?.historicalDataPrice ?? [];

  const points = prices
    .filter((p) => p.close != null)
    .map((p) => ({
      date: dateToStr(new Date(p.date * 1000)),
      price: new Decimal(String(p.close)),
    }));

  const series = normalizeBase100(points);
  return { series, return_pct: seriesReturnPct(series) };
}

// ---------------------------------------------------------------------------
// CDI via Banco Central (série 12 — taxa DI acumulada diária)
// ---------------------------------------------------------------------------
export async function fetchCdiSeries(period: PeriodId, firstTxDate?: Date): Promise<{ series: BenchmarkPoint[]; return_pct: string }> {
  const start = periodStartDate(period, firstTxDate);
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=${ptBrDate(start)}&dataFinal=${ptBrDate(new Date())}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`BCB CDI ${res.status}`);
  const data: Array<{ data: string; valor: string }> = await res.json();

  // CDI diário em % — acumular fator corrido
  let factor = new Decimal(1);
  const points: { date: string; price: Decimal }[] = [];
  for (const item of data) {
    const dailyRate = new Decimal(item.valor).div(100);
    factor = factor.mul(new Decimal(1).add(dailyRate));
    // data formato dd/MM/yyyy → yyyy-MM-dd
    const [d, m, y] = item.data.split('/');
    points.push({ date: `${y}-${m}-${d}`, price: factor.mul(100) });
  }

  // Série já em base 100 (factor começa em 1 → ×100 = 100 no primeiro ponto)
  const series = points.map((p) => ({ date: p.date, value: p.price.toFixed(4) }));
  const ret = points.length > 0
    ? new Decimal(points[points.length - 1].price).sub(100).toFixed(4)
    : '0';
  return { series: series.length > 0 ? series : [], return_pct: ret };
}

// ---------------------------------------------------------------------------
// IPCA via Banco Central (série 433 — mensal)
// ---------------------------------------------------------------------------
export async function fetchIpcaSeries(period: PeriodId, firstTxDate?: Date): Promise<{ series: BenchmarkPoint[]; return_pct: string }> {
  const start = periodStartDate(period, firstTxDate);
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial=${ptBrDate(start)}&dataFinal=${ptBrDate(new Date())}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`BCB IPCA ${res.status}`);
  const data: Array<{ data: string; valor: string }> = await res.json();

  let factor = new Decimal(1);
  const points: { date: string; price: Decimal }[] = [];
  for (const item of data) {
    const monthlyRate = new Decimal(item.valor).div(100);
    factor = factor.mul(new Decimal(1).add(monthlyRate));
    const [d, m, y] = item.data.split('/');
    points.push({ date: `${y}-${m}-${d}`, price: factor.mul(100) });
  }

  const series = points.map((p) => ({ date: p.date, value: p.price.toFixed(4) }));
  const ret = points.length > 0
    ? new Decimal(points[points.length - 1].price).sub(100).toFixed(4)
    : '0';
  return { series, return_pct: ret };
}

// ---------------------------------------------------------------------------
// S&P500 via Finnhub (SPY ETF como proxy)
// ---------------------------------------------------------------------------
export async function fetchSp500Series(period: PeriodId): Promise<{ series: BenchmarkPoint[]; return_pct: string }> {
  const token = FINNHUB_TOKEN();
  if (!token) throw new Error('FINNHUB_TOKEN not set');
  const start = periodStartDate(period);
  const from = Math.floor(start.getTime() / 1000);
  const to = Math.floor(Date.now() / 1000);
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=SPY&resolution=W&from=${from}&to=${to}&token=${token}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Finnhub SPY ${res.status}`);
  const data = await res.json();
  if (data.s === 'no_data') return { series: [], return_pct: '0' };

  const timestamps: number[] = data.t ?? [];
  const closes: number[] = data.c ?? [];
  const points = timestamps.map((t, i) => ({
    date: dateToStr(new Date(t * 1000)),
    price: new Decimal(String(closes[i])),
  }));

  const series = normalizeBase100(points);
  return { series, return_pct: seriesReturnPct(series) };
}
