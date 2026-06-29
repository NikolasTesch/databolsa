import Link from 'next/link';
import { BrandLogo } from './BrandLogo';

const FOOTER_LINKS = {
  Mercado: [
    { label: 'Ações', href: '/?type=STOCK_BR' },
    { label: 'FIIs', href: '/?type=FII' },
    { label: 'ETFs', href: '/?type=ETF' },
    { label: 'BDRs', href: '/?type=BDR' },
    { label: 'Crypto', href: '/?type=CRYPTO' },
    { label: 'Stocks US', href: '/?type=STOCK_US' },
  ],
  Ferramentas: [
    { label: 'Conversor de Moedas', href: '/ferramentas' },
    { label: 'Simulador', href: '/ferramentas' },
    { label: 'Calculadora IR', href: '/ferramentas' },
    { label: 'Análise de Índices', href: '/ferramentas' },
  ],
  Institucional: [
    { label: 'Termos de Uso', href: '/termos' },
    { label: 'Privacidade', href: '/privacidade' },
    { label: 'Compliance', href: '/compliance' },
    { label: 'Ajuda', href: '/ajuda' },
  ],
} as const;

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-12">
        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <BrandLogo textClassName="text-headline-md font-bold" />
            <p className="mt-2 text-body-sm text-on-surface-variant max-w-xs">
              Acompanhamento de patrimônio em investimentos com lançamento manual de operações e consolidação em BRL.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-body-sm font-semibold text-on-surface mb-3">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-body-sm text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-caption text-on-surface-variant">
            &copy; {year} databolsa. Todos os direitos reservados.
          </p>
          <p className="text-caption text-on-surface-variant max-w-2xl text-center md:text-right leading-relaxed">
            Aviso: O conteúdo apresentado neste site tem caráter meramente informativo e educacional, não constituindo recomendação de investimento.
          </p>
        </div>
      </div>
    </footer>
  );
}
