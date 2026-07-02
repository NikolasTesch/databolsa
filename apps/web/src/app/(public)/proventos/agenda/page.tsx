import Link from 'next/link';
import { getDividendsAgenda } from '@/lib/market/dividends-agenda';
import type { AgendaItem } from '@/lib/market/dividends-agenda';

export const revalidate = 300;

function getTickerInitials(ticker: string): string {
  return ticker.slice(0, 2);
}

export default async function DividendAgendaPage() {
  const agenda = await getDividendsAgenda();

  return (
    <div className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <span className="text-on-surface font-medium">Proventos</span>
        <span>/</span>
        <span className="text-on-surface">Agenda</span>
      </div>

      <h1 className="text-xl font-semibold text-on-surface mb-6">Agenda de Dividendos</h1>

      {agenda.length === 0 ? (
        <p className="text-sm text-on-surface-variant py-8 text-center">Nenhum dividendo disponível no momento.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-on-surface-variant uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-medium">Ativo</th>
                <th className="px-4 py-3 text-left font-medium">Tipo</th>
                <th className="px-4 py-3 text-left font-medium">Data Com</th>
                <th className="px-4 py-3 text-left font-medium">Pagamento</th>
                <th className="px-4 py-3 text-right font-medium">Valor (R$)</th>
                <th className="px-4 py-3 text-right font-medium">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {agenda.map((row, i) => (
                <tr key={`${row.ticker}-${i}`} className="border-b border-border/50 last:border-b-0 hover:bg-surface-muted/50 transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary rounded">
                  <td className="px-4 py-3">
                    <Link href={`/ativos/${row.ticker}?class=${row.assetClass}`} className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-surface-muted font-mono text-xs font-semibold text-on-surface">
                        {getTickerInitials(row.ticker)}
                      </div>
                      <span className="font-mono text-sm font-semibold text-on-surface hover:text-primary transition-colors">
                        {row.ticker}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${row.type === 'JCP' ? 'bg-primary/10 text-primary' : 'bg-profit/10 text-profit'}`}>
                      {row.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-on-surface">{row.dateCom}</td>
                  <td className="px-4 py-3 font-mono text-sm text-on-surface">{row.payment}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-on-surface tabular-nums">{row.value}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-on-surface-variant">{row.assetClass}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
