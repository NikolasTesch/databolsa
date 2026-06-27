import Link from 'next/link';
import { TransactionForm } from '@/components/transactions/TransactionForm';

interface NewTransactionPageProps {
  params: { id: string };
}

export default function NewTransactionPage({ params }: NewTransactionPageProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href={`/assets/${params.id}`}
          className="text-on-surface-variant hover:text-on-surface text-sm"
        >
          ← Voltar
        </Link>
        <h1 className="text-xl font-semibold text-on-surface">Nova Transação</h1>
      </div>
      <TransactionForm assetId={params.id} />
    </div>
  );
}
