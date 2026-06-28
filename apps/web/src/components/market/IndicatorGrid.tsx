import { IndicatorCard } from './IndicatorCard';
import type { AssetClass } from '@/types/api';
import type { NormalizedFundamentals } from '@/lib/fundamentals/fundamentals-adapter.interface';

interface IndicatorDef {
  label: string;
  key: keyof NormalizedFundamentals;
  tooltip?: string;
  format?: (v: string) => string;
}

const PCT = (v: string) => `${parseFloat(v).toFixed(2)}%`;
const BRL = (v: string) => `R$ ${parseFloat(v).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
const USD = (v: string) => `US$ ${parseFloat(v).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
const NUM = (v: string) => parseFloat(v).toLocaleString('pt-BR', { maximumFractionDigits: 2 });

const INDICATORS_BY_CLASS: Record<AssetClass, IndicatorDef[]> = {
  STOCK_BR: [
    { label: 'P/L', key: 'pe', tooltip: 'Preço/Lucro — quantos anos de lucro para pagar o preço atual', format: NUM },
    { label: 'P/VP', key: 'pb', tooltip: 'Preço sobre Valor Patrimonial por Ação', format: NUM },
    { label: 'DY (%)', key: 'dy', tooltip: 'Dividend Yield — rendimento em dividendos no último ano', format: PCT },
    { label: 'ROE (%)', key: 'roe', tooltip: 'Return on Equity — retorno sobre o patrimônio líquido', format: PCT },
    { label: 'Margem Líq. (%)', key: 'netMargin', tooltip: 'Percentual do lucro líquido sobre a receita', format: PCT },
    { label: 'EV/EBITDA', key: 'evEbitda', tooltip: 'Enterprise Value sobre EBITDA', format: NUM },
    { label: 'Dívida/PL', key: 'debtToEquity', tooltip: 'Relação dívida líquida / patrimônio líquido', format: NUM },
    { label: 'Valor de Mercado', key: 'marketCap', tooltip: 'Capitalização de mercado em R$', format: BRL },
  ],
  FII: [
    { label: 'P/VP', key: 'pb', tooltip: 'Preço sobre Valor Patrimonial da cota', format: NUM },
    { label: 'DY (%)', key: 'dy', tooltip: 'Dividend Yield do fundo', format: PCT },
    { label: 'Vacância (%)', key: 'vacancyRate', tooltip: 'Taxa de vacância física do fundo', format: PCT },
    { label: 'Últ. Rendimento', key: 'lastDividend', tooltip: 'Valor do último rendimento distribuído (R$/cota)', format: BRL },
    { label: 'Patrimônio', key: 'netWorth', tooltip: 'Patrimônio líquido total do fundo em R$', format: BRL },
    { label: 'N. de Cotas', key: 'totalShares', tooltip: 'Número total de cotas emitidas', format: NUM },
    { label: 'Liq. Diária', key: 'dailyLiquidity', tooltip: 'Liquidez diária média em R$', format: BRL },
  ],
  ETF: [
    { label: 'P/VP', key: 'pb', tooltip: 'Preço sobre Valor Patrimonial', format: NUM },
    { label: 'Taxa Adm. (%)', key: 'adminFee', tooltip: 'Taxa de administração anual', format: PCT },
    { label: 'Patrimônio', key: 'netWorth', tooltip: 'Patrimônio líquido do ETF', format: BRL },
    { label: 'Liq. Diária', key: 'dailyLiquidity', tooltip: 'Liquidez diária média em R$', format: BRL },
  ],
  BDR: [
    { label: 'P/L', key: 'pe', tooltip: 'Preço/Lucro do ativo subjacente', format: NUM },
    { label: 'DY (%)', key: 'dy', tooltip: 'Dividend Yield', format: PCT },
    { label: 'Valor de Mercado', key: 'marketCap', tooltip: 'Market cap da empresa original em USD', format: USD },
    { label: 'Var. 52 sem.', key: 'change52w', tooltip: 'Variação de preço nas últimas 52 semanas', format: PCT },
  ],
  STOCK_US: [
    { label: 'P/L', key: 'pe', tooltip: 'Price/Earnings ratio', format: NUM },
    { label: 'P/VP', key: 'pb', tooltip: 'Price/Book ratio', format: NUM },
    { label: 'DY (%)', key: 'dy', tooltip: 'Dividend Yield', format: PCT },
    { label: 'ROE (%)', key: 'roe', tooltip: 'Return on Equity', format: PCT },
    { label: 'EPS (USD)', key: 'eps', tooltip: 'Earnings per Share em USD', format: USD },
    { label: 'Valor de Mercado', key: 'marketCap', tooltip: 'Capitalização de mercado em USD', format: USD },
    { label: 'Receita', key: 'revenue', tooltip: 'Receita por ação em USD', format: USD },
  ],
  CRYPTO: [
    { label: 'Valor de Mercado', key: 'marketCap', tooltip: 'Capitalização de mercado em BRL', format: BRL },
    { label: 'Vol. 24h', key: 'volume24h', tooltip: 'Volume de negociação nas últimas 24h em BRL', format: BRL },
    { label: 'Supply em Circulação', key: 'circulatingSupply', tooltip: 'Quantidade de moedas em circulação', format: NUM },
    { label: 'Supply Máx.', key: 'maxSupply', tooltip: 'Quantidade máxima de moedas que existirão', format: NUM },
    { label: 'Var. 7d (%)', key: 'change7d', tooltip: 'Variação de preço nos últimos 7 dias', format: PCT },
    { label: 'Var. 30d (%)', key: 'change30d', tooltip: 'Variação de preço nos últimos 30 dias', format: PCT },
  ],
};

interface IndicatorGridProps {
  indicators: NormalizedFundamentals;
  assetClass: AssetClass;
}

function formatValue(value: string | null, format?: (v: string) => string): string | null {
  if (value === null) return null;
  if (!format) return value;
  try {
    return format(value);
  } catch {
    return null;
  }
}

export function IndicatorGrid({ indicators, assetClass }: IndicatorGridProps) {
  const defs = INDICATORS_BY_CLASS[assetClass] ?? INDICATORS_BY_CLASS.STOCK_BR;

  return (
    <div className="py-8 px-4 md:px-8 bg-background">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {defs.map((def) => {
          const rawValue = indicators[def.key] as string | null;
          const displayValue = formatValue(rawValue, def.format);
          return (
            <IndicatorCard
              key={def.key}
              label={def.label}
              value={displayValue}
              tooltip={def.tooltip}
            />
          );
        })}
      </div>
    </div>
  );
}
