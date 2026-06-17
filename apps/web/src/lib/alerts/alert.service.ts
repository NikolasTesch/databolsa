import { AlertCondition } from '@prisma/client';
import { Decimal } from 'decimal.js';
import prisma from '@/lib/prisma';
import { quoteService } from '@/lib/quotes/quote.service';

/**
 * Avalia alertas ativos do usuário de forma lazy (RN-10, ADR-0010).
 * Chamado em rotas que já buscam cotações — sem polling dedicado.
 * Dispara o alerta no máximo uma vez: grava triggered_at e desativa.
 */
export async function evaluateAlerts(userId: string): Promise<void> {
  const alerts = await prisma.priceAlert.findMany({
    where: { user_id: userId, is_active: true },
    include: {
      user: {
        select: {
          assets: {
            where: {},
            select: { ticker: true, asset_class: true, currency: true },
          },
        },
      },
    },
  });

  if (alerts.length === 0) return;

  // Busca cotação de cada ticker único
  const uniqueTickers = [...new Set(alerts.map((a) => a.asset_ticker))];
  const quoteByTicker = new Map<string, Decimal>();

  await Promise.all(
    uniqueTickers.map(async (ticker) => {
      // Localiza asset_class e currency para este ticker no portfólio do usuário
      const asset = alerts
        .find((a) => a.asset_ticker === ticker)
        ?.user.assets.find((a) => a.ticker === ticker);
      if (!asset) return;

      const result = await quoteService.getQuote(ticker, asset.asset_class, asset.currency);
      if (result) quoteByTicker.set(ticker, result.priceBrl);
    }),
  );

  const now = new Date();
  const toTrigger: string[] = [];

  for (const alert of alerts) {
    const currentPrice = quoteByTicker.get(alert.asset_ticker);
    if (!currentPrice) continue; // sem cotação: não dispara, não quebra (RN-10)

    const target = new Decimal(alert.target_price.toString());
    const triggered =
      (alert.condition === AlertCondition.ABOVE && currentPrice.gte(target)) ||
      (alert.condition === AlertCondition.BELOW && currentPrice.lte(target));

    if (triggered) toTrigger.push(alert.id);
  }

  if (toTrigger.length > 0) {
    await prisma.priceAlert.updateMany({
      where: { id: { in: toTrigger } },
      data: { is_active: false, triggered_at: now },
    });
  }
}
