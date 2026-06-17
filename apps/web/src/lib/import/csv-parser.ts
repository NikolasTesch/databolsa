import { Decimal } from 'decimal.js';

export type ImportTxType = 'BUY' | 'SELL' | 'DIVIDEND';

export interface ParsedRow {
  ticker: string;
  type: ImportTxType;
  date: string; // YYYY-MM-DD
  unit_price: Decimal;
  quantity: Decimal;
  fees: Decimal;
  raw_line: number;
}

export interface ParseError {
  line: number;
  message: string;
}

export interface ParseResult {
  rows: ParsedRow[];
  errors: ParseError[];
}

/**
 * Normaliza número no formato pt-BR (1.234,56) ou en-US (1234.56) para Decimal.
 */
function parseDecimalPtBr(value: string): Decimal {
  const cleaned = value.trim().replace(/\s/g, '');
  // pt-BR: tem vírgula como separador decimal
  if (/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(cleaned)) {
    return new Decimal(cleaned.replace(/\./g, '').replace(',', '.'));
  }
  // Fallback: tenta converter direto
  return new Decimal(cleaned.replace(',', '.'));
}

function parseDate(value: string): string | null {
  const v = value.trim();
  // yyyy-MM-dd (ISO)
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  // dd/MM/yyyy or MM/dd/yyyy — disambiguate by component value
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
    const parts = v.split('/');
    const a = parseInt(parts[0], 10);
    const b = parseInt(parts[1], 10);
    const y = parts[2];
    let day: string, month: string;
    if (a > 12) {
      // first component > 12 → unambiguously DD/MM
      day = parts[0]; month = parts[1];
    } else if (b > 12) {
      // second component > 12 → unambiguously MM/DD
      day = parts[1]; month = parts[0];
    } else {
      // ambiguous → assume DD/MM (pt-BR default)
      day = parts[0]; month = parts[1];
    }
    const date = new Date(parseInt(y, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    if (isNaN(date.getTime())) return null;
    return `${y}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return null;
}

function normalizeTxType(value: string): ImportTxType | null {
  const v = value.trim().toUpperCase();
  if (v === 'C' || v === 'COMPRA' || v === 'BUY') return 'BUY';
  if (v === 'V' || v === 'VENDA' || v === 'SELL') return 'SELL';
  if (v === 'D' || v === 'DIVIDENDO' || v === 'DIVIDEND' || v === 'PROVENTO') return 'DIVIDEND';
  return null;
}

/**
 * Detecta se o CSV é no formato B3/CEI baseado no cabeçalho.
 * Formato B3: "Código de Negociação", "Tipo Operação", "Data do Negócio", "Quantidade", "Preço"
 */
function isB3Format(header: string[]): boolean {
  const lower = header.map((h) => h.toLowerCase().trim());
  return lower.some((h) => h.includes('código de negociação') || h.includes('codigo de negociacao'));
}

/**
 * Parser para formato genérico: ticker, type, date, quantity, unit_price, fees
 */
function parseGenericRow(cells: string[], lineNum: number): ParsedRow | ParseError {
  if (cells.length < 5) {
    return { line: lineNum, message: `Linha com poucos campos (esperado ≥5, encontrado ${cells.length})` };
  }

  const ticker = cells[0].trim().toUpperCase();
  if (!ticker) return { line: lineNum, message: 'Ticker vazio' };

  const type = normalizeTxType(cells[1]);
  if (!type) return { line: lineNum, message: `Tipo de operação inválido: "${cells[1]}"` };

  const date = parseDate(cells[2]);
  if (!date) return { line: lineNum, message: `Data inválida: "${cells[2]}"` };

  try {
    const quantity = parseDecimalPtBr(cells[3]);
    const unit_price = parseDecimalPtBr(cells[4]);
    const fees = cells[5] ? parseDecimalPtBr(cells[5]) : new Decimal(0);

    if (quantity.lte(0)) return { line: lineNum, message: 'Quantidade deve ser positiva' };
    if (unit_price.lte(0)) return { line: lineNum, message: 'Preço deve ser positivo' };
    if (fees.lt(0)) return { line: lineNum, message: 'Taxas não podem ser negativas' };

    return { ticker, type, date, unit_price, quantity, fees, raw_line: lineNum };
  } catch {
    return { line: lineNum, message: `Valores numéricos inválidos na linha` };
  }
}

/**
 * Parser para formato B3/CEI.
 * Colunas esperadas: Código de Negociação, Tipo Operação, Data do Negócio, Quantidade, Preço, Taxas (opcional)
 */
function parseB3Row(cells: string[], header: string[], lineNum: number): ParsedRow | ParseError {
  const h = header.map((c) => c.toLowerCase().trim());
  const get = (patterns: string[]) => {
    const idx = h.findIndex((col) => patterns.some((p) => col.includes(p)));
    return idx >= 0 ? cells[idx] ?? '' : '';
  };

  const ticker = get(['código de negociação', 'codigo de negociacao', 'ticker']).trim().toUpperCase();
  if (!ticker) return { line: lineNum, message: 'Ticker vazio' };

  const rawType = get(['tipo operação', 'tipo operacao', 'tipo de operação', 'operação']);
  const type = normalizeTxType(rawType);
  if (!type) return { line: lineNum, message: `Tipo de operação inválido: "${rawType}"` };

  const rawDate = get(['data do negócio', 'data do negocio', 'data de negociação', 'data']);
  const date = parseDate(rawDate);
  if (!date) return { line: lineNum, message: `Data inválida: "${rawDate}"` };

  try {
    const rawQty = get(['quantidade']);
    const rawPrice = get(['preço', 'preco', 'valor unitário', 'valor unitario']);
    const rawFees = get(['taxas', 'corretagem', 'taxa']);

    const quantity = parseDecimalPtBr(rawQty);
    const unit_price = parseDecimalPtBr(rawPrice);
    const fees = rawFees ? parseDecimalPtBr(rawFees) : new Decimal(0);

    if (quantity.lte(0)) return { line: lineNum, message: 'Quantidade deve ser positiva' };
    if (unit_price.lte(0)) return { line: lineNum, message: 'Preço deve ser positivo' };

    return { ticker, type, date, unit_price, quantity, fees, raw_line: lineNum };
  } catch {
    return { line: lineNum, message: 'Valores numéricos inválidos' };
  }
}

function splitCsv(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if ((ch === ',' || ch === ';') && !inQuotes) { result.push(current); current = ''; continue; }
    current += ch;
  }
  result.push(current);
  return result;
}

export function parseCsv(content: string): ParseResult {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const nonEmpty = lines.filter((l) => l.trim().length > 0);

  if (nonEmpty.length < 2) {
    return { rows: [], errors: [{ line: 0, message: 'CSV vazio ou sem linhas de dados' }] };
  }

  const header = splitCsv(nonEmpty[0]);
  const b3Format = isB3Format(header);
  const rows: ParsedRow[] = [];
  const errors: ParseError[] = [];

  for (let i = 1; i < nonEmpty.length; i++) {
    const cells = splitCsv(nonEmpty[i]);
    const result = b3Format
      ? parseB3Row(cells, header, i + 1)
      : parseGenericRow(cells, i + 1);

    if ('ticker' in result) {
      rows.push(result);
    } else {
      errors.push(result);
    }
  }

  return { rows, errors };
}
