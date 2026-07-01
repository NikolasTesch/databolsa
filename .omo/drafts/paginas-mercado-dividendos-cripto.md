# Draft: Páginas Mercado, Dividendos e Cripto

## Findings (from codebase exploration)

### Current routing
- Navigation has Mercados / Dividendos / Cripto → `/#mercados`, `/#dividendos`, `/#cripto` (hash scrolls)
- Partial pages exist: `/ativos` (market table), `/proventos/agenda` (dividend table), `/mercado/cripto` (crypto grid)
- Full-page patterns established: `/cursos` (hero + filters + grid + sections) and `/ferramentas` (tool grid + detail view)

### Available data sources (reuse, no new APIs)
- `lib/market/highlights-data.ts` → `fetchAssetsForClass(class)` — any asset class
- `lib/market/crypto-overview.ts` → `getCryptoOverview()` — prices + trending
- `lib/market/dividends-agenda.ts` → `getDividendsAgenda()` — full agenda
- `lib/news/news.service.ts` → `fetchDividendsNews()`, `fetchCryptoNews()`
- API: `/api/market/indices`, `/api/market/highlights`, `/api/market/news`
- `lib/courses-data.ts` → `B3_COURSES` (filterable by category e.g. 'Criptomoedas')

### Design system (M3 Stitch tokens)
- Container: `max-w-max-width`, `px-margin-mobile md:px-margin-desktop`, py-10
- Cards: `glass-panel`, `bg-surface`, `border-border`
- Text: `text-on-surface`, `text-on-surface-variant`, `text-primary`
- Finance: `text-profit`, `text-loss`, `text-neutralChange`
- Background: `bg-background`, `bg-surface-container-low`

### Key widgets to reference
- `FullMarketTable.tsx` — table layout, NAV_TABS, indices cards, gainers/losers sidebar
- `HighlightsSection.tsx` — asset class tabs, gainer/loser cards, empty state
- `DividendsSection.tsx` — agenda table + dividend news grid
- `CryptoSections.tsx` — crypto cards + news + trending sidebar
- `B3CoursesSection.tsx` — course cards with accent bars (reusable for educational sections)

## Decisions (approved by user)

### Routing strategy: **3 new routes**
- `/mercados` — new full market overview page
- `/dividendos` — new full dividends page
- `/cripto` — new full crypto page (upgrades minimal `/mercado/cripto`)
- Existing `/ativos`, `/proventos/agenda`, `/mercado/cripto` remain untouched

### Markets layout: **Table + sidebar**
FullMarketTable-inspired: main data table with indices cards + gainers/losers sidebar

### Navigation updates
- `PublicHeader.tsx` → change NAV_ITEMS: `/#mercados` → `/mercados`, `/#dividendos` → `/dividendos`, `/#cripto` → `/cripto`
- `PublicFooter.tsx` → verify/repoint links to new routes
- Widgets' "Ver todos"/"Ver agenda completa"/"Painel completo" links → point to new routes

### Page structure (uniform pattern across all 3)
1. Server component (`page.tsx`) exports `metadata` + renders client component
2. Client component with:
   - Hero section (gradient orbs, badge, title, stats)
   - Filter/search controls
   - Main content area (table/grid)
   - Secondary content (featured, trending, news)
   - Educational/CTA section (optional)
3. Empty states, loading skeletons, error handling

## Gate
status: awaiting-approval
pending: user approval → `$start-work`
