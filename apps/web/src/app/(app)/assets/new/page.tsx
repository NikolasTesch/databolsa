import { AssetForm } from '@/components/assets/AssetForm';

export default function NewAssetPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-content">Novo Ativo</h1>
      <AssetForm />
    </div>
  );
}
