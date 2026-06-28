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
      className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-12"
      aria-label={sectionTitle}
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-headline-md font-semibold text-on-surface">{sectionTitle}</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">
            {ticker
              ? `Últimas matérias relacionadas a ${ticker}`
              : 'Principais notícias do mercado financeiro'}
          </p>
        </div>
      </div>

      {displayArticles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayArticles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </section>
  );
}
