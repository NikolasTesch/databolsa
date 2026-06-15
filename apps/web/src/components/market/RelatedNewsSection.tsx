import { fetchGeneralNews, fetchTickerNews } from '@/lib/news/news.service';
import { NewsCard } from './NewsCard';

interface RelatedNewsSectionProps {
  /** Optional ticker to filter news. If omitted, shows general market news. */
  ticker?: string;
  limit?: number;
  title?: string;
}

/**
 * Server Component — fetches news directly from the service (no internal HTTP hop).
 * Wrap with <Suspense> at the call site.
 */
export async function RelatedNewsSection({
  ticker,
  limit = 6,
  title,
}: RelatedNewsSectionProps) {
  const { articles } =
    ticker
      ? await fetchTickerNews(ticker)
      : await fetchGeneralNews();

  const displayArticles = articles.slice(0, limit);
  const sectionTitle = title ?? (ticker ? `Notícias sobre ${ticker}` : 'Notícias do Mercado');

  if (displayArticles.length === 0) return null;

  return (
    <section
      className="mx-auto max-w-7xl px-4 py-12"
      aria-label={sectionTitle}
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-content">{sectionTitle}</h2>
        <p className="text-sm text-content-muted mt-1">
          {ticker
            ? `Últimas matérias relacionadas a ${ticker}`
            : 'Principais notícias do mercado financeiro'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayArticles.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
