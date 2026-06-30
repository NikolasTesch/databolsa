import { NextRequest, NextResponse } from 'next/server';
import { Decimal } from 'decimal.js';
import { getAuthUser } from '@/lib/auth/get-user';
import { assertCanViewPortfolio } from '@/lib/auth/groups';
import { computePositions } from '@/lib/portfolio/positions';
import { jsonError } from '@/lib/http/errors';

interface PositionItem {
  ticker: string;
  asset_id: string;
  current_quantity: string;
  average_price: string;
  invested_value: string;
  valor_atual_brl: string | null;
  lucro_prejuizo_brl: string | null;
  lucro_prejuizo_pct: string | null;
  total_dividends_brl: string;
  total_return_brl: string | null;
  total_return_pct: string | null;
  yield_on_cost_pct: string;
  alocacao_pct: string | null;
  is_stale: boolean;
  current_price_brl: string | null;
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return jsonError('UNAUTHORIZED', 'Não autorizado', 401);
  }

  const targetUserId = request.nextUrl.searchParams.get('targetUserId') ?? user.id;
  if (targetUserId !== user.id) {
    try {
      await assertCanViewPortfolio(user.id, targetUserId);
    } catch {
      return jsonError('FORBIDDEN', 'Você não tem permissão para ver esta carteira', 403);
    }
  }

  const { positions: computed, totalBrl } = await computePositions(targetUserId);

  const positions: PositionItem[] = computed.map((cp) => {
    const { asset, position } = cp;
    const hasQuote = cp.currentPriceBrl !== null;

    return {
      ticker: asset.ticker,
      asset_id: asset.id,
      current_quantity: position.current_quantity.toString(),
      average_price: position.average_price.toString(),
      invested_value: position.invested_value.toString(),
      valor_atual_brl: hasQuote ? position.current_value.toString() : null,
      lucro_prejuizo_brl: hasQuote ? position.profit_loss.toString() : null,
      lucro_prejuizo_pct: hasQuote ? position.profit_loss_pct.toString() : null,
      total_dividends_brl: position.total_dividends.toString(),
      total_return_brl: hasQuote ? position.total_return.toString() : null,
      total_return_pct: hasQuote ? position.total_return_pct.toString() : null,
      yield_on_cost_pct: position.yield_on_cost_pct.toString(),
      alocacao_pct: cp.allocationPct !== null ? cp.allocationPct.toFixed(4) : null,
      is_stale: cp.isStale,
      current_price_brl: cp.currentPriceBrl !== null ? cp.currentPriceBrl.toString() : null,
    };
  });

  // Recalcula alocacao_pct com toFixed(4) — já calculado em computePositions,
  // mas positions.ts retorna Decimal e a rota precisa de string formatada.
  // A linha acima já aplica toFixed(4) via cp.allocationPct.toFixed(4).

  return NextResponse.json(
    {
      positions,
      patrimonio_total_brl: totalBrl.toString(),
    },
    { status: 200 },
  );
}
