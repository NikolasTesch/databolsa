import Link from 'next/link';
import { fetchDividendsNews } from '@/lib/news/news.service';
import type { NewsArticle } from '@/lib/news/news.service';
import { getDividendsAgenda } from '@/lib/market/dividends-agenda';
import type { AgendaItem } from '@/lib/market/dividends-agenda';

function getTickerInitials(ticker: string): string {
  // Return first 2 characters for the circle
  return ticker.slice(0, 2);
}

function formatTimeAgo(publishedAt: string): string {
  const diff = Date.now() - new Date(publishedAt).getTime();
  const hours = Math.floor(diff / 36e5);
  if (hours < 1) return 'Há menos de 1 hora';
  if (hours < 24) return `Há ${hours} hora${hours > 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Há ${days} dia${days > 1 ? 's' : ''}`;
  return new Date(publishedAt).toLocaleDateString('pt-BR');
}

export default async function DividendsSection() {
  const { articles } = await fetchDividendsNews();
  const newsItems = articles.slice(0, 4);
  const agenda = await getDividendsAgenda();
  const rows = agenda.slice(0, 5);

  return (
    <section
      id="dividendos"
      className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-10"
      aria-label="Dividendos e proventos"
    >
      {/* ── Agenda de Dividendos ── */}
      <div className="mb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-on-surface">
            Agenda de Dividendos
          </h2>
          <Link
            href="/dividendos"
            className="text-sm text-primary hover:underline"
          >
            Ver agenda completa
          </Link>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-on-surface-variant uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-medium">Ativo</th>
                <th className="px-4 py-3 text-left font-medium">Tipo</th>
                <th className="px-4 py-3 text-left font-medium">Data Com</th>
                <th className="px-4 py-3 text-left font-medium">Pagamento</th>
                <th className="px-4 py-3 text-right font-medium">Valor (R$)</th>
                <th className="px-4 py-3 text-right font-medium">Yield</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? rows.map((row) => (
                <tr
                  key={row.ticker}
                  className="border-b border-border/50 last:border-b-0 hover:bg-surface-muted/50 transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary rounded"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/ativos/${row.ticker}?class=STOCK_BR`}
                      className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                    >
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-surface-muted font-mono text-xs font-semibold text-on-surface">
                        {getTickerInitials(row.ticker)}
                      </div>
                      <span className="font-mono text-sm font-semibold text-on-surface hover:text-primary transition-colors">
                        {row.ticker}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        row.type === 'JCP'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-profit/10 text-profit'
                      }`}
                    >
                      {row.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-on-surface">
                    {row.dateCom}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-on-surface">
                    {row.payment}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-on-surface tabular-nums">
                    {row.value}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-profit tabular-nums">
                    {row.yieldPct}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-on-surface-variant">
                    Nenhum dividendo disponível no momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Últimas sobre Proventos ── */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-on-surface">
            Últimas sobre Proventos
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {newsItems.length > 0 ? newsItems.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-lg bg-surface-muted/50 p-4 hover:bg-surface-muted transition-colors"
            >
              <span className="mb-1.5 block text-xs font-medium text-primary uppercase tracking-wide">
                {item.source || 'Proventos'}
              </span>
              <h3 className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors leading-snug">
                {item.title}
              </h3>
              <span className="mt-2 block text-xs text-on-surface-variant">
                {formatTimeAgo(item.publishedAt)}
              </span>
            </a>
          )) : (
            <p className="text-sm text-on-surface-variant col-span-2">
              Nenhuma notícia sobre proventos disponível no momento.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
