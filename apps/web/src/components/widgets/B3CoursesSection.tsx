import Link from 'next/link';
import { B3_COURSES, type B3Course } from '@/lib/courses-data';

const LEVEL_STYLES: Record<B3Course['level'], { bg: string; text: string; border: string }> = {
  Iniciante: {
    bg: 'bg-secondary/10',
    text: 'text-secondary',
    border: 'border-secondary/20',
  },
  Intermediário: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
  },
  Avançado: {
    bg: 'bg-tertiary/10',
    text: 'text-tertiary',
    border: 'border-tertiary/20',
  },
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

export default function B3CoursesSection() {
  const displayCourses = B3_COURSES.slice(0, 4);

  return (
    <section
      id="cursos"
      className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-12"
    >
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-on-surface">
            Cursos B3 Educação
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Cursos oficiais da B3 para todos os níveis
          </p>
        </div>
        <Link
          href="/cursos"
          className="text-sm text-primary hover:underline font-medium flex-shrink-0"
        >
          Ver todos
        </Link>
      </div>

      {/* Cards grid — Stitch glass-card pattern */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayCourses.map((course) => {
          const levelStyle = getLevelStyle(course.level);
          return (
            <a
              key={course.id}
              href={course.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-surface border border-border rounded-xl overflow-hidden flex flex-col hover:border-secondary/30 transition-all duration-300"
            >
              {/* Top accent bar */}
              <div className={`h-1.5 w-full ${levelStyle.bg}`} />

              <div className="p-5 flex flex-col flex-1 gap-4">
                {/* Icon + Level badge */}
                <div className="flex items-start justify-between">
                  <div className="bg-primary/10 w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[26px] text-primary">
                      {CATEGORY_ICONS[course.category] ?? 'school'}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border} border`}
                  >
                    {course.level}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-on-surface leading-snug">
                  {course.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-on-surface-variant leading-relaxed flex-1 line-clamp-3">
                  {course.description}
                </p>

                {/* Footer: duration + CTA */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant font-mono">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    {course.duration}
                  </span>
                  <span className="text-xs font-semibold text-primary group-hover:text-secondary transition-colors flex items-center gap-1">
                    Acessar
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
