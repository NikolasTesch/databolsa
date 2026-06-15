import { B3_COURSES } from '@/lib/courses-data';
import { B3CourseCard } from './B3CourseCard';

export function B3CoursesSection() {
  return (
    <section
      id="cursos"
      className="mx-auto max-w-7xl px-4 py-12"
      aria-label="Cursos gratuitos da B3"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-content">Cursos Gratuitos da B3</h2>
        <p className="text-sm text-content-muted mt-1">
          Aprenda a investir com cursos oficiais e gratuitos da B3 Educação
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {B3_COURSES.map((course) => (
          <B3CourseCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
}
