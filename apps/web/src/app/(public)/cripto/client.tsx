'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type {
  CryptoOverviewResult,
  CryptoOverviewItem,
} from '@/lib/market/crypto-overview';
import type { NewsArticle } from '@/lib/news/news.service';
import type { B3Course } from '@/lib/courses-data';

/* ─── Props ─── */

interface CriptoClientProps {
  overview: CryptoOverviewResult;
  news: { articles: NewsArticle[]; cached: boolean };
  cryptoCourses: B3Course[];
}

/* ─── Helpers ─── */

function ChangeIndicator({ percent }: { percent: string }) {
  const isNeutral = percent === '0.00%' || percent === '0,00%';
  const up = percent.startsWith('+');
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-mono font-medium ${
        isNeutral
          ? 'text-neutralChange'
          : up
            ? 'text-profit'
            : 'text-loss'
      }`}
    >
      <span className="material-symbols-outlined text-sm">
        {isNeutral ? 'remove' : up ? 'trending_up' : 'trending_down'}
      </span>
      {percent}
    </span>
  );
}

function getEmoji(symbol: string): string {
  const map: Record<string, string> = {
    BTC: '₿',
    ETH: 'Ξ',
    USDT: '₮',
    SOL: 'S',
    BNB: '◆',
  };
  return map[symbol] ?? '◆';
}

function formatArticleDate(publishedAt: string): string {
  const d = new Date(publishedAt);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

/* ─── Sub-components ─── */

function CryptoCard({ asset }: { asset: CryptoOverviewItem }) {
  return (
    <Link
      href={`/ativos/${asset.symbol}?class=CRYPTO`}
      className="glass-panel rounded-lg p-4 block cursor-pointer focus-visible:ring-2 focus-visible:ring-primary transition-shadow hover:shadow-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-mono">{getEmoji(asset.symbol)}</span>
          <div>
            <span className="text-sm font-semibold text-on-surface">
              {asset.symbol}
            </span>
            <span className="text-xs text-on-surface-variant ml-1">
              {asset.name}
            </span>
          </div>
        </div>
        <ChangeIndicator percent={asset.changePercent} />
      </div>

      {/* Price */}
      <p className="text-base font-mono font-semibold text-on-surface tabular-nums">
        {asset.price}
      </p>

      {/* Volume */}
      {asset.volume24h !== '—' && (
        <p className="text-xs text-on-surface-variant mt-1">
          Vol 24h: {asset.volume24h}
        </p>
      )}

      {/* Stale warning */}
      {asset.stale && (
        <p className="text-xs text-tertiary mt-1">
          Dados desatualizados
        </p>
      )}
    </Link>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass-panel rounded-lg p-4 space-y-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-surface-container-low" />
              <div>
                <div className="h-3 w-16 bg-surface-container-low rounded" />
                <div className="h-2 w-20 bg-surface-container-low rounded mt-1" />
              </div>
            </div>
            <div className="h-4 w-14 bg-surface-container-low rounded" />
          </div>
          <div className="h-5 w-24 bg-surface-container-low rounded" />
          <div className="h-3 w-16 bg-surface-container-low rounded" />
        </div>
      ))}
    </div>
  );
}

/* ─── Main Component ─── */

export default function CriptoClient({
  overview,
  news,
  cryptoCourses,
}: CriptoClientProps) {
  const [search, setSearch] = useState('');

  const { assets, trending } = overview;
  const newsItems = news.articles.slice(0, 6);

  const filtered = useMemo(() => {
    if (!search.trim()) return assets;
    const q = search.toLowerCase();
    return assets.filter(
      (a) =>
        a.symbol.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q),
    );
  }, [assets, search]);

  /* Hero stats */
  const topMover = useMemo(() => {
    if (assets.length === 0) return null;
    return [...assets].sort(
      (a, b) =>
        Math.abs(parseFloat(b.changePercent)) -
        Math.abs(parseFloat(a.changePercent)),
    )[0];
  }, [assets]);

  return (
    <div className="min-h-screen bg-background">
      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden py-20 border-b border-border/40">
        {/* Grid mesh */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(var(--color-primary) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Gradient orbs */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div
            className="absolute -left-48 -top-48 h-[540px] w-[540px] rounded-full blur-3xl opacity-[0.08]"
            style={{ backgroundColor: 'var(--color-primary)' }}
          />
          <div
            className="absolute -right-28 top-1/4 h-[380px] w-[380px] rounded-full blur-3xl opacity-[0.06]"
            style={{ backgroundColor: 'var(--color-secondary)' }}
          />
        </div>

        <div className="relative mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
          <div className="max-w-2xl space-y-6">
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-4 py-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-secondary" />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-secondary">
                Mercado em Tempo Real
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-on-surface">
              Mercado{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                Cripto
              </span>
            </h1>

            <p className="text-lg text-on-surface-variant leading-relaxed max-w-xl">
              Acompanhe os preços, variações e volume das principais
              criptomoedas do mercado.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-secondary">
                  currency_bitcoin
                </span>
                <span className="font-mono">{assets.length} ativos</span>
              </div>

              {topMover && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-secondary">
                    swap_vert
                  </span>
                  <span className="font-mono">
                    Maior variação: {topMover.symbol}{' '}
                    <span
                      className={
                        topMover.changePercent.startsWith('+')
                          ? 'text-profit'
                          : 'text-loss'
                      }
                    >
                      {topMover.changePercent}
                    </span>
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-secondary">
                  new_releases
                </span>
                <span className="font-mono">{news.articles.length} notícias</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SEARCH ═══ */}
      <section className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-8">
        <div className="relative w-full max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-lg pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar criptomoeda por nome ou símbolo..."
            className="w-full bg-surface-container-low border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
      </section>

      {/* ═══ MAIN CONTENT: GRID + SIDEBAR ═══ */}
      <section className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop pb-12">
        {assets.length === 0 ? (
          /* Empty state — no data at all */
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <span className="material-symbols-outlined text-[48px] mb-4">
              error_outline
            </span>
            <p className="text-sm font-medium">
              Dados de cripto indisponíveis no momento.
            </p>
            <p className="text-xs mt-1">
              Tente novamente mais tarde.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* ── Crypto Cards Grid (3/4) ── */}
            <div className="lg:col-span-3">
              {filtered.length === 0 ? (
                /* Empty state — search no results */
                <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[48px] mb-4">
                    search_off
                  </span>
                  <p className="text-sm font-medium">
                    Nenhuma criptomoeda encontrada
                  </p>
                  <p className="text-xs mt-1">
                    Tente ajustar o termo da busca.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filtered.map((asset) => (
                    <CryptoCard key={asset.symbol} asset={asset} />
                  ))}
                </div>
              )}
            </div>

            {/* ── Sidebar (1/4) ── */}
            <aside className="space-y-6">
              {/* Trending */}
              <div className="rounded-lg border border-border bg-surface p-4">
                <h3 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-primary">
                    trending_up
                  </span>
                  Em alta
                </h3>
                <div className="space-y-3">
                  {trending.length > 0 ? (
                    trending.map((item) => (
                      <div
                        key={item.symbol}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm font-semibold text-on-surface">
                          {item.symbol}
                        </span>
                        <ChangeIndicator percent={item.changePercent} />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-on-surface-variant">
                      Nenhum dado disponível.
                    </p>
                  )}
                </div>
              </div>

              {/* Latest News (sidebar teaser) */}
              <div className="rounded-lg border border-border bg-surface p-4">
                <h3 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-primary">
                    feed
                  </span>
                  Últimas notícias
                </h3>
                <div className="space-y-3">
                  {newsItems.length > 0 ? (
                    newsItems.slice(0, 3).map((item) => (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block hover:bg-surface-container-low rounded-md -mx-2 px-2 py-1.5 transition-colors"
                      >
                        <time className="text-[10px] text-on-surface-variant block mb-0.5">
                          {formatArticleDate(item.publishedAt)}
                        </time>
                        <p className="text-xs text-on-surface leading-snug line-clamp-2">
                          {item.title}
                        </p>
                      </a>
                    ))
                  ) : (
                    <p className="text-sm text-on-surface-variant">
                      Nenhuma notícia disponível.
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>

      {/* ═══ NEWS SECTION ═══ */}
      <section className="bg-surface-container-low py-16 border-t border-border/40">
        <div className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-on-surface">
                Notícias Cripto
              </h2>
              <p className="text-sm text-on-surface-variant mt-1">
                As principais notícias do mundo das criptomoedas
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {newsItems.length > 0 ? (
              newsItems.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-lg border border-border bg-surface p-5 hover:border-primary/30 transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <time className="text-xs text-on-surface-variant">
                      {formatArticleDate(item.publishedAt)}
                    </time>
                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {item.source || 'Cripto'}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface font-medium leading-snug group-hover:text-primary transition-colors line-clamp-3">
                    {item.title}
                  </p>
                  {item.summary && (
                    <p className="text-xs text-on-surface-variant mt-2 line-clamp-2 leading-relaxed">
                      {item.summary}
                    </p>
                  )}
                </a>
              ))
            ) : (
              <p className="col-span-3 text-sm text-on-surface-variant text-center py-12">
                Nenhuma notícia disponível no momento.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ═══ APRENDA SOBRE CRIPTO ═══ */}
      {cryptoCourses.length > 0 && (
        <section className="py-16 border-t border-border/40">
          <div className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
            <div className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-on-surface">
                Aprenda sobre{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                  Cripto
                </span>
              </h2>
              <p className="text-on-surface-variant mt-2 max-w-2xl">
                Cursos oficiais e gratuitos da B3 Educação para entender o
                universo dos criptoativos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cryptoCourses.map((course) => (
                <a
                  key={course.id}
                  href={course.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-surface border border-border rounded-xl overflow-hidden flex flex-col hover:border-secondary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                >
                  {/* Accent header */}
                  <div className="h-2 w-full bg-primary/10" />

                  <div className="p-6 flex flex-col flex-1 gap-4">
                    {/* Icon + Level */}
                    <div className="flex items-start justify-between">
                      <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-[28px] text-primary">
                          currency_bitcoin
                        </span>
                      </div>
                      <span className="inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide border border-primary/20 bg-primary/10 text-primary">
                        {course.level}
                      </span>
                    </div>

                    {/* Category */}
                    <span className="text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">
                      {course.category}
                    </span>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-on-surface leading-snug">
                      {course.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-on-surface-variant leading-relaxed flex-1 line-clamp-3">
                      {course.description}
                    </p>

                    {/* Duration + CTA */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant font-mono">
                        <span className="material-symbols-outlined text-[18px]">
                          schedule
                        </span>
                        {course.duration}
                      </span>
                      <span className="text-sm font-semibold text-primary group-hover:text-secondary transition-colors inline-flex items-center gap-1">
                        Acessar curso
                        <span className="material-symbols-outlined text-[18px]">
                          arrow_forward
                        </span>
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center mt-10">
              <a
                href="https://edu.b3.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary text-on-primary font-semibold px-8 py-3 rounded-xl hover:opacity-90 transition-all"
              >
                VER TODOS OS CURSOS B3
                <span className="material-symbols-outlined text-lg">
                  open_in_new
                </span>
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
