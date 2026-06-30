import { NextRequest, NextResponse } from 'next/server';
import { AssetClass, Currency, DataSource } from '@prisma/client';
import { Decimal } from 'decimal.js';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';
import { parseCsv, type ParsedRow } from '@/lib/import/csv-parser';
import { CRYPTO_TICKER_MAP } from '@/lib/quotes/ticker-map';
import { jsonError } from '@/lib/http/errors';

const MAX_BYTES = 1_048_576; // 1 MB
const MAX_ROWS = 1000;

// ---------------------------------------------------------------------------
// Inferência de asset_class/data_source/currency a partir do ticker
// ---------------------------------------------------------------------------

function inferAssetMeta(ticker: string): {
  asset_class: AssetClass;
  data_source: DataSource;
  currency: Currency;
} {
  if (CRYPTO_TICKER_MAP[ticker]) {
    return { asset_class: AssetClass.CRYPTO, data_source: DataSource.COINGECKO, currency: Currency.BRL };
  }
  if (/^[A-Z]{1,5}(34|11|33|32|31)$/.test(ticker)) {
    const num = ticker.match(/(\d+)$/)?.[1] ?? '';
    if (num === '11') return { asset_class: AssetClass.FII, data_source: DataSource.BRAPI, currency: Currency.BRL };
    if (num === '34') return { asset_class: AssetClass.BDR, data_source: DataSource.BRAPI, currency: Currency.BRL };
    return { asset_class: AssetClass.STOCK_BR, data_source: DataSource.BRAPI, currency: Currency.BRL };
  }
  // Tickers com 1-5 letras maiúsculas sem números → US stock
  if (/^[A-Z]{1,5}$/.test(ticker)) {
    return { asset_class: AssetClass.STOCK_US, data_source: DataSource.FINNHUB, currency: Currency.USD };
  }
  // Padrão B3: 4 letras + 1 dígito
  if (/^[A-Z]{4}\d{1,2}$/.test(ticker)) {
    const num = parseInt(ticker.slice(-1));
    if (num === 1) return { asset_class: AssetClass.ETF, data_source: DataSource.BRAPI, currency: Currency.BRL };
    return { asset_class: AssetClass.STOCK_BR, data_source: DataSource.BRAPI, currency: Currency.BRL };
  }
  return { asset_class: AssetClass.STOCK_BR, data_source: DataSource.BRAPI, currency: Currency.BRL };
}

// ---------------------------------------------------------------------------
// Validação RN-02 por ativo (simula a timeline combinada)
// ---------------------------------------------------------------------------

interface ValidationError {
  line: number;
  ticker: string;
  message: string;
}

