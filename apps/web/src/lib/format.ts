/**
 * Formatadores de valores financeiros.
 * Todos recebem strings decimais do backend e retornam strings formatadas.
 * NUNCA fazer aritmética float sobre os valores — apenas formatar para exibição.
 */

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const pctFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const qtyFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 8,
});

/**
 * Formata um valor BRL. Aceita string decimal do backend.
 * Ex: "12345.67" → "R$ 12.345,67"
 */
export function formatBRL(value: string | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const num = parseFloat(value);
  if (isNaN(num)) return '—';
  return brlFormatter.format(num);
}

/**
 * Formata percentual com sinal +/−.
 * Ex: "5.23" → "+5,23%" | "-3.10" → "−3,10%"
 * O sinal não é só visual — também está presente no texto (acessibilidade REQ-05).
 */
export function formatPct(value: string | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const num = parseFloat(value);
  if (isNaN(num)) return '—';
  // Divide por 100 porque o backend retorna percentual como "5.23" (não 0.0523)
  const formatted = pctFormatter.format(num / 100);
  if (num > 0) return `+${formatted}`;
  if (num < 0) {
    // Substitui o sinal de menos padrão pelo travessão menos (−) para acessibilidade
    return formatted.replace('-', '−');
  }
  return formatted;
}

/**
 * Formata quantidade de ativos (sem símbolo de moeda).
 * Ex: "100" → "100" | "1.5" → "1,5"
 */
export function formatQty(value: string | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const num = parseFloat(value);
  if (isNaN(num)) return '—';
  return qtyFormatter.format(num);
}

/**
 * Formata P/L BRL com sinal +/−.
 * Ex: "1234.56" → "+R$ 1.234,56" | "-500.00" → "−R$ 500,00"
 */
export function formatPLBRL(value: string | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const num = parseFloat(value);
  if (isNaN(num)) return '—';
  const formatted = brlFormatter.format(Math.abs(num));
  if (num > 0) return `+${formatted}`;
  if (num < 0) return `−${formatted}`;
  return formatted;
}

/**
 * Formata percentual de alocação com 1 casa decimal (pt-BR).
 * Ex: "33.333" → "33,3%"
 */
export function formatAllocationPct(value: string | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const num = parseFloat(value);
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(num) + '%';
}

/**
 * Retorna 'positive' | 'negative' | 'neutral' para colorização semântica.
 */
export function getValueSign(value: string | null | undefined): 'positive' | 'negative' | 'neutral' {
  if (value === null || value === undefined) return 'neutral';
  const num = parseFloat(value);
  if (isNaN(num)) return 'neutral';
  if (num > 0) return 'positive';
  if (num < 0) return 'negative';
  return 'neutral';
}
