'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SearchBar } from '@/components/market/SearchBar';
import { ThemeToggle } from './ThemeToggle';
import { BrandLogo } from './BrandLogo';

interface PublicHeaderProps {
  isAuthenticated: boolean;
}

const NAV_ITEMS = [
  { label: 'Início', href: '/' },
  { label: 'Mercados', href: '/#mercados' },
  { label: 'Dividendos', href: '/#dividendos' },
  { label: 'Cripto', href: '/#cripto' },
  { label: 'Ferramentas', href: '/ferramentas' },
  { label: 'Cursos', href: '/#cursos' },
] as const;

export function PublicHeader({ isAuthenticated }: PublicHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-sticky bg-background/80 backdrop-blur-md border-b border-border">
      <div className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
        <div className="flex items-center justify-between h-16">
          {/* Left: brand + nav */}
          <div className="flex items-center gap-8">
            <Link href="/">
              <BrandLogo textClassName="text-headline-md font-bold tracking-tight" />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6">
              {NAV_ITEMS.map((item) => {
                const isActive = item.href === '/' || item.href === '/#mercados';
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`text-body-sm transition-colors ${
                      isActive
                        ? 'text-primary font-bold border-b-2 border-primary pb-[21px] mt-[23px]'
                        : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: search + auth */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:block w-64">
              <SearchBar variant="compact" />
            </div>

            <ThemeToggle />

            <div className="flex items-center gap-2 border-l border-border pl-4">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="px-4 py-1.5 rounded text-body-sm bg-primary-container text-on-primary-container hover:bg-primary hover:text-white transition-colors font-medium"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-3 py-1.5 text-body-sm text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-1.5 rounded text-body-sm bg-primary-container text-on-primary-container hover:bg-primary hover:text-white transition-colors font-medium"
                  >
                    Criar conta
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-on-surface-variant hover:text-on-surface"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Abrir menu"
            >
              <span className="material-symbols-outlined text-[24px]">
                {mobileOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileOpen && (
          <nav className="md:hidden pb-4 border-t border-border pt-3 flex flex-col gap-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-3 py-2 text-body-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-muted rounded transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
