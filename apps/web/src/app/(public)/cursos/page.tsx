'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { B3_COURSES, type B3Course } from '@/lib/courses-data';

type LevelFilter = 'all' | 'Iniciante' | 'Intermediário' | 'Avançado';

const LEVEL_STYLES: Record<B3Course['level'], { bg: string; text: string; border: string }> = {
  Iniciante: { bg: 'bg-secondary/10', text: 'text-secondary', border: 'border-secondary/20' },
  Intermediário: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
  Avançado: { bg: 'bg-tertiary/10', text: 'text-tertiary', border: 'border-tertiary/20' },
};

const CATEGORY_ICONS: Record<string, string> = {
  'Renda Variável': 'trending_up',
  'Fundos': 'domain',
  'Criptomoedas': 'currency_bitcoin',
  'Gestão de Investimentos': 'account_balance',
  'Derivativos': 'alt_route',
};

function getLevelStyle(level: B3Course['level']) {
  return LEVEL_STYLES[level] ?? LEVEL_STYLES.Iniciante;
}

function getCategoryIcon(category: string) {
  return CATEGORY_ICONS[category] ?? 'school';
}

export default function CursosPage() {
  const [filter, setFilter] = useState<LevelFilter>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return B3_COURSES.filter((c) => {
      if (filter !== 'all' && c.level !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [filter, search]);

  const FILTERS: { key: LevelFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'Iniciante', label: 'Iniciante' },
    { key: 'Intermediário', label: 'Intermediário' },
    { key: 'Avançado', label: 'Avançado' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden py-20 border-b border-border/40">
        {/* Grid mesh background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(var(--color-primary) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        {/* Gradient orbs */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -left-48 -top-48 h-[540px] w-[540px] rounded-full blur-3xl opacity-[0.08]"
            style={{ backgroundColor: 'var(--color-primary)' }} />
          <div className="absolute -right-28 top-1/4 h-[380px] w-[380px] rounded-full blur-3xl opacity-[0.06]"
            style={{ backgroundColor: 'var(--color-secondary)' }} />
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
                Programa Educacional
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-on-surface">
              Cursos{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                B3 Educação
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-on-surface-variant leading-relaxed max-w-xl">
              Cursos oficiais da B3 para investidores de todos os níveis. Aprenda
              desde os fundamentos da bolsa até estratégias avançadas com derivativos.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-secondary">school</span>
                <span className="font-mono">{B3_COURSES.length} cursos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-secondary">signal_cellular_alt</span>
                <span className="font-mono">3 níveis</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-secondary">category</span>
                <span className="font-mono">{new Set(B3_COURSES.map((c) => c.category)).size} categorias</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Filter Tabs + Search ─── */}
      <section className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Level filters */}
          <div className="flex gap-1 bg-surface-container-low p-1 rounded-lg border border-border">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-5 py-2 text-sm font-medium rounded-md transition-colors ${
                  filter === f.key
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar curso..."
              className="w-full bg-surface-container-low border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </div>
      </section>

      {/* ─── Course Grid ─── */}
      <section className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop pb-20">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <span className="material-symbols-outlined text-[48px] mb-4">search_off</span>
            <p className="text-sm font-medium">Nenhum curso encontrado</p>
            <p className="text-xs mt-1">Tente ajustar o filtro ou a busca.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course) => {
              const levelStyle = getLevelStyle(course.level);
              return (
                <a
                  key={course.id}
                  href={course.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-surface border border-border rounded-xl overflow-hidden flex flex-col hover:border-secondary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                >
                  {/* Accent header */}
                  <div className={`h-2 w-full ${levelStyle.bg}`} />

                  <div className="p-6 flex flex-col flex-1 gap-4">
                    {/* Icon + Level */}
                    <div className="flex items-start justify-between">
                      <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-[28px] text-primary">
                          {getCategoryIcon(course.category)}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}
                      >
                        {course.level}
                      </span>
                    </div>

                    {/* Category label */}
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
                        <span className="material-symbols-outlined text-[18px]">schedule</span>
                        {course.duration}
                      </span>
                      <span className="text-sm font-semibold text-primary group-hover:text-secondary transition-colors inline-flex items-center gap-1">
                Acessar curso
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── Learning Paths ─── */}
      <section className="bg-surface-container-low py-20 border-t border-border/40">
        <div className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-on-surface mb-3">
              Trilhas de Aprendizado
            </h2>
            <p className="text-on-surface-variant max-w-2xl">
              Caminhos estruturados para levar você do zero ao domínio completo em áreas
              específicas do mercado financeiro.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Path 1: Renda Variável */}
            <div className="p-8 rounded-2xl bg-surface border border-border flex flex-col md:flex-row gap-6 items-start group hover:border-secondary/40 transition-all">
              <div className="w-24 h-24 flex-shrink-0 rounded-2xl border border-secondary/20 flex items-center justify-center bg-secondary/5 group-hover:scale-105 transition-transform duration-500">
                <span className="material-symbols-outlined text-secondary text-4xl">trending_up</span>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-secondary">Mestre em Renda Variável</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Domine ações, FIIs, BDRs e ETFs. Do básico ao avançado na bolsa brasileira.
                </p>
                <div className="flex gap-2">
                  <span className="text-[10px] font-mono bg-surface-container-high px-3 py-1 rounded text-on-surface">
                    {B3_COURSES.filter((c) => c.category === 'Renda Variável').length} CURSOS
                  </span>
                </div>
                <Link
                  href="/cursos?filter=all"
                  className="text-xs font-bold text-secondary inline-flex items-center gap-1 hover:gap-2 transition-all pt-1"
                  onClick={() => { setFilter('all'); setSearch('Renda Variável'); }}
                >
                  EXPLORAR TRILHA
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* Path 2: Iniciante */}
            <div className="p-8 rounded-2xl bg-surface border border-border flex flex-col md:flex-row gap-6 items-start group hover:border-primary/40 transition-all">
              <div className="w-24 h-24 flex-shrink-0 rounded-2xl border border-primary/20 flex items-center justify-center bg-primary/5 group-hover:scale-105 transition-transform duration-500">
                <span className="material-symbols-outlined text-primary text-4xl">school</span>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-primary">Do Zero ao Investidor</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Comece sua jornada nos investimentos com cursos introdutórios da B3.
                </p>
                <div className="flex gap-2">
                  <span className="text-[10px] font-mono bg-surface-container-high px-3 py-1 rounded text-on-surface">
                    {B3_COURSES.filter((c) => c.level === 'Iniciante').length} CURSOS
                  </span>
                  <span className="text-[10px] font-mono bg-surface-container-high px-3 py-1 rounded text-on-surface">
                    GRÁTIS
                  </span>
                </div>
                <button
                  onClick={() => setFilter('Iniciante')}
                  className="text-xs font-bold text-primary inline-flex items-center gap-1 hover:gap-2 transition-all pt-1"
                >
                  EXPLORAR TRILHA
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA Final ─── */}
      <section className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-20 text-center">
        <div className="glass-panel rounded-2xl p-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-on-surface mb-3">
            Pronto para começar?
          </h2>
          <p className="text-on-surface-variant mb-6 max-w-md mx-auto">
            Todos os cursos da B3 Educação são gratuitos e com certificado ao final.
          </p>
          <a
            href="https://edu.b3.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-on-primary font-semibold px-8 py-3 rounded-xl hover:opacity-90 transition-all"
          >
            ACESSAR B3 EDUCAÇÃO
            <span className="material-symbols-outlined text-lg">open_in_new</span>
          </a>
        </div>
      </section>
    </div>
  );
}
