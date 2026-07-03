import { Decimal } from 'decimal.js';
import { fetchBrapiDividends } from '@/lib/market/market-fetchers';
import type { DataSource } from '@prisma/client';

export type EventType = 'DIVIDEND_EX' | 'DIVIDEND_PAYMENT' | 'EARNINGS' | 'MEETING' | 'SPLIT';

export interface CorporateEvent {
  symbol: string;
  event_type: EventType;
  event_date: string; // ISO date (YYYY-MM-DD)
  description: string;
  data?: Record<string, unknown>;
}

/**
 * Converte dividendos da Brapi para eventos corporativos padronizados.
 * Gera tanto eventos DIVIDEND_EX (data ex) quanto DIVIDEND_PAYMENT (data pagamento).
 */
function dividendsToEvents(symbol: string, dividends: Array<{ paymentDate: string; lastDatePrior: string; value: string; type: string }>): CorporateEvent[] {
  const events: CorporateEvent[] = [];

  for (const d of dividends) {
    const valueFormatted = new Decimal(d.value).toFixed(4);

    // Data EX (último dia com direito ao provento)
    if (d.lastDatePrior) {
      events.push({
        symbol,
        event_type: 'DIVIDEND_EX',
        event_date: d.lastDatePrior,
        description: `${d.type}: R$ ${valueFormatted} (data ex)`,
        data: { type: d.type, value: d.value },
      });
    }

    // Data de pagamento
    if (d.paymentDate) {
      events.push({
        symbol,
        event_type: 'DIVIDEND_PAYMENT',
        event_date: d.paymentDate,
        description: `${d.type}: R$ ${valueFormatted}`,
        data: { type: d.type, value: d.value },
      });
    }
  }

  return events;
}

/**
 * Calendário de resultados estimado para os principais tickers brasileiros.
 * Baseado em padrões históricos recorrentes.
 */
const EARNINGS_PATTERNS: Record<string, { quarters: number[]; label: string }> = {
  PETR4: { quarters: [1, 4, 7, 10], label: 'Petrobras (PETR4)' },
  VALE3: { quarters: [1, 4, 7, 10], label: 'Vale (VALE3)' },
  ITUB4: { quarters: [2, 5, 8, 11], label: 'Itaú Unibanco (ITUB4)' },
  BBDC4: { quarters: [2, 5, 8, 11], label: 'Bradesco (BBDC4)' },
  ABEV3: { quarters: [2, 5, 8, 11], label: 'Ambev (ABEV3)' },
  WEGE3: { quarters: [2, 5, 8, 11], label: 'WEG (WEGE3)' },
  BBAS3: { quarters: [2, 5, 8, 11], label: 'Banco do Brasil (BBAS3)' },
  BPAC11: { quarters: [2, 5, 8, 11], label: 'BTG Pactual (BPAC11)' },
  RENT3: { quarters: [3, 6, 9, 12], label: 'Localiza (RENT3)' },
  LREN3: { quarters: [2, 5, 8, 11], label: 'Lojas Renner (LREN3)' },
  MGLU3: { quarters: [2, 5, 8, 11], label: 'Magazine Luiza (MGLU3)' },
  TOTS3: { quarters: [2, 5, 8, 11], label: 'Totvs (TOTS3)' },
  EGIE3: { quarters: [2, 5, 8, 11], label: 'Engie Brasil (EGIE3)' },
  TAEE11: { quarters: [3, 6, 9, 12], label: 'Taesa (TAEE11)' },
  VIIA3: { quarters: [2, 5, 8, 11], label: 'Casas Bahia (VIIA3)' },
};

/**
 * Gera datas de resultados estimadas para um ticker específico.
 * Retorna eventos EARNINGS para os próximos 12 meses com base nos padrões do ticker.
 */
