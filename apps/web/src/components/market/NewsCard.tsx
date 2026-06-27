'use client';

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
      className="group flex flex-col rounded-lg border border-border bg-surface hover:border-primary/30 hover:shadow-sm transition-all duration-200 overflow-hidden"
      aria-label={article.title}
    >
      {/* Category label */}
      {article.source && (
        <div className="px-4 pt-4 pb-0">
          <span className="text-caption text-primary uppercase tracking-wide font-medium">
            {article.source}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <h3 className="text-body-sm font-semibold text-on-surface line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </h3>

        {article.summary && (
          <p className="text-caption text-text-muted line-clamp-3 flex-1">
            {article.summary}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2">
          <time
            dateTime={article.publishedAt}
            className="text-caption text-text-muted flex-shrink-0"
          >
            {formatDate(article.publishedAt)}
          </time>
        </div>
      </div>
    </a>
  );
}
