'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { AgendaItem } from '@/lib/market/dividends-agenda';
import type { NewsArticle } from '@/lib/news/news.service';

type TypeFilter = 'all' | 'Dividendo' | 'JCP';

const ITEMS_PER_PAGE = 20;

/* ── Helpers ── */

function getTickerInitials(ticker: string): string {
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

/* ── Props ── */

interface DividendosClientProps {
  agenda: AgendaItem[];
  news: NewsArticle[];
}

/* ── Component ── */

export function DividendosClient({ agenda, news }: DividendosClientProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  /* ── Derived stats ── */

  const totalTickers = useMemo(
    () => new Set(agenda.map((item) => item.ticker)).size,
    [agenda],
  );

  const typeCounts = useMemo(() => {
    const counts = { Dividendo: 0, JCP: 0, Outros: 0 };
    for (const item of agenda) {
      if (item.type === 'Dividendo') counts.Dividendo++;
      else if (item.type === 'JCP') counts.JCP++;
      else counts.Outros++;
    }
    return counts;
  }, [agenda]);

  /* ── Filter + paginate ── */

  const filtered = useMemo(() => {
    return agenda.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (search.trim()) {
        return item.ticker.toLowerCase().includes(search.toLowerCase());
      }
      return true;
    });
  }, [agenda, typeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  /* ── Filter definitions ── */

  const FILTERS: { key: TypeFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'Dividendo', label: 'Dividendos' },
    { key: 'JCP', label: 'JCP' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ════════════════════ Hero Section ════════════════════ */}
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
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-4 py-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-secondary" />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-secondary">
                Renda Passiva
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-on-surface">
              Dividendos e{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                Proventos
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-on-surface-variant leading-relaxed max-w-xl">
              Acompanhe a agenda completa de dividendos, JCP e proventos de ações e
              FIIs listados na B3. Filtre por ativo e confira datas, valores e
              rendimentos.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-secondary">
                  payments
                </span>
                <span className="font-mono">{totalTickers} ativos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-secondary">
                  monetization_on
                </span>
                <span className="font-mono">{typeCounts.Dividendo} dividendos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-secondary">
                  account_balance
                </span>
                <span className="font-mono">{typeCounts.JCP} JCP</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-secondary">
                  table_rows
                </span>
                <span className="font-mono">{agenda.length} registros</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ Filter Tabs + Search ════════════════════ */}
      <section className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Type filters */}
          <div className="flex gap-1 bg-surface-container-low p-1 rounded-lg border border-border">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  setTypeFilter(f.key);
                  setPage(1);
                }}
                className={`px-5 py-2 text-sm font-medium rounded-md transition-colors ${
                  typeFilter === f.key
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-lg pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por ticker..."
              className="w-full bg-surface-container-low border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </div>
      </section>

      {/* ════════════════════ Agenda Table ════════════════════ */}
      <section className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop pb-10">
        {filtered.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <span className="material-symbols-outlined text-[48px] mb-4">
              search_off
            </span>
            <p className="text-sm font-medium">Nenhum registro encontrado</p>
            <p className="text-xs mt-1">Tente ajustar o filtro ou a busca.</p>
          </div>
        ) : (
          <>
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
                  {paginated.map((row, i) => (
                    <tr
                      key={`${row.ticker}-${i}`}
                      className="border-b border-border/50 last:border-b-0 hover:bg-surface-muted/50 transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary rounded"
                    >
                      {/* Ativo */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/ativos/${row.ticker}?class=${row.assetClass}`}
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

                      {/* Tipo */}
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

                      {/* Data Com */}
                      <td className="px-4 py-3 font-mono text-sm text-on-surface">
                        {row.dateCom}
                      </td>

                      {/* Pagamento */}
                      <td className="px-4 py-3 font-mono text-sm text-on-surface">
                        {row.payment}
                      </td>

                      {/* Valor (R$) */}
                      <td className="px-4 py-3 text-right font-mono text-sm text-on-surface tabular-nums">
                        {row.value}
                      </td>

                      {/* Yield */}
                      <td className="px-4 py-3 text-right font-mono text-sm text-profit tabular-nums">
                        {row.yieldPct}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            <div className="flex items-center justify-between mt-4 text-sm text-on-surface-variant">
              <span className="font-mono">
                Mostrando {(page - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(page * ITEMS_PER_PAGE, filtered.length)} de{' '}
                {filtered.length}
              </span>

              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-md border border-border bg-surface text-on-surface hover:bg-surface-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-lg">
                    chevron_left
                  </span>
                </button>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, page - 2);
                  const p = start + i;
                  if (p > totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        page === p
                          ? 'bg-primary text-on-primary'
                          : 'border border-border bg-surface text-on-surface hover:bg-surface-muted'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-md border border-border bg-surface text-on-surface hover:bg-surface-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-lg">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ════════════════════ Notícias sobre Proventos ════════════════════ */}
      {news.length > 0 && (
        <section className="bg-surface-container-low py-20 border-t border-border/40">
          <div className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-on-surface mb-3">
                Últimas sobre Proventos
              </h2>
              <p className="text-on-surface-variant max-w-2xl">
                Notícias e análises sobre dividendos, JCP e distribuição de proventos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {news.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-lg bg-surface p-4 border border-border hover:border-primary/30 transition-all"
                >
                  <span className="mb-1.5 block text-xs font-medium text-primary uppercase tracking-wide">
                    {item.source || 'Proventos'}
                  </span>
                  <h3 className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors leading-snug line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-on-surface-variant line-clamp-2">
                    {item.summary}
                  </p>
                  <span className="mt-2 block text-xs text-on-surface-variant">
                    {formatTimeAgo(item.publishedAt)}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════ Seção Educacional ════════════════════ */}
      <section className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-20">
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-on-surface mb-3">
            Como funcionam os proventos
          </h2>
          <p className="text-on-surface-variant max-w-2xl">
            Entenda as principais formas de distribuição de lucros e remuneração aos
            acionistas e cotistas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Card: Dividendos ── */}
          <div className="p-6 rounded-2xl bg-surface border border-border group hover:border-profit/40 transition-all">
            <div className="w-12 h-12 flex-shrink-0 rounded-xl border border-profit/20 flex items-center justify-center bg-profit/5 group-hover:scale-105 transition-transform duration-500 mb-4">
              <span className="material-symbols-outlined text-profit text-2xl">
                monetization_on
              </span>
            </div>
            <h3 className="text-xl font-semibold text-on-surface mb-3">
              Dividendos (DIV)
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
              Os <strong className="text-on-surface">dividendos</strong> são a
              distribuição periódica de parte do lucro líquido de uma empresa aos seus
              acionistas. O pagamento é feito em dinheiro, creditado diretamente na
              conta do investidor.
            </p>
            <ul className="space-y-2 text-sm text-on-surface-variant">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-profit text-[18px] mt-0.5">
                  check_circle
                </span>
                <span>
                  <strong className="text-on-surface">Isentos de IR</strong> para
                  pessoas físicas
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-profit text-[18px] mt-0.5">
                  check_circle
                </span>
                <span>
                  Pagamento em <strong className="text-on-surface">dinheiro</strong> na
                  conta
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-profit text-[18px] mt-0.5">
                  check_circle
                </span>
                <span>
                  Frequência:{' '}
                  <strong className="text-on-surface">
                    mensal, trimestral ou semestral
                  </strong>
                </span>
              </li>
            </ul>
          </div>

          {/* ── Card: JCP ── */}
          <div className="p-6 rounded-2xl bg-surface border border-border group hover:border-primary/40 transition-all">
            <div className="w-12 h-12 flex-shrink-0 rounded-xl border border-primary/20 flex items-center justify-center bg-primary/5 group-hover:scale-105 transition-transform duration-500 mb-4">
              <span className="material-symbols-outlined text-primary text-2xl">
                account_balance
              </span>
            </div>
            <h3 className="text-xl font-semibold text-on-surface mb-3">
              Juros sobre Capital Próprio (JCP)
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
              Os <strong className="text-on-surface">JCP</strong> são uma forma de
              remuneração aos acionistas calculada sobre o patrimônio líquido da
              empresa. Funciona como uma &ldquo;juros&rdquo; sobre o capital investido.
            </p>
            <ul className="space-y-2 text-sm text-on-surface-variant">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">
                  info
                </span>
                <span>
                  <strong className="text-on-surface">Tributação na fonte:</strong> 15%
                  de IR retido
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">
                  info
                </span>
                <span>
                  Vantagem <strong className="text-on-surface">fiscal</strong> para a
                  empresa (dedutível)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">
                  info
                </span>
                <span>
                  Pagamento em <strong className="text-on-surface">dinheiro</strong>,
                  igual ao dividendo
                </span>
              </li>
            </ul>
          </div>

          {/* ── Card: Bonificações ── */}
          <div className="p-6 rounded-2xl bg-surface border border-border group hover:border-tertiary/40 transition-all">
            <div className="w-12 h-12 flex-shrink-0 rounded-xl border border-tertiary/20 flex items-center justify-center bg-tertiary/5 group-hover:scale-105 transition-transform duration-500 mb-4">
              <span className="material-symbols-outlined text-tertiary text-2xl">
                    redeem
              </span>
            </div>
            <h3 className="text-xl font-semibold text-on-surface mb-3">
              Bonificações
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
              As <strong className="text-on-surface">bonificações</strong> ocorrem
              quando uma empresa distribui novas ações gratuitamente aos acionistas
              existentes, sem desembolso por parte do investidor.
            </p>
            <ul className="space-y-2 text-sm text-on-surface-variant">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-tertiary text-[18px] mt-0.5">
                  check_circle
                </span>
                <span>
                  <strong className="text-on-surface">Novas ações</strong> distribuídas
                  gratuitamente
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-tertiary text-[18px] mt-0.5">
                  check_circle
                </span>
                <span>
                  <strong className="text-on-surface">Sem desembolso</strong> para o
                  acionista
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-tertiary text-[18px] mt-0.5">
                  check_circle
                </span>
                <span>
                  Aumenta a <strong className="text-on-surface">quantidade de
                  ações</strong> em carteira
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Disclaimer ── */}
        <div className="mt-8 glass-panel rounded-2xl p-8 text-center">
          <p className="text-on-surface-variant text-sm max-w-lg mx-auto">
            Os valores e datas exibidos nesta página são baseados em dados públicos da
            B3 e podem sofrer alterações. Consulte sempre o site da B3 ou seu corretor
            para informações oficiais.
          </p>
        </div>
      </section>
    </div>
  );
}
