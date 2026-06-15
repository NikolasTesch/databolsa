import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { B3CoursesSection } from '@/components/market/B3CoursesSection';
import { B3_COURSES } from '@/lib/courses-data';

describe('B3CoursesSection', () => {
  it('TC-01: renders all configured courses (at least 6)', () => {
    render(<B3CoursesSection />);
    expect(B3_COURSES.length).toBeGreaterThanOrEqual(6);
    for (const course of B3_COURSES) {
      expect(screen.getByText(course.title)).toBeDefined();
    }
  });

  it('has section id=cursos for anchor navigation', () => {
    const { container } = render(<B3CoursesSection />);
    const section = container.querySelector('#cursos');
    expect(section).not.toBeNull();
  });

  it('has at least 2 Iniciante and 2 Intermediario courses in data', () => {
    const iniciante = B3_COURSES.filter((c) => c.level === 'Iniciante');
    const intermediario = B3_COURSES.filter((c) => c.level === 'Intermediário');
    expect(iniciante.length).toBeGreaterThanOrEqual(2);
    expect(intermediario.length).toBeGreaterThanOrEqual(2);
  });
});
