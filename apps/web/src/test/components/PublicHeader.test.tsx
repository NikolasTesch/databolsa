import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

import { PublicHeader } from '@/components/layout/PublicHeader';

describe('PublicHeader', () => {
  it('AC-07 (deslogado): exibe "Entrar" e "Criar conta" quando não autenticado', () => {
    render(<PublicHeader isAuthenticated={false} />);
    expect(screen.getByText('Entrar')).toBeInTheDocument();
    expect(screen.getByText('Criar conta')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).toBeNull();
  });

  it('AC-07 (logado): exibe "Dashboard" quando autenticado', () => {
    render(<PublicHeader isAuthenticated={true} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Entrar')).toBeNull();
    expect(screen.queryByText('Criar conta')).toBeNull();
  });

  it('renderiza logo "databolsa" com link para /', () => {
    const { container } = render(<PublicHeader isAuthenticated={false} />);
    const logoLink = container.querySelector('a[href="/"]');
    expect(logoLink?.textContent).toContain('databolsa');
  });

  it('tem a navbar com links de navegação', () => {
    render(<PublicHeader isAuthenticated={false} />);
    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Mercados')).toBeInTheDocument();
    expect(screen.getByText('Dividendos')).toBeInTheDocument();
    expect(screen.getByText('Cripto')).toBeInTheDocument();
    expect(screen.getByText('Ferramentas')).toBeInTheDocument();
    expect(screen.getByText('Cursos')).toBeInTheDocument();
  });

  it('link "Entrar" aponta para /login', () => {
    const { container } = render(<PublicHeader isAuthenticated={false} />);
    const link = Array.from(container.querySelectorAll('a')).find(
      (a) => a.textContent?.trim() === 'Entrar',
    );
    expect(link?.getAttribute('href')).toBe('/login');
  });

  it('link "Criar conta" aponta para /register', () => {
    const { container } = render(<PublicHeader isAuthenticated={false} />);
    const link = Array.from(container.querySelectorAll('a')).find(
      (a) => a.textContent?.trim() === 'Criar conta',
    );
    expect(link?.getAttribute('href')).toBe('/register');
  });

  it('link "Dashboard" aponta para /dashboard quando autenticado', () => {
    const { container } = render(<PublicHeader isAuthenticated={true} />);
    const link = Array.from(container.querySelectorAll('a')).find(
      (a) => a.textContent?.trim() === 'Dashboard',
    );
    expect(link?.getAttribute('href')).toBe('/dashboard');
  });

  it('é sticky (tem classe sticky)', () => {
    const { container } = render(<PublicHeader isAuthenticated={false} />);
    const header = container.querySelector('header');
    expect(header?.className).toContain('sticky');
  });
});
