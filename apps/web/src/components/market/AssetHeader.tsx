import { AssetClassBadge } from '@/components/assets/AssetClassBadge';
import { StaleBadge } from '@/components/portfolio/StaleBadge';
import { TrendBadge } from '@/components/ui/TrendBadge';
import { AddToPortfolioButton } from './AddToPortfolioButton';
import type { AssetClass } from '@/types/api';

interface AssetHeaderProps {
  ticker: string;
  name: string;
  assetClass: AssetClass;
  price: string;
  priceInBrl?: string | null;
  currency: string;
  changePercent: string | null;
  changeValue: string | null;
  stale?: boolean;
}

export function AssetHeader({
  ticker,
  name,
  assetClass,
  price,
  priceInBrl,
  currency,
  changePercent,
  changeValue,
  stale,
}: AssetHeaderProps) {
  const isUsd = currency === 'USD';

  return (
    <div className="bg-surface border-b border-border py-6 px-4 md:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        {/* Lado esquerdo */}
        <div className="flex flex-col gap-2">
          {/* Linha 1: badge + ticker + nome */}
          <div className="flex items-center gap-2 flex-wrap">
            <AssetClassBadge assetClass={assetClass} />
            <span className="text-2xl font-mono font-bold text-on-surface">{ticker}</span>
            {name && name !== ticker && (
              <span className="text-base text-on-surface-variant">{name}</span>
            )}
          </div>

          {/* Linha 2: preço */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-4xl font-mono font-bold text-on-surface">
              {isUsd ? `US$ ${price}` : `R$ ${price}`}
            </span>
            {isUsd && priceInBrl && (
              <span className="text-lg font-mono text-on-surface-variant">
                ≈ R$ {priceInBrl}
              </span>
            )}
          </div>

          {/* Linha 3: variação */}
          <div className="flex items-center gap-2">
            <TrendBadge value={changePercent} showIcon className="text-xl" />
            {changeValue && (
              <span className="text-sm font-mono text-on-surface-variant">
                ({parseFloat(changeValue) >= 0 ? '+' : ''}{parseFloat(changeValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} hoje)
              </span>
            )}
          </div>
        </div>

        {/* Lado direito: botão + stale */}
        <div className="flex items-center gap-3 mt-2 md:mt-0">
          {stale && <StaleBadge />}
          <AddToPortfolioButton ticker={ticker} assetClass={assetClass} />
        </div>
      </div>
    </div>
  );
}
