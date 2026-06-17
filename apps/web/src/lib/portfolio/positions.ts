/**
 * positions.ts
 *
 * Centraliza a lógica de busca de assets + transações, cálculo de posições
 * e fetch de cotações para o portfólio de um usuário.
 *
 * Utilizada pelas rotas summary e allocation (e qualquer futura rota que
 * precise do conjunto completo de posições abertas do usuário).
 *
 * Regras de negócio aplicadas:
 *   - RN-10: cotação stale é aceita (anyStale=true) em vez de quebrar o total
 *   - RN-11: filtro estrito por user_id
 *   - RN-02/RN-03: cálculo delegado ao packages/core (calculatePosition)
 */
import { Decimal } from 'decimal.js';
import { AssetClass, Currency } from '@prisma/client';
import { calculatePosition } from '@databolsa/core';
import type { PositionResult } from '@databolsa/core';
import prisma from '@/lib/prisma';
import { quoteService as defaultQuoteService, QuoteService } from '@/lib/quotes/quote.service';
import { prismaToCoreTx } from './tx-mapper';

/** Dados do asset necessários em ComputedPosition. */
export interface ComputedPositionAsset {
  id: string;
  ticker: string;
  name: string;
  asset_class: AssetClass;
  currency: Currency;
  sector: string | null;
}

/** Posição calculada enriquecida com valor em BRL e alocação. */
export interface ComputedPosition {
  asset: ComputedPositionAsset;
  /** Resultado bruto do core (preços na moeda original do ativo). */
  position: PositionResult;
  /** Cotação atual em BRL (null se indisponível). */
  currentPriceBrl: Decimal | null;
  /** Valor atual da posição em BRL (null se cotação indisponível). */
  valueBrl: Decimal | null;
  /**
   * Percentual de alocação sobre o patrimônio total (null se cotação
   * indisponível ou patrimônio zero).
   */
  allocationPct: Decimal | null;
  /** true se a cotação for stale (RN-10). */
  isStale: boolean;
}

export interface ComputePositionsResult {
  positions: ComputedPosition[];
  /** Patrimônio total em BRL (soma das posições com cotação disponível). */
  totalBrl: Decimal;
  /** true se qualquer cotação estiver stale. */
  anyStale: boolean;
}

/**
 * Busca todos os assets e transações do usuário, calcula posições via core e
 * obtém cotações em paralelo.
 *
 * @param userId  ID do usuário (RN-11 — isolamento estrito)
 * @param qs      Instância de QuoteService (default: singleton compartilhado).
 *                Passar uma instância diferente em testes permite mock.
 */
export async function computePositions(
  userId: string,
  qs: QuoteService = defaultQuoteService,
): Promise<ComputePositionsResult> {
  const assets = await prisma.asset.findMany({
    where: { user_id: userId },
    include: { transactions: { orderBy: { date: 'asc' } } },
  });

  // Filtra apenas assets que possuem pelo menos uma compra ou venda
  const assetsWithTxs = assets.filter((asset) =>
    asset.transactions.some((tx) => tx.type === 'BUY' || tx.type === 'SELL'),
  );

  // Busca cotações em paralelo para todos os tickers
  const quoteResults = await Promise.all(
    assetsWithTxs.map((asset) =>
      qs.getQuote(asset.ticker, asset.asset_class, asset.currency),
    ),
  );

  const positions: ComputedPosition[] = [];
  let totalBrl = new Decimal(0);
  let anyStale = false;

  for (let i = 0; i < assetsWithTxs.length; i++) {
    const asset = assetsWithTxs[i];
    const quoteResult = quoteResults[i];

    const coreTxs = asset.transactions.map(prismaToCoreTx);
    const quotePrice = quoteResult?.priceBrl ?? new Decimal(0);
    const position = calculatePosition(coreTxs, quotePrice);

    // Ignora posições zeradas (qtd = 0)
    if (position.current_quantity.isZero()) continue;

    const currentPriceBrl = quoteResult?.priceBrl ?? null;
    const valueBrl = quoteResult ? position.current_value : null;

    if (quoteResult) {
      totalBrl = totalBrl.plus(position.current_value);
      if (quoteResult.isStale) anyStale = true;
    }

    positions.push({
      asset: {
        id: asset.id,
        ticker: asset.ticker,
        name: asset.name,
        asset_class: asset.asset_class,
        currency: asset.currency,
        sector: asset.sector ?? null,
      },
      position,
      currentPriceBrl,
      valueBrl,
      allocationPct: null, // calculado após somar totalBrl
      isStale: quoteResult?.isStale ?? false,
    });
  }

  // Calcula alocação percentual agora que totalBrl é conhecido
  if (totalBrl.greaterThan(0)) {
    for (const pos of positions) {
      if (pos.valueBrl !== null) {
        pos.allocationPct = pos.valueBrl.div(totalBrl).times(100);
      }
    }
  }

  return { positions, totalBrl, anyStale };
}
