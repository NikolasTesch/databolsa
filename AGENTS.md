# AGENTS.md

Context for OpenCode sessions working on this repo. High-signal, repo-specific facts only.

## Package manager split (critical)

**Root workspace uses pnpm** (`pnpm@9`, `packages: - 'apps/*' - 'packages/*'`).

**`packages/core` is a standalone npm project** — its own `package-lock.json`, own `node_modules`. Do NOT use `pnpm` in `packages/core`. Use `npm install`, `npm test`, `npm run build` there.

`packages/ui` and `apps/web` are pnpm workspace members. `packages/types` has no deps.

## Project status — Stitch design migration complete

The UI was migrated from the original design to a **Material Design 3 inspired dark theme** (generated via Google Stitch). The color palette changed from slate-based (`#0B1220` bg, `#5E8AD0` primary) to a richer M3 palette (`#0A0A0A` bg, `#adc6ff` primary, `#4edea3` secondary, `#ffb786` tertiary). All tokens are theme-aware via CSS custom properties.

## Build order

```
pnpm build at root:
  pnpm --filter @databolsa/core run build   # compile TS → dist/
  pnpm --filter web run build                # prisma generate → next build

apps/web build does:
  pnpm --filter @databolsa/core build && pnpm exec prisma generate && next build
```

**Build context for Docker is always the monorepo root** — never `apps/web/`.

## Key commands

| Scope | Command | Notes |
|---|---|---|
| Root spec validation | `pnpm validate-specs` | Validates JSON specs against schema |
| packages/core (npm) | `npm test` | Jest, coverage thresholds: 95% stmts/funcs/lines, 90% branches |
| packages/core (npm) | `npm run build` | `tsc` to `dist/` |
| packages/core (npm) | `npm run lint` | `tsc --noEmit` |
| apps/web (pnpm) | `pnpm dev` | Dev server at `http://localhost:3000` |
| apps/web (pnpm) | `pnpm test` | Vitest + jsdom, coverage v8 |
| apps/web (pnpm) | `pnpm test:e2e` | Playwright |
| apps/web (pnpm) | `pnpm build` | Builds core first, then prisma generate, then next build |
| packages/ui (pnpm) | `pnpm tokens:css` | Regenerates `src/theme.css` from design-tokens.json |
| packages/ui (pnpm) | `pnpm tokens:css:check` | CI check that theme.css is in sync |
| packages/ui (pnpm) | `pnpm test` | Vitest, 43+ tests covering tokens+generator |
| Docker dev | `docker compose up` | Starts Postgres (port 5433) + web with hot-reload |

## Design system architecture

**Source of truth:** `packages/ui/src/tokens/design-tokens.json`

```
design-tokens.json
  → src/tokens.ts            (TypeScript import)
  → scripts/generate-theme-css.mjs  → src/theme.css   (CSS vars)
  → src/tailwind-preset.ts           → apps/web/tailwind.config.ts
```

**Key new tokens** (Material Design 3 naming):
- `text-on-surface` / `text-on-surface-variant` — primary and secondary text
- `text-outline` / `border-outline-variant` — borders and dividers
- `bg-surface-container-low` / `bg-surface-dim` / `bg-surface-bright` — surface elevation
- `text-tertiary` / `bg-tertiary-container` — accent/orange tones
- `glass-panel` utility class — `.glass-panel` in `globals.css` (backdrop blur)

**OLD tokens (do NOT use):** `text-content`, `text-content-muted`, `text-content-subtle`. All replaced with M3 equivalents.

## Subagent workflow (mandatory for feature work)

1. **`arquiteto`** — reads docs/code, produces plan + ADR. Never writes code.
2. **`implementador`** — executes plan, writes code + tests. Never redesigns.

Exempt: exploratory questions, one-liner fixes. Everything else: arquiteto first.

Additional agents: `testador` (write/validate tests), `revisor` (code review).

## Component architecture

