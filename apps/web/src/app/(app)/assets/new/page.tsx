import { AssetForm } from '@/components/assets/AssetForm';

interface NewAssetPageProps {
  searchParams: { ticker?: string; assetClass?: string };
}

export default function NewAssetPage({ searchParams }: NewAssetPageProps) {
  const { ticker, assetClass } = searchParams;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-on-surface">Novo Ativo</h1>
      <AssetForm
        defaultTicker={ticker}
        defaultAssetClass={assetClass}
      />
    </div>
  );
}
