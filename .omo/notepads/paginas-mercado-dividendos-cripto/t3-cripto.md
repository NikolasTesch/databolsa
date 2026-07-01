# t3 — Página /cripto (Crypto Market)

## Patterns used

### Server page (page.tsx)
- export const dynamic = 'force-dynamic'
- export const metadata: Metadata = { ... }
- Thin wrapper that fetches all data (Promise.all for overview + news) and passes to <CriptoClient />
- Filters B3_COURSES.filter(c => c.category === 'Criptomoedas') — 1 course (id: 'criptoativos-introducao')
- No 'use client'

### Client page (client.tsx)
- 'use client'
- Hero section: grid mesh bg + gradient orbs + live badge (cursos pattern)
- Stats: ativos count, top mover (highest absolute change), news count
- Search: filter by name/symbol
  - Empty state (search): 'Nenhuma criptomoeda encontrada' with search_off icon
  - Empty state (no data): 'Dados de cripto indisponíveis no momento' with error_outline icon
- Cards grid (3/4 width): glass-panel cards with symbol emoji, name, price, change %, volume 24h, stale indicator
- Sidebar (1/4 width): trending (top 3 by absolute change) + latest news (3 teaser items)
- News section (full-width): 3-col grid with source badge, title, summary
- Learn section: B3 course card with icon, level badge, category, title, description, duration, CTA
- Loading skeleton: SkeletonGrid component with 6 shimmer cards (animate-pulse)
- Data comes from server props (no client-side fetching)

### Data sources
- getCryptoOverview() from @/lib/market/crypto-overview → CryptoOverviewResult (assets + trending)
- etchCryptoNews() from @/lib/news/news.service → { articles: NewsArticle[]; cached: boolean }
- B3_COURSES from @/lib/courses-data → filtered by category === 'Criptomoedas'

### Design tokens
- g-background, 	ext-on-surface, 	ext-on-surface-variant, glass-panel, order-border
- g-surface-container-low, 	ext-primary, 	ext-profit, 	ext-loss, 	ext-neutralChange
- 	ext-tertiary (for stale data warning)
- ont-mono tabular-nums for prices
- material-symbols-outlined for icons

### Styling reference
- Hero: cursos/page.tsx (grid mesh, gradient orbs, live badge, gradient heading, stat pills)
- Cards: CryptoSections.tsx (glass-panel, emoji by symbol, ChangeIndicator, volume, stale)
- Course cards: CursosPage (accent header, icon box, level badge, category, title, desc, duration, CTA)
- News: CryptoSections.tsx (Radar Cripto layout) + expanded grid for full news section

### File structure
- pps/web/src/app/(public)/cripto/page.tsx — server component
- pps/web/src/app/(public)/cripto/client.tsx — client component
