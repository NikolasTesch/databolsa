'use client';

import Link from 'next/link';

interface DividendRow {
  ticker: string;
  type: string;
  dateCom: string;
  payment: string;
  value: string;
  yieldPct: string;
}

interface NewsItem {
  category: string;
  title: string;
  timestamp: string;
  href: string;
}

const DIVIDEND_DATA: DividendRow[] = [
  {
    ticker: 'BBAS3',
    type: 'JCP',
    dateCom: '12/06/2026',
    payment: '30/06/2026',
    value: '1,5000',
    yieldPct: '1,2%',
  },
  {
    ticker: 'ITUB4',
    type: 'Dividendo',
    dateCom: '10/06/2026',
    payment: '25/06/2026',
    value: '0,8500',
    yieldPct: '0,8%',
  },
  {
    ticker: 'EGIE3',
    type: 'Dividendo',
    dateCom: '05/06/2026',
    payment: '20/06/2026',
    value: '1,2000',
    yieldPct: '1,5%',
  },
];

const NEWS_DATA: NewsItem[] = [
  {
    category: 'Dividendos',
    title: 'BBAS3 anuncia JCP de R$ 1,50 por ação com data-com em 12 de junho',
    timestamp: 'Há 3 horas',
    href: '#',
  },
  {
    category: 'Proventos',
    title: 'ITUB4 paga R$ 0,85 por ação em dividendos referentes ao 1º trimestre',
    timestamp: 'Há 6 horas',
    href: '#',
  },
  {
    category: 'Mercado',
    title: 'EGIE3 distribui R$ 1,20 por ação; yield atrativo de 1,5% no mês',
    timestamp: 'Há 1 dia',
    href: '#',
  },
  {
    category: 'Agenda',
    title: 'Calendário de proventos da B3: mais de 20 empresas pagam dividendos em julho',
    timestamp: 'Há 2 dias',
    href: '#',
  },
];

function getTickerInitials(ticker: string): string {
  // Return first 2 characters for the circle
  return ticker.slice(0, 2);
}

export default function DividendsSection() {
  return (
    <section
      className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-10"
      aria-label="Dividendos e proventos"
    >
      {/* ── Agenda de Dividendos ── */}
      <div className="mb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-content">
            Agenda de Dividendos
          </h2>
          <Link
            href="/proventos/agenda"
            className="text-sm text-primary hover:underline"
          >
            Ver agenda completa
          </Link>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-content-muted uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-medium">Ativo</th>
                <th className="px-4 py-3 text-left font-medium">Tipo</th>
                <th className="px-4 py-3 text-left font-medium">Data Com</th>
                <th className="px-4 py-3 text-left font-medium">Pagamento</th>
                <th className="px-4 py-3 text-right font-medium">Valor (R$)</th>
                <th className="px-4 py-3 text-right font-medium">Yield</th>
              </tr>
            </thead>
            <tbody>
              {DIVIDEND_DATA.map((row) => (
                <tr
                  key={row.ticker}
                  className="border-b border-border/50 last:border-b-0 hover:bg-surface-muted/50 transition-colors"
                >
                  {/* Ativo — circle + ticker */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-surface-muted font-mono text-xs font-semibold text-content">
                        {getTickerInitials(row.ticker)}
                      </div>
                      <span className="font-mono text-sm font-semibold text-content">
                        {row.ticker}
                      </span>
                    </div>
                  </td>

                  {/* Tipo */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        row.type === 'JCP'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-profit/10 text-profit'
                      }`}
                    >
                      {row.type}
                    </span>
                  </td>

                  {/* Data Com */}
                  <td className="px-4 py-3 font-mono text-sm text-content">
                    {row.dateCom}
                  </td>

                  {/* Pagamento */}
                  <td className="px-4 py-3 font-mono text-sm text-content">
                    {row.payment}
                  </td>

                  {/* Valor */}
                  <td className="px-4 py-3 text-right font-mono text-sm text-content tabular-nums">
                    {row.value}
                  </td>

                  {/* Yield */}
                  <td className="px-4 py-3 text-right font-mono text-sm text-profit tabular-nums">
                    {row.yieldPct}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Últimas sobre Proventos ── */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-content">
            Últimas sobre Proventos
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {NEWS_DATA.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="group rounded-lg bg-surface-muted/50 p-4 hover:bg-surface-muted transition-colors"
            >
              <span className="mb-1.5 block text-xs font-medium text-primary uppercase tracking-wide">
                {item.category}
              </span>
              <h3 className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors leading-snug">
                {item.title}
              </h3>
              <span className="mt-2 block text-xs text-content-muted">
                {item.timestamp}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
