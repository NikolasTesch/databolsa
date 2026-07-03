import { Decimal } from 'decimal.js';
import type { AssetClass } from '@/types/api';

interface DividendItem {
  paymentDate: string;
  value: string;
  type: string;
}

interface DividendAnalysisPanelProps {
  dividends: DividendItem[];
  assetClass: AssetClass;
}

export function DividendAnalysisPanel({ dividends, assetClass }: DividendAnalysisPanelProps) {
  if (assetClass === 'CRYPTO') return null;

  if (!dividends || dividends.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-primary">payments</span>
          <h3 className="text-sm font-semibold text-on-surface">Resumo de Proventos</h3>
        </div>
        <p className="text-sm text-on-surface-variant">Nenhum provento registrado no periodo.</p>
      </div>
    );
  }

  const totalValue = dividends.reduce(
    (sum, d) => sum.plus(new Decimal(d.value)),
    new Decimal(0),
  );
  const averageValue = totalValue.div(dividends.length);
  const lastPayment = dividends.reduce((latest, d) =>
    d.paymentDate > latest.paymentDate ? d : latest,
  );

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-primary">payments</span>
        <h3 className="text-sm font-semibold text-on-surface">Resumo de Proventos</h3>
      </div>

      <dl className="grid grid-cols-2 gap-4">
        <div className="rounded-md bg-surface-container-low p-3">
          <dt className="text-xs text-on-surface-variant">Total no periodo</dt>
          <dd className="mt-1 font-mono text-sm font-semibold text-on-surface tabular-nums">
            R$ {totalValue.toFixed(2)}
          </dd>
        </div>
        <div className="rounded-md bg-surface-container-low p-3">
          <dt className="text-xs text-on-surface-variant">Media por evento</dt>
          <dd className="mt-1 font-mono text-sm font-semibold text-on-surface tabular-nums">
            R$ {averageValue.toFixed(2)}
          </dd>
        </div>
        <div className="rounded-md bg-surface-container-low p-3">
          <dt className="text-xs text-on-surface-variant">Quantidade de eventos</dt>
          <dd className="mt-1 font-mono text-sm font-semibold text-on-surface tabular-nums">
            {dividends.length}
          </dd>
        </div>
        <div className="rounded-md bg-surface-container-low p-3">
          <dt className="text-xs text-on-surface-variant">Ultimo pagamento</dt>
          <dd className="mt-1 font-mono text-sm font-semibold text-on-surface tabular-nums">
            R$ {lastPayment.value}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-on-surface-variant">
        &dagger; Valores com base no historico carregado de proventos.
      </p>
    </div>
  );
}
