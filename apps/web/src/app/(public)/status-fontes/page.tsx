import { cn } from '@/components/ui/cn';

interface SourceInfo {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  lastSync: string | null;
  coverageByClass: Record<string, string>;
  assetCount: number;
}

interface SourceStatusResponse {
  sources: SourceInfo[];
  globalCoverage: string;
  asOf: string;
}

const STATUS_LABELS: Record<string, string> = {
  online: 'Online',
  offline: 'Offline',
  degraded: 'Degradado',
};

const STATUS_CLASSES: Record<string, string> = {
  online: 'bg-[#1a3a2a] text-[#4edea3]',
  offline: 'bg-[#3a1a1a] text-[#ff6b6b]',
  degraded: 'bg-[#3a2e1a] text-[#ffb786]',
};

async function fetchSourceStatus(): Promise<SourceStatusResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
  try {
    const res = await fetch(`${baseUrl}/api/market/source-status`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as SourceStatusResponse;
  } catch {
    return {
      sources: [
        { name: 'BRAPI', status: 'offline', lastSync: null, coverageByClass: {}, assetCount: 0 },
        { name: 'CoinGecko', status: 'offline', lastSync: null, coverageByClass: {}, assetCount: 0 },
        { name: 'Finnhub', status: 'offline', lastSync: null, coverageByClass: {}, assetCount: 0 },
      ],
      globalCoverage: '0%',
      asOf: new Date().toISOString(),
    };
  }
}

export default async function StatusFontesPage() {
  const data = await fetchSourceStatus();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Status das Fontes</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Situacao atual das fontes de dados externas utilizadas para enriquecer as informacoes dos ativos.
        </p>
      </div>

      {/* Cobertura global */}
      <div className="mb-8 rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">database</span>
          <div>
            <p className="text-sm font-semibold text-on-surface">Cobertura global</p>
            <p className="text-2xl font-bold text-on-surface">{data.globalCoverage}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-on-surface-variant">
          Atualizado em:{' '}
          {new Date(data.asOf).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {/* Tabela de fontes */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-container-low">
              <th className="px-4 py-3 font-semibold text-on-surface">Fonte</th>
              <th className="px-4 py-3 font-semibold text-on-surface">Status</th>
              <th className="px-4 py-3 font-semibold text-on-surface">Ultima sync</th>
              <th className="px-4 py-3 font-semibold text-on-surface">Cobertura</th>
              <th className="px-4 py-3 font-semibold text-on-surface">Ativos</th>
            </tr>
          </thead>
          <tbody>
            {data.sources.map((source) => (
              <tr key={source.name} className="border-b border-border last:border-b-0 hover:bg-surface-container-low/50">
                <td className="px-4 py-3 font-medium text-on-surface">{source.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                      STATUS_CLASSES[source.status],
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        source.status === 'online' && 'bg-[#4edea3]',
                        source.status === 'offline' && 'bg-[#ff6b6b]',
                        source.status === 'degraded' && 'bg-[#ffb786]',
                      )}
                    />
                    {STATUS_LABELS[source.status]}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-on-surface-variant">
                  {source.lastSync
                    ? new Date(source.lastSync).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  {Object.keys(source.coverageByClass).length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(source.coverageByClass).map(([cls, cov]) => (
                        <span
                          key={cls}
                          className="rounded bg-surface-container-low px-1.5 py-0.5 text-[11px] text-on-surface-variant"
                        >
                          {cls}: {cov}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-on-surface-variant">—</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-on-surface">{source.assetCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.sources.length === 0 && (
        <p className="mt-6 text-center text-sm text-on-surface-variant">
          Nenhuma fonte de dados disponivel no momento.
        </p>
      )}

      {/* Legenda de status */}
      <div className="mt-8 rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-2 text-sm font-semibold text-on-surface">Legenda</h2>
        <div className="grid gap-2 text-xs text-on-surface-variant sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#4edea3]" />
            <span>Online — Fonte respondendo dentro do prazo esperado.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#ffb786]" />
            <span>Degradado — Ultima sync ha mais de 12h.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#ff6b6b]" />
            <span>Offline — Nenhum dado recebido ou fonte indisponivel.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
