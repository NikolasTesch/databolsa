import type { AssetClass } from '@/types/api';
import type { NormalizedFundamentals } from '@/lib/fundamentals/fundamentals-adapter.interface';

type IndicatorKey = keyof NormalizedFundamentals;

interface IndicatorDef {
  label: string;
  key: IndicatorKey;
  format?: 'number' | 'percent' | 'money';
}

interface IndicatorCategory {
  title: string;
  indicators: IndicatorDef[];
}

interface IndicatorCategoryGridProps {
  assetClass: AssetClass;
  indicators: NormalizedFundamentals;
  staleFields?: string[];
}

const CATEGORIES_BY_CLASS: Record<AssetClass, IndicatorCategory[]> = {
  STOCK_BR: [
    { title: 'Valuation', indicators: [{ label: 'P/L', key: 'pe' }, { label: 'P/VP', key: 'pb' }, { label: 'EV/EBITDA', key: 'evEbitda' }] },
    { title: 'Rentabilidade', indicators: [{ label: 'ROE', key: 'roe', format: 'percent' }, { label: 'Margem liquida', key: 'netMargin', format: 'percent' }] },
    { title: 'Dividendos', indicators: [{ label: 'DY', key: 'dy', format: 'percent' }, { label: 'Ultimo dividendo', key: 'lastDividend', format: 'money' }] },
    { title: 'Risco e liquidez', indicators: [{ label: 'Divida/PL', key: 'debtToEquity' }, { label: 'Liquidez diaria', key: 'dailyLiquidity', format: 'money' }] },
  ],
  STOCK_US: [
    { title: 'Valuation', indicators: [{ label: 'P/L', key: 'pe' }, { label: 'P/VP', key: 'pb' }] },
    { title: 'Rentabilidade', indicators: [{ label: 'ROE', key: 'roe', format: 'percent' }, { label: 'EPS', key: 'eps', format: 'money' }] },
    { title: 'Dividendos', indicators: [{ label: 'DY', key: 'dy', format: 'percent' }] },
    { title: 'Risco e liquidez', indicators: [{ label: 'Valor de mercado', key: 'marketCap', format: 'money' }] },
  ],
  BDR: [
    { title: 'Valuation', indicators: [{ label: 'P/L', key: 'pe' }] },
    { title: 'Dividendos', indicators: [{ label: 'DY', key: 'dy', format: 'percent' }] },
    { title: 'Mercado', indicators: [{ label: 'Valor de mercado', key: 'marketCap', format: 'money' }, { label: 'Var. 52 semanas', key: 'change52w', format: 'percent' }] },
  ],
  FII: [
    { title: 'Valuation', indicators: [{ label: 'P/VP', key: 'pb' }] },
    { title: 'Dividendos', indicators: [{ label: 'DY', key: 'dy', format: 'percent' }, { label: 'Ultimo rendimento', key: 'lastDividend', format: 'money' }] },
    { title: 'Risco e liquidez', indicators: [{ label: 'Vacancia', key: 'vacancyRate', format: 'percent' }, { label: 'Liquidez diaria', key: 'dailyLiquidity', format: 'money' }] },
  ],
  ETF: [
    { title: 'Custo', indicators: [{ label: 'Taxa adm.', key: 'adminFee', format: 'percent' }] },
    { title: 'Risco e liquidez', indicators: [{ label: 'Patrimonio', key: 'netWorth', format: 'money' }, { label: 'Liquidez diaria', key: 'dailyLiquidity', format: 'money' }] },
  ],
  CRYPTO: [
    { title: 'Mercado', indicators: [{ label: 'Valor de mercado', key: 'marketCap', format: 'money' }, { label: 'Volume 24h', key: 'volume24h', format: 'money' }] },
    { title: 'Momentum', indicators: [{ label: 'Var. 7d', key: 'change7d', format: 'percent' }, { label: 'Var. 30d', key: 'change30d', format: 'percent' }] },
    { title: 'Oferta', indicators: [{ label: 'Supply circulante', key: 'circulatingSupply' }, { label: 'Supply maximo', key: 'maxSupply' }] },
  ],
};

function formatIndicator(value: string | null, format: IndicatorDef['format'] = 'number'): string {
  if (value === null || value === '' || value === 'NaN') return '-';

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return '-';

  if (format === 'percent') return `${parsed.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
  if (format === 'money') return `R$ ${parsed.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
  return parsed.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function IndicatorCategoryGrid({ assetClass, indicators, staleFields }: IndicatorCategoryGridProps) {
  const categories = CATEGORIES_BY_CLASS[assetClass] ?? CATEGORIES_BY_CLASS.STOCK_BR;
  const staleSet = new Set(staleFields ?? []);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {categories.map((category) => (
        <section key={category.title} className="rounded-lg border border-border bg-surface p-4">
          <h3 className="text-sm font-semibold text-on-surface">{category.title}</h3>
          <dl className="mt-3 grid grid-cols-2 gap-3">
            {category.indicators.map((indicator) => (
              <div key={indicator.key} className="rounded-md bg-surface-container-low p-3">
                <dt className="flex items-center gap-1 text-xs text-on-surface-variant">
                  {indicator.label}
                  {staleSet.has(indicator.key) && (
                    <span className="material-symbols-outlined text-[12px] text-stale" title="Dado desatualizado">
                      schedule
                    </span>
                  )}
                </dt>
                <dd className="mt-1 font-mono text-sm font-semibold text-on-surface">
                  {formatIndicator(indicators[indicator.key], indicator.format)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
