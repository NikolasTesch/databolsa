import Link from 'next/link';

const ASSET_LINKS = [
  { label: 'Ações', href: '/?type=STOCK_BR' },
  { label: 'FIIs', href: '/?type=FII' },
  { label: 'ETFs', href: '/?type=ETF' },
  { label: 'BDRs', href: '/?type=BDR' },
  { label: 'Crypto', href: '/?type=CRYPTO' },
  { label: 'Stocks US', href: '/?type=STOCK_US' },
];

const AUTH_LINKS = [
  { label: 'Entrar', href: '/login' },
  { label: 'Criar conta', href: '/register' },
  { label: 'Dashboard', href: '/dashboard' },
];

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface border-t border-border py-8 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <span className="text-lg font-semibold text-primary">DataBolsa</span>
            <p className="mt-2 text-sm text-content-muted">
              Análise e carteira de investimentos
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-content mb-3">Mercado</h3>
            <ul className="space-y-2">
              {ASSET_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-content-muted hover:text-content transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-content mb-3">Conta</h3>
            <ul className="space-y-2">
              {AUTH_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-content-muted hover:text-content transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <p className="text-xs text-content-muted text-center">
            &copy; {year} DataBolsa. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