### Widgets (`components/widgets/`) — 10 reusable blocks
Components for the public home page. All default-export, importable independently:
`MarketTickerBar`, `HighlightsSection`, `DividendsSection`, `ToolsSection`, `InvestorProfileQuiz`, `B3CoursesSection`, `CryptoSections`, `GlossarySection`, `FullMarketTable`, `GlobalIndices`

### Tools (`components/tools/`) — 8 interactive tools
Single-page app at `/ferramentas` with inline navigation. All `'use client'` with default export:
`GrahamAnalysis`, `BazinRanking`, `CurrencyConverter` (re-export), `CryptoConverter` (re-export), `BeginnerGuide`, `PriceAlerts`, `IRCalculator`, `AssetComparator`

### Layout (`components/layout/`)
- `PublicHeader` — sticky nav with backdrop-blur, search bar, auth buttons
- `PublicFooter` — 4-column grid with disclaimer
- `AppShell` + `Topbar` + `Sidebar` — authenticated area layout
  - Topbar uses `material-symbols-outlined` hamburger
  - Sidebar uses material icons: dashboard, pie_chart, groups, account_balance

## Architecture

- **API is embedded in Next.js** — Route Handlers at `apps/web/src/app/api/`. No separate API service (ADR-0004). The old `apps/api/` directory was removed entirely.
- **CI jobs for apps/api were removed** — `.github/workflows/ci.yml` previously had stale jobs (`test-api`, `build-api`, `e2e`) referencing the old NestJS API. These were cleaned up. Current CI runs: test-core, test-ui, test-web, build-web, validate-specs, test-mobile.
- **Auth hybrid**: HttpOnly cookies (BFF) for web, Bearer token for mobile. JWT via `jose`.
- **Font stack**: IBM Plex Sans (body) + IBM Plex Mono (tabular figures for money). Loaded via `next/font/google`.
- **Tailwind preset** from `@databolsa/ui/tailwind-preset`.

## Domain conventions (non-negotiable)

- **Decimal.js for all money/quantities** — never `float` (RN-01).
- **Quote caching is mandatory** (`QuoteCache` table, TTL ~5-15 min). On failure reuse stale value (RN-10).
- **Per-user isolation** — every query filters by `user_id` (RN-11).
- **Mock external APIs in tests** — `USE_QUOTE_STUB=true` in CI.
- **A SELL does not change average price** of remaining units (RN-03).
- **Sell > position on date must be rejected** (RN-02).
- **Portuguese docs, English code identifiers**.

## Data model

Prisma schema at `apps/web/prisma/schema.prisma`. Models:
`User` → `Asset` (ticker, name, asset_class, currency, data_source) → `Transaction` (BUY|SELL|DIVIDEND, date, unit_price, quantity, fees)
`QuoteCache` (symbol+source unique, price, currency, fetched_at)
`PriceAlert`, `Group`/`GroupMembership`/`GroupInvite`, `BenchmarkSeriesCache`, `AssetFundamentalsCache`

## Testing quirks

- `packages/core`: Jest, tests in `src/__tests__/*.test.ts`. Exclusions: `index.ts`, `timeseries.ts`.
- `apps/web`: Vitest + jsdom, tests in `src/**/*.{test,spec}.{ts,tsx}`. Excludes `src/app/api/` and `e2e/`.
- `packages/ui`: Vitest, tests in `src/__tests__/*.test.ts` (43 tests, covers tokens + theme generation).
- Financial test edge cases: partial sale, full sale, no quote, multi-price buys, foreign currency, zero-position.

## Docker

- Postgres on host port **5433** (not 5432).
- Override mounts `apps/web/src`, `public` for hot-reload.
- Multi-stage build: `deps` → `dev`/`build` → `runner` (standalone output).

## Design token regeneration workflow

```bash
# After editing design-tokens.json:
cd packages/ui
pnpm tokens:css          # regenerate theme.css
pnpm tokens:css:check   # CI check
pnpm test                # verify 43 tests pass
```
