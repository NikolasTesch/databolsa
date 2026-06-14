import Link from 'next/link';
import { SearchBar } from '@/components/market/SearchBar';

interface PublicHeaderProps {
  isAuthenticated: boolean;
}

const NAV_LINKS = [
  { label: 'Ações', type: 'STOCK_BR' },
  { label: 'FIIs', type: 'FII' },
  { label: 'ETFs', type: 'ETF' },
  { label: 'BDRs', type: 'BDR' },
  { label: 'Crypto', type: 'CRYPTO' },
  { label: 'Stocks US', type: 'STOCK_US' },
] as const;

export function PublicHeader({ isAuthenticated }: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-sticky bg-surface border-b border-border">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center gap-4">
          <Link href="/" className="flex-shrink-0 text-xl font-semibold text-primary" aria-label="DataBolsa — página inicial">
            DataBolsa
          </Link>

          <nav className="hidden lg:flex items-center gap-1 flex-1" aria-label="Navegação por classe de ativo">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.type}
                href={`/?type=${link.type}`}
                className="px-3 py-1.5 text-sm font-medium text-content-muted hover:text-content rounded transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex flex-1 lg:flex-none lg:w-64">
            <SearchBar variant="compact" />
          </div>

          <div className="flex-shrink-0 flex items-center gap-2 border-l border-border pl-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="px-3 py-1.5 text-sm font-medium text-content-muted hover:bg-surface-muted rounded transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-sm font-medium text-content-muted hover:bg-surface-muted rounded transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1.5 text-sm font-medium bg-primary text-white rounded hover:bg-primary-hover transition-colors"
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="md:hidden pb-3">
          <SearchBar variant="compact" />
        </div>
      </div>
    </header>
  );
}
