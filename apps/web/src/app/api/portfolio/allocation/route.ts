import { NextRequest, NextResponse } from 'next/server';
import { Decimal } from 'decimal.js';
import { getAuthUser } from '@/lib/auth/get-user';
import { computePositions } from '@/lib/portfolio/positions';

interface AllocationItem {
  key: string;
  value_brl: string;
  pct: string;
}

function buildAllocation(entries: { key: string; value: Decimal }[], total: Decimal): AllocationItem[] {
  return entries
    .filter((e) => e.value.greaterThan(0))
    .map((e) => ({
      key: e.key,
      value_brl: e.value.toString(),
      pct: total.isZero() ? '0' : e.value.div(total).mul(100).toFixed(4),
    }))
    .sort((a, b) => parseFloat(b.pct) - parseFloat(a.pct));
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  const { positions: computed, totalBrl: total } = await computePositions(user.id);

  // Acumula valor_brl por asset_class, sector e currency
  const byClass = new Map<string, Decimal>();
  const bySector = new Map<string, Decimal>();
  const byCurrency = new Map<string, Decimal>();

  for (const cp of computed) {
    if (cp.valueBrl === null) continue;

    const valueBrl = cp.valueBrl;

    // Por classe de ativo
    const cls = cp.asset.asset_class as string;
    byClass.set(cls, (byClass.get(cls) ?? new Decimal(0)).add(valueBrl));

    // Por setor (null → "Não classificado")
    const sector = cp.asset.sector ?? 'Não classificado';
    bySector.set(sector, (bySector.get(sector) ?? new Decimal(0)).add(valueBrl));

    // Por moeda/geografia
    const currency = cp.asset.currency as string;
    byCurrency.set(currency, (byCurrency.get(currency) ?? new Decimal(0)).add(valueBrl));
  }

  return NextResponse.json({
    patrimonio_total_brl: total.toString(),
    by_class: buildAllocation(
      Array.from(byClass.entries()).map(([key, value]) => ({ key, value })),
      total,
    ),
    by_sector: buildAllocation(
      Array.from(bySector.entries()).map(([key, value]) => ({ key, value })),
      total,
    ),
    by_currency: buildAllocation(
      Array.from(byCurrency.entries()).map(([key, value]) => ({ key, value })),
      total,
    ),
  });
}
