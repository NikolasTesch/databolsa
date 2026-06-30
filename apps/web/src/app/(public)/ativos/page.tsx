import Link from 'next/link';
import { cn } from '@/components/ui/cn';
import { fetchAssetsForClass } from '@/lib/market/highlights-data';
import type { HighlightItem } from '@/lib/market/highlights-data';

export const dynamic = 'force-dynamic';

const ASSET_CLASSES = [
  { label: 'Ações', key: 'STOCK_BR' },
  { label: 'FIIs', key: 'FII' },
  { label: 'BDRs', key: 'BDR' },
  { label: 'ETFs', key: 'ETF' },
  { label: 'Cripto', key: 'CRYPTO' },
  { label: 'Stocks US', key: 'STOCK_US' },
] as const;

interface PageProps {
  searchParams: { classe?: string; sort?: string; page?: string };
}

export default async function AtivosPage({ searchParams }: PageProps) {
  const activeClass = (ASSET_CLASSES.find((c) => c.key === searchParams.classe)?.key ?? 'STOCK_BR') as any;
  const sort = searchParams.sort ?? 'change';
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);
  const limit = 20;

  let items: HighlightItem[] = [];
  try { items = await fetchAssetsForClass(activeClass); }
  catch { items = []; }

  // Ordenação
  const sorted = [...items].sort((a, b) => {
    if (sort === 'change_asc') return parseFloat(a.changePercent) - parseFloat(b.changePercent);
    if (sort === 'name') return a.ticker.localeCompare(b.ticker);
    return parseFloat(b.changePercent) - parseFloat(a.changePercent); // change desc default
  });

  const totalPages = Math.ceil(sorted.length / limit);
  const paged = sorted.slice((page - 1) * limit, page * limit);

  return (
    <div className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-10">
      <h1 className="text-xl font-semibold text-on-surface mb-6">Mercado</h1>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto no-scrollbar" role="tablist">
        {ASSET_CLASSES.map((tab) => (
          <Link
            key={tab.key}
            href={`/ativos?classe=${tab.key}&sort=${sort}`}
            role="tab"
            aria-selected={activeClass === tab.key}
            className={cn(
              'flex-shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
              activeClass === tab.key
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-surface text-on-surface-variant border-border/50 hover:border-border hover:text-on-surface',
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Sort options */}
      <div className="mb-4 flex gap-2 text-sm">
        <span className="text-on-surface-variant">Ordenar:</span>
        {[
          { label: 'Maiores altas', value: 'change' },
          { label: 'Maiores baixas', value: 'change_asc' },
          { label: 'Nome (A-Z)', value: 'name' },
        ].map((opt) => (
          <Link
            key={opt.value}
            href={`/ativos?classe=${activeClass}&sort=${opt.value}`}
            className={cn('px-2 py-0.5 rounded transition-colors', sort === opt.value ? 'bg-primary/10 text-primary font-medium' : 'text-on-surface-variant hover:text-on-surface')}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {/* Asset list */}
      {paged.length === 0 ? (
        <p className="text-sm text-on-surface-variant py-8 text-center">Nenhum dado disponível no momento.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {paged.map((asset) => {
            const isPositive = asset.changePercent.startsWith('+');
            return (
              <Link
                key={asset.ticker}
                href={`/ativos/${asset.ticker}?class=${asset.assetClass}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 hover:bg-surface-muted transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-surface-muted font-mono text-xs font-semibold text-on-surface">
                  {asset.ticker.slice(0, 2)}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-mono text-sm font-semibold text-on-surface">{asset.ticker}</span>
                  <span className="truncate text-xs text-on-surface-variant">{asset.name} &middot; {asset.price}</span>
                </div>
                <span className={cn('flex-shrink-0 font-mono text-sm font-medium tabular-nums', isPositive ? 'text-profit' : 'text-loss')}>
                  {asset.changePercent}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/ativos?classe=${activeClass}&sort=${sort}&page=${p}`}
              className={cn('px-3 py-1 rounded text-sm transition-colors', p === page ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface-variant hover:bg-surface-muted')}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
