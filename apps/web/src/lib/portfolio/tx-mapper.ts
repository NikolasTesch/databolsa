/**
 * tx-mapper.ts
 *
 * Fonte única da verdade para converter um registro Prisma Transaction
 * no tipo CoreTransaction usado por packages/core.
 *
 * Regra: nenhum arquivo de rota deve redefinir essa conversão localmente.
 */
import { TransactionType, Prisma } from '@prisma/client';
import { Decimal } from 'decimal.js';
import type { Transaction as CoreTransaction } from '@databolsa/core';

/** Shape mínimo de um registro Prisma Transaction exigido pela conversão. */
export interface PrismaTxFields {
  type: TransactionType;
  date: Date;
  unit_price: Prisma.Decimal;
  quantity: Prisma.Decimal;
  fees: Prisma.Decimal;
}

/**
 * Converte um registro Prisma Transaction para o tipo CoreTransaction.
 *
 * - Preserva a data como string ISO 8601 (YYYY-MM-DD).
 * - Converte Prisma.Decimal → decimal.js Decimal para segurança numérica.
 * - O campo `type` inclui DIVIDEND (ignorado pelo core em cálculos de P/L).
 */
export function prismaToCoreTx(tx: PrismaTxFields): CoreTransaction {
  return {
    type: tx.type as CoreTransaction['type'],
    date: tx.date.toISOString().slice(0, 10),
    unit_price: new Decimal(tx.unit_price.toString()),
    quantity: new Decimal(tx.quantity.toString()),
    fees: new Decimal(tx.fees.toString()),
  };
}
