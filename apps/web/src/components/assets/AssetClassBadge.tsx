import { Badge } from '@/components/ui/Badge';
import type { AssetClass } from '@/types/api';

const labelMap: Record<AssetClass, string> = {
  STOCK_BR: 'Ação BR',
  FII: 'FII',
  ETF: 'ETF',
  BDR: 'BDR',
  CRYPTO: 'Cripto',
  STOCK_US: 'Ação US',
};

const variantMap: Record<AssetClass, 'info' | 'neutral' | 'success'> = {
  STOCK_BR: 'info',
  FII: 'neutral',
  ETF: 'neutral',
  BDR: 'neutral',
  CRYPTO: 'success',
  STOCK_US: 'info',
};

interface AssetClassBadgeProps {
  assetClass: AssetClass;
}

export function AssetClassBadge({ assetClass }: AssetClassBadgeProps) {
  return (
    <Badge variant={variantMap[assetClass]}>
      {labelMap[assetClass]}
    </Badge>
  );
}
