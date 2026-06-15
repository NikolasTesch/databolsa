import type { NewsArticle } from '@/lib/news/news.service';

const PLACEHOLDER_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%239ca3af'%3ESem imagem%3C/text%3E%3C/svg%3E";

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

interface NewsCardProps {
  article: NewsArticle;
}

export function NewsCard({ article }: NewsCardProps) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-xl border border-border bg-surface hover:border-primary hover:shadow-md transition-all duration-200 overflow-hidden"
      aria-label={article.title}
    >
      {/* Image */}
      <div className="relative h-40 w-full overflow-hidden bg-surface-muted flex-shrink-0">
        <img
          src={article.imageUrl ?? PLACEHOLDER_SVG}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const img = e.currentTarget;
            img.src = PLACEHOLDER_SVG;
          }}
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <h3 className="text-sm font-semibold text-content line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </h3>

        {article.summary && (
          <p className="text-xs text-content-muted line-clamp-3 flex-1">
            {article.summary}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
          <span className="text-xs font-medium text-content-muted truncate">
            {article.source}
          </span>
          <time
            dateTime={article.publishedAt}
            className="text-xs text-content-subtle flex-shrink-0 ml-2"
          >
            {formatDate(article.publishedAt)}
          </time>
        </div>
      </div>
    </a>
  );
}
