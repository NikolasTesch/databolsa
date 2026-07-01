# T2 – Página /dividendos

## Arquivos criados

- `apps/web/src/app/(public)/dividendos/page.tsx` — server component
  - `force-dynamic` + `metadata` export
  - Fetches `getDividendsAgenda()` + `fetchDividendsNews()` via `Promise.all`
  - Passes `agenda: AgendaItem[]` and `news: NewsArticle[]` to `<DividendosClient />`

- `apps/web/src/app/(public)/dividendos/client.tsx` — `'use client'` component
  - Hero: grid mesh + gradient orbs + badge "Renda Passiva" + title with gradient "Dividendos e Proventos" + subtitle + stats (ticker count, dividendos/JCP counts, total registros)
  - Filter tabs: Todos | Dividendos | JCP via `bg-surface-container-low` pill group
  - Search: by ticker, `w-full md:w-72`
  - Table: full agenda (unlimited), columns = Ativo | Tipo | Data Com | Pagamento | Valor (R$) | Yield
    - Ativo: initials circle + ticker link to `/ativos/{ticker}?class=`
    - Tipo badge: JCP → `bg-primary/10 text-primary`, Dividendo → `bg-profit/10 text-profit`
    - Monospaced tabular-nums for values
  - Pagination: 20 items/page, prev/next + 5 page number buttons, "Mostrando X–Y de Z"
  - Empty state: `search_off` icon + message
  - News section: 3-column grid of `bg-surface` cards with source badge, title, summary, time ago
  - Educational section: 3 cards (Dividendos, JCP, Bonificacoes) with icons, descriptions, feature lists
  - Disclaimer: `glass-panel` card

## Patterns followed

- Cursos page hero (grid mesh, gradient orbs, badge, gradient title, stats pills)
- DividendsSection table (initials circle, type badges, column layout)
- Agenda page data fetching (`getDividendsAgenda` → `AgendaItem[]`)
- M3 design tokens throughout (no hardcoded colors)
- `material-symbols-outlined` for icons
- `font-mono tabular-nums` for financial values

## Design tokens used

- `bg-background`, `text-on-surface`, `text-on-surface-variant`
- `bg-surface`, `bg-surface-muted`, `bg-surface-container-low`
- `border-border`, `border-border/40`, `border-border/50`
- `text-primary`, `text-secondary`, `text-profit`, `text-tertiary`, `text-on-primary`
- `bg-primary/10`, `bg-profit/10`, `bg-profit/5`, `bg-surface-container-high`
- `glass-panel`
