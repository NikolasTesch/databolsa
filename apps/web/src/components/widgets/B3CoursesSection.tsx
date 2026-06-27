import Link from 'next/link';

interface CourseItem {
  icon: string;
  title: string;
  description: string;
  hours: string;
}

const COURSES: CourseItem[] = [
  {
    icon: 'show_chart',
    title: 'Análise Técnica Essencial',
    description:
      'Aprenda a ler gráficos e identificar tendências do mercado financeiro com analistas certificados.',
    hours: '40h',
  },
  {
    icon: 'domain',
    title: 'Dominando FIIs',
    description:
      'Como analisar fundos imobiliários e montar uma carteira de alto retorno com segurança.',
    hours: '25h',
  },
  {
    icon: 'monitoring',
    title: 'Valuation na Prática',
    description:
      'Modelagem financeira completa para valuation de empresas e tomada de decisão.',
    hours: '60h',
  },
  {
    icon: 'alt_route',
    title: 'Opções e Derivativos',
    description:
      'Estratégias de proteção e alavancagem com opções para investidores avançados.',
    hours: '35h',
  },
];

export default function B3CoursesSection() {
  return (
    <section className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-12">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-on-surface">
            Cursos Especializados
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Aprenda com analistas certificados (CNPI)
          </p>
        </div>
        <Link
          href="/cursos"
          className="text-sm text-primary hover:underline font-medium flex-shrink-0"
        >
          Ver todos
        </Link>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {COURSES.map((course) => (
          <div
            key={course.title}
            className="bg-surface border border-border rounded-lg p-5 flex flex-col"
          >
            {/* Icon */}
            <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px] text-primary">
                {course.icon}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-base font-semibold text-on-surface mt-4">
              {course.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-on-surface-variant mt-1 flex-1">
              {course.description}
            </p>

            {/* Hours + Matricular button */}
            <div className="flex items-center justify-between mt-4">
              <span className="bg-surface-muted rounded px-2 py-0.5 text-xs text-on-surface-variant">
                {course.hours}
              </span>
              <Link
                href={`/cursos/${course.title
                  .toLowerCase()
                  .replace(/\s+/g, '-')}`}
                className="text-sm text-primary hover:underline font-medium"
              >
                Matricular
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