function generateEarningsEvents(symbol: string): CorporateEvent[] {
  const pattern = EARNINGS_PATTERNS[symbol];
  if (!pattern) return [];

  const events: CorporateEvent[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();

  // Gera eventos para este ano e próximo ano (dentro de 12 meses)
  for (const year of [currentYear, currentYear + 1]) {
    for (const month of pattern.quarters) {
      // Resultados geralmente saem na última semana do mês
      // Estimamos dia 25 como data aproximada
      const day = 25;
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const eventDate = new Date(dateStr);

      // Pula eventos no passado distante
      if (eventDate < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) continue;
      // Limita a 12 meses no futuro
      if (eventDate > new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())) break;

      const quarter = Math.ceil(month / 3);
      events.push({
        symbol,
        event_type: 'EARNINGS',
        event_date: dateStr,
        description: `${pattern.label} — Divulgação de Resultados ${quarter}º Trimestre (estimado)`,
        data: { quarter, year, estimated: true },
      });
    }
  }

  return events;
}

/**
 * Assembleias de acionistas — dados curatoriais para os principais tickers.
 * Baseado em padrões históricos (geralmente em abril/main para AGO e datas esparsas para AGE).
 */
function generateMeetingEvents(symbol: string): CorporateEvent[] {
  const meetings: Record<string, Array<{ month: number; type: string }>> = {
    PETR4: [
      { month: 4, type: 'Assembleia Geral Ordinária (AGO)' },
      { month: 7, type: 'Assembleia Geral Extraordinária (AGE)' },
    ],
    VALE3: [
      { month: 4, type: 'Assembleia Geral Ordinária (AGO)' },
    ],
    ITUB4: [
      { month: 3, type: 'Assembleia Geral Ordinária (AGO)' },
    ],
    BBDC4: [
      { month: 3, type: 'Assembleia Geral Ordinária (AGO)' },
    ],
    ABEV3: [
      { month: 4, type: 'Assembleia Geral Ordinária (AGO)' },
    ],
    BBAS3: [
      { month: 4, type: 'Assembleia Geral Ordinária (AGO)' },
    ],
    WEGE3: [
      { month: 3, type: 'Assembleia Geral Ordinária (AGO)' },
    ],
    BPAC11: [
      { month: 4, type: 'Assembleia Geral Ordinária (AGO)' },
    ],
  };

  const pattern = meetings[symbol];
  if (!pattern) return [];

  const now = new Date();
  const currentYear = now.getFullYear();
  const events: CorporateEvent[] = [];

  for (const year of [currentYear, currentYear + 1]) {
    for (const meeting of pattern) {
      const day = 15; // data estimada (meados do mês)
      const dateStr = `${year}-${String(meeting.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const eventDate = new Date(dateStr);

      if (eventDate < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) continue;
      if (eventDate > new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())) break;

      events.push({
        symbol,
        event_type: 'MEETING',
        event_date: dateStr,
        description: `${symbol} — ${meeting.type}`,
        data: { type: meeting.type, estimated: true },
      });
    }
  }

  return events;
}

/**
 * Busca todos os eventos corporativos para um símbolo de uma fonte de dados.
 * Combina dividendos reais (Brapi) com dados curatoriais estimados.
 */
export async function fetchEvents(symbol: string, _source: DataSource): Promise<CorporateEvent[]> {
  const events: CorporateEvent[] = [];

  // 1. Dividendos da Brapi (quando disponível)
  try {
    const dividends = await fetchBrapiDividends(symbol);
    events.push(...dividendsToEvents(symbol, dividends));
  } catch {
    // Silencia falha de dividendos — pode não ter dados para este ticker
  }

  // 2. Resultados trimestrais estimados
  events.push(...generateEarningsEvents(symbol));

  // 3. Assembleias estimadas
  events.push(...generateMeetingEvents(symbol));

  return events;
}

/**
 * Versão sem fetch externo — gera apenas eventos curatoriais (estimados).
 * Útil para testes ou quando a API externa está indisponível.
 */
export async function fetchEventsCurated(symbol: string): Promise<CorporateEvent[]> {
  const events: CorporateEvent[] = [];

  events.push(...generateEarningsEvents(symbol));
  events.push(...generateMeetingEvents(symbol));

  return events;
}
