import type { B3Course } from '@/lib/courses-data';

const UTM = 'utm_source=databolsa&utm_medium=referral&utm_campaign=b3-courses';

function withUtm(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${UTM}`;
}

const LEVEL_COLORS: Record<B3Course['level'], string> = {
  Iniciante: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Intermediário: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Avançado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

interface B3CourseCardProps {
  course: B3Course;
}

export function B3CourseCard({ course }: B3CourseCardProps) {
  return (
    <div className="flex flex-col bg-surface border border-border rounded-lg p-5 hover:border-primary/40 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${LEVEL_COLORS[course.level]}`}>
          {course.level}
        </span>
        <span className="text-xs text-content-muted whitespace-nowrap">{course.duration}</span>
      </div>

      <h3 className="text-sm font-semibold text-content mb-2 leading-snug">{course.title}</h3>

      <p className="text-xs text-content-muted leading-relaxed flex-1 mb-4">
        {course.description}
      </p>

      <div className="flex items-center justify-between mt-auto">
        <span className="text-xs text-content-subtle">{course.category}</span>
        <a
          href={withUtm(course.url)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-white rounded hover:bg-primary-hover transition-colors"
        >
          Acessar na B3
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
