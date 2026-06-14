import type { AssetClass } from '@/types/api';

interface Dividend {
  paymentDate: string;
  value: string;
  type: string;
}

interface DividendsTableProps {
  dividends: Dividend[];
  assetClass: AssetClass;
}

const NO_DIVIDENDS_CLASSES = new Set<AssetClass>(['CRYPTO', 'ETF']);

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

export function DividendsTable({ dividends, assetClass }: DividendsTableProps) {
  if (NO_DIVIDENDS_CLASSES.has(assetClass)) {
    return null;
  }

  return (
    <div className="mx-4 md:mx-8 mb-8">
      <div className="bg-surface border border-border rounded-lg p-6">
        <h2 className="text-sm font-semibold text-content-muted uppercase tracking-wide mb-4">
          Histórico de Proventos
        </h2>

        {dividends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-content-muted">
            <svg
              className="h-8 w-8 opacity-40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={1.5} />
              <line x1="16" y1="2" x2="16" y2="6" strokeWidth={1.5} />
              <line x1="8" y1="2" x2="8" y2="6" strokeWidth={1.5} />
              <line x1="3" y1="10" x2="21" y2="10" strokeWidth={1.5} />
            </svg>
            <p className="text-sm">Nenhum provento encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-content-muted uppercase border-b border-border">
                  <th className="text-left pb-2 pr-4">Data de Pagamento</th>
                  <th className="text-left pb-2 pr-4">Tipo</th>
                  <th className="text-right pb-2">Valor por Cota</th>
                </tr>
              </thead>
              <tbody>
                {dividends.map((d, idx) => (
                  <tr
                    key={`${d.paymentDate}-${idx}`}
                    className={`border-b border-border/50 hover:bg-primary/5 transition-colors ${idx % 2 === 0 ? 'bg-surface' : 'bg-surface-muted'}`}
                  >
                    <td className="py-2 pr-4 font-mono text-content">{formatDate(d.paymentDate)}</td>
                    <td className="py-2 pr-4 text-content-muted">{d.type}</td>
                    <td className="py-2 text-right font-mono text-content">
                      R$ {parseFloat(d.value).toLocaleString('pt-BR', { minimumFractionDigits: 4 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
