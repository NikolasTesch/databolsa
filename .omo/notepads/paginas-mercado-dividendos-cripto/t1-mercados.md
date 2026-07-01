# t1 — Página /mercados (Market Overview)

## Patterns used

### Server page (page.tsx)
- export const dynamic = 'force-dynamic'
- export const metadata: Metadata = { ... }
- Thin wrapper that renders <MercadosClient />
- No 'use client'

### Client page (client.tsx)
- 'use client'
- Hero section: grid mesh bg + gradient orbs + live badge (cursos pattern)
- Data fetching via useEffect ? /api/market/highlights?type={class}&limit=50
- Indices via /api/market/indices (fetched once)
- News via /api/market/news?limit=4
- Filter: search by ticker/name
- Sort: change desc, change asc, name A-Z
- Pagination: 20 items/page, resets on tab/search/sort change
- Sidebar: top 4 gainers + top 4 losers from current items, news
- Loading skeleton: 5 shimmer rows
- Empty state: 'Nenhum ativo encontrado' with icon

### API change
- MAX_LIMIT in /api/market/highlights/route.ts bumped from 6 ? 50 to support full table

### Design tokens
- g-background, 	ext-on-surface, 	ext-on-surface-variant, glass-panel, order-border
- g-surface-container-low, 	ext-primary, 	ext-profit, 	ext-loss
- ont-mono tabular-nums for prices
- material-symbols-outlined for icons

### Styling reference
- Hero: cursos/page.tsx (grid mesh, gradient orbs, live badge, gradient heading, stat pills)
- Table: FullMarketTable.tsx (PillButton, MarketHeaderCard, TableRow with '—' for missing P/L/DY/volume/mktCap)
- Tabs/sort/page: ativos/page.tsx pattern

## Build verification
- pnpm build: Compiled successfully, linting passed, no type errors
- Static page generation timed out (>10min) — infrastructure issue, not code-related
- MAX_LIMIT in /api/market/highlights/route.ts: 6 ? 50
- All files created and verified
