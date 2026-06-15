import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { B3CourseCard } from '@/components/market/B3CourseCard';
import type { B3Course } from '@/lib/courses-data';

const mockCourse: B3Course = {
  id: 'test-course',
  title: 'Como começar a investir',
  description: 'Curso introdutório de investimentos.',
  duration: '2h',
  level: 'Iniciante',
  category: 'Renda Variável',
  url: 'https://edu.b3.com.br/cursos/test',
};

describe('B3CourseCard', () => {
  it('TC-01: renders course title, level and duration', () => {
    render(<B3CourseCard course={mockCourse} />);
    expect(screen.getByText('Como começar a investir')).toBeDefined();
    expect(screen.getByText('Iniciante')).toBeDefined();
    expect(screen.getByText('2h')).toBeDefined();
    expect(screen.getByText('Renda Variável')).toBeDefined();
  });

  it('TC-02: link opens in new tab with noopener noreferrer and UTM params', () => {
    render(<B3CourseCard course={mockCourse} />);
    const link = screen.getByRole('link', { name: /acessar na b3/i });
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    const href = link.getAttribute('href') ?? '';
    expect(href).toContain('utm_source=databolsa');
    expect(href).toContain('utm_medium=referral');
    expect(href).toContain('utm_campaign=b3-courses');
    expect(href).toContain('edu.b3.com.br');
  });
});