function validateTimeline(
  existingTxsByTicker: Map<string, Array<{ type: string; date: Date; quantity: Decimal }>>,
  newRows: ParsedRow[],
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Agrupa novos rows por ticker
  const byTicker = new Map<string, ParsedRow[]>();
  for (const row of newRows) {
    const existing = byTicker.get(row.ticker) ?? [];
    existing.push(row);
    byTicker.set(row.ticker, existing);
  }

  for (const [ticker, rows] of byTicker.entries()) {
    const existing = existingTxsByTicker.get(ticker) ?? [];

    // Combina existente + novo, ordena por data
    const all = [
      ...existing.map((tx) => ({
        type: tx.type,
        date: tx.date.toISOString().slice(0, 10),
        quantity: tx.quantity,
        line: -1,
      })),
      ...rows.map((r) => ({ type: r.type, date: r.date, quantity: r.quantity, line: r.raw_line })),
    ].sort((a, b) => a.date.localeCompare(b.date));

    let qty = new Decimal(0);
    for (const tx of all) {
      if (tx.type === 'BUY') {
        qty = qty.add(tx.quantity);
      } else if (tx.type === 'SELL') {
        if (tx.quantity.greaterThan(qty)) {
          if (tx.line > 0) {
            errors.push({
              line: tx.line,
              ticker,
              message: `RN-02: venda de ${tx.quantity} excede posição de ${qty}`,
            });
          }
        } else {
          qty = qty.sub(tx.quantity);
        }
      }
      // DIVIDEND: não altera qty
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return jsonError('UNAUTHORIZED', 'Não autorizado', 401);
  }

  // S-4: rejeitar antes de ler o body se Content-Length já ultrapassar 1 MB
  const contentLength = parseInt(request.headers.get('content-length') ?? '0', 10);
  if (contentLength > MAX_BYTES) {
    console.warn(`[import] rejeitado por Content-Length=${contentLength}`);
    return jsonError('FILE_TOO_LARGE', 'Arquivo CSV deve ter no máximo 1 MB', 413);
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') ?? 'preview'; // 'preview' | 'commit'

  let csvContent: string;
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') {
      return jsonError('INVALID_INPUT', 'Campo file ausente', 422);
    }
    csvContent = await (file as File).text();
  } else if (contentType.includes('application/json')) {
    // Aceita JSON com campo csv para facilitar testes
    const body = await request.json();
    csvContent = body?.csv ?? '';
  } else {
    csvContent = await request.text();
  }

  // S-4: segunda barreira — protege contra ausência de Content-Length
  if (csvContent.length > MAX_BYTES) {
    console.warn(`[import] rejeitado por csvContent.length=${csvContent.length}`);
    return jsonError('FILE_TOO_LARGE', 'Arquivo CSV deve ter no máximo 1 MB', 413);
  }

  if (!csvContent.trim()) {
    return jsonError('INVALID_INPUT', 'CSV vazio', 422);
  }

  // Parse do CSV
  const { rows, errors: parseErrors } = parseCsv(csvContent);

  // S-4: teto de linhas pós-parse
  if (rows.length > MAX_ROWS) {
    console.warn(`[import] rejeitado por rows.length=${rows.length}`);
    return jsonError('IMPORT_TOO_MANY_ROWS', 'Máximo de 1000 transações por importação', 422);
  }

  if (parseErrors.length > 0 && rows.length === 0) {
    return NextResponse.json({ message: 'Erro ao processar CSV', error: { code: 'PARSE_ERROR' }, parse_errors: parseErrors }, { status: 422 });
  }

  // Busca transações existentes do usuário para validação RN-02
  const tickers = [...new Set(rows.map((r) => r.ticker))];
  const existingAssets = await prisma.asset.findMany({
    where: { user_id: user.id, ticker: { in: tickers } },
    include: {
      transactions: {
        where: { type: { in: ['BUY', 'SELL'] } },
        orderBy: { date: 'asc' },
        select: { type: true, date: true, quantity: true },
      },
    },
  });

  const existingTxsByTicker = new Map(
    existingAssets.map((a) => [
      a.ticker,
      a.transactions.map((tx) => ({
        type: tx.type as string,
        date: tx.date,
        quantity: new Decimal(tx.quantity.toString()),
      })),
    ]),
  );

  const validationErrors = validateTimeline(existingTxsByTicker, rows);
  const allErrors = [...parseErrors.map((e) => ({ ...e, ticker: '' })), ...validationErrors];

  // Linhas válidas são as que não tiveram erro de validação
  const invalidLines = new Set(validationErrors.map((e) => e.line));
  const validRows = rows.filter((r) => !invalidLines.has(r.raw_line));

  if (mode === 'preview') {
    return NextResponse.json({
      mode: 'preview',
      total_lines: rows.length + parseErrors.length,
      valid_rows: validRows.length,
      invalid_rows: allErrors.length,
      errors: allErrors,
      preview: validRows.map((r) => ({
        ticker: r.ticker,
        type: r.type,
        date: r.date,
        unit_price: r.unit_price.toString(),
        quantity: r.quantity.toString(),
        fees: r.fees.toString(),
        line: r.raw_line,
      })),
    });
  }

  // Commit: persiste em transação atômica (RN-11)
  if (validRows.length === 0) {
    return NextResponse.json({ message: 'Nenhuma linha válida para importar', error: { code: 'NO_VALID_ROWS' }, errors: allErrors }, { status: 422 });
  }

  const assetIdByTicker = new Map(existingAssets.map((a) => [a.ticker, a.id]));

  await prisma.$transaction(async (tx) => {
    for (const row of validRows) {
      let assetId = assetIdByTicker.get(row.ticker);

      if (!assetId) {
        const meta = inferAssetMeta(row.ticker);
        const created = await tx.asset.create({
          data: {
            user_id: user.id,
            ticker: row.ticker,
            name: row.ticker,
            asset_class: meta.asset_class,
            currency: meta.currency,
            data_source: meta.data_source,
          },
        });
        assetId = created.id;
        assetIdByTicker.set(row.ticker, assetId);
      }

      await tx.transaction.create({
        data: {
          asset_id: assetId,
          type: row.type,
          date: new Date(row.date),
          unit_price: row.unit_price.toString(),
          quantity: row.quantity.toString(),
          fees: row.fees.toString(),
        },
      });
    }
  });

  return NextResponse.json({
    mode: 'commit',
    imported: validRows.length,
    skipped: allErrors.length,
    errors: allErrors,
  });
}
