# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

**MVP web implementado.** O monorepo está scaffoldado (`/apps/{web,mobile}`, `/packages/{core,types,ui}`), a infraestrutura Docker funciona e o design system base existe. A API NestJS foi **migrada para Next.js Route Handlers** dentro de `apps/web` (ADR-0004, SPEC-0011) — `apps/api` foi removido.

`packages/core` é um projeto Node.js standalone (TypeScript + Jest + decimal.js) com cobertura completa de testes. pnpm workspaces está configurado na raiz (`pnpm-workspace.yaml`).

Specs concluídas (todas `verified`): SPEC-0001 (cálculos `packages/core`), SPEC-0002 (scaffold + design system), SPEC-0003 (Docker), SPEC-0004 (design tokens), SPEC-0005 (schema Prisma + migrations), SPEC-0006 (backend auth + CRUD), SPEC-0007 (cotações + cache), SPEC-0008 (web Next.js + dashboard), SPEC-0009 (mobile Flutter), SPEC-0010 (E2E + CI), SPEC-0011 (migração API → Next.js Route Handlers). Consulte `docs/SPEC.md` para arquitetura e `docs/specs/README.md` para o índice completo.

### Build/test commands

```bash
# packages/core (standalone)
cd packages/core
npm install          # install dependencies (first time)
npm test             # run Jest with coverage (thresholds: 95% stmts/funcs/lines, 90% branches)
npm run build        # compile TypeScript to dist/
npm run lint         # tsc --noEmit (type-check only, no emit)

# apps/web (Next.js + Route Handlers API)
cd apps/web
pnpm install         # install dependencies
pnpm dev             # dev server with hot-reload (http://localhost:3000)
pnpm build           # production build
pnpm test            # run Vitest unit tests

# Docker (dev completo)
docker compose up    # sobe postgres + web (hot-reload via override)
```

## Subagent workflow — mandatory

Every non-trivial task follows a two-agent pipeline. Never skip roles or merge them into a single step.

| Role | Agent | When to invoke | What it does | What it does NOT do |
|---|---|---|---|---|
| **Arquiteto** | `arquiteto` | Before any feature, rule change, or non-trivial refactor — always first | Reads docs + existing code, draws the solution, produces an implementation plan + ADR | Writes production code or tests |
| **Implementador** | `implementador` | After the arquiteto delivers a plan | Writes/edits code and tests, updates the spec JSON, updates docs | Redesigns the architecture |

**Rule:** if the task touches production code, spawn `arquiteto` first. Only after its plan is in hand, spawn `implementador` to execute. Exploratory questions and one-liner fixes are exempt, but any feature or business-rule change is not.

Additional specialised agents (use when the situation calls for them):

| Agent | Purpose |
|---|---|
| `testador` | Write, run, and validate tests; cover edge cases for financial calculations |
| `revisor` | Code-review the diff before merge — bugs, security, convention violations |
| `Explore` | Fast read-only codebase search (file patterns, symbol lookups) |

## Spec-Driven Development (SDD) — mandatory workflow

This project is **spec-driven**. Before writing or changing production code for any unit of work (feature, bugfix, refactor, infra), you MUST create or update a **JSON spec** under `docs/specs/`. The spec is the source of truth for *what* and *why*; code serves the spec.

For every task:

1. **Create the spec.** Copy `docs/specs/0000-template.json` to `docs/specs/NNNN-short-title.json` (sequential `NNNN`). It MUST validate against `docs/specs/spec.schema.json`. Fill at minimum: `summary`, `scope` (always include `out_of_scope`), `requirements`, `acceptance_criteria`, `test_plan`.
2. **Trace it.** In `related`, link the relevant PRD/SPEC sections, business rules (`RN-01..RN-11`), and any ADRs.
3. **Approve before coding.** Set `status: approved` (in solo work, this is the self-review step).
4. **Implement to the spec.** Set `status: in_progress` and tick off `tasks[].done`. If reality diverges, **update the spec first**, then the code.
5. **Test.** Cover the whole `test_plan`, including the domain's required edge cases. Mock external APIs — never hit the network in automated tests.
6. **Close.** Confirm `acceptance_criteria`, set `status: implemented` → `verified`, bump `updated`, and add a row to the spec index in `docs/specs/README.md`.

Full process and lifecycle: `docs/specs/README.md`. Do not skip the spec for "small" changes — keep the spec proportional instead. Architectural decisions still go in an ADR (`docs/adr/`); the spec references it.

## What this product is

**DataBolsa** — a personal investment-portfolio tracker. The user manually records assets and buy/sell transactions; the system fetches current quotes, converts everything to BRL, and computes position, profit/loss, return, and allocation. Web is the primary client; a mobile app is complementary. Documents are written in Portuguese (pt-BR); domain/code identifiers are in English.

Three asset classes in the MVP: B3 securities (stocks, FIIs, ETFs, BDRs), crypto, and US/foreign stocks.

## Architecture

Client-server with a **single Next.js app** (`apps/web`) serving both the web frontend and the REST API (via Route Handlers), brokering all external quote APIs. **API keys and business logic live exclusively on the server side** — browser and mobile clients never call external data sources directly (ADR-0004).

Monorepo layout:
- `/apps/web` — Next.js + TypeScript + Tailwind (Recharts). **Também é o backend**: Route Handlers em `src/app/api/` implementam auth, assets, transactions, portfolio e quotes. Prisma em `apps/web/prisma/`.
- `/apps/mobile` — Flutter + Dart (fl_chart) — decided in `docs/adr/0002-mobile-flutter.md`; standalone sub-project within the monorepo (managed by `flutter` CLI, not pnpm workspace). Consome a mesma API REST do `apps/web`.
- `/packages/core` — **financial calculations and business rules** (RN-01..RN-11), framework-agnostic and reusable
- `/packages/types` — shared API contracts/types
- `/packages/ui` — shared components

Database: PostgreSQL (ORM: Prisma). Auth: JWT + refresh token com autenticação híbrida — cookies HttpOnly para o web (BFF, ADR-0003) e Bearer Token no `Authorization` header para o mobile. Every route except `/api/auth/*` requires JWT and filters by `user_id`.

External quote sources (server-side, cached): **brapi.dev** (B3), **CoinGecko** (crypto, can return BRL directly), **Finnhub** (US stocks), **AwesomeAPI** (USD/BRL FX).

**Local dev / deploy runs on Docker** (`docker compose up` brings up `postgres` + `web` with hot-reload; mobile/Flutter is not containerized — run with `flutter run` locally). Build context is always the monorepo root so `packages/*` are copied. Details in `docs/SPEC.md §10.1` and `docs/specs/finalizadas/0003-docker-infra.json`.

## Non-negotiable conventions

These come straight from the spec and are the point of the project — get them right:

- **Build `/packages/core` first, with ~100% test coverage, before any UI.** The financial calculations are the core demonstration of the project. See `docs/SPEC.md §11` (roadmap) and §9 (test strategy).
- **Use `decimal`/`numeric` for all money and quantities — never `float`.** Avoids rounding errors in financial values.
- **Quote caching is mandatory.** Read quotes from `QuoteCache` and only refresh after a TTL (~5–15 min). This protects the free-tier API limits and speeds up the dashboard. On a source failure, reuse the last cached value and mark it `stale` (RN-10) — degrade gracefully, never break the total.
- **Per-user isolation (RN-11).** Every asset, transaction, and computed metric belongs to exactly one user; no data is shared across accounts.
- **Mock external APIs in tests** — never depend on the network in automated tests.

## Business rules — the financial calculations (RN-01..RN-11)

The heart of the product. Implemented in `/packages/core`. Full prose in `docs/PRD.md §7`; formulas in `docs/SPEC.md §7`.

```
preço_médio          = (Σ(qtd_compra × preço_compra) + taxas) / Σ qtd_compra
qtd_atual            = Σ qtd_compra − Σ qtd_venda          # never negative; block over-selling
valor_investido      = qtd_atual × preço_médio
valor_atual (moeda)  = qtd_atual × cotação_atual
valor_atual (BRL)    = valor_atual × câmbio                # only if currency ≠ BRL
lucro_prejuízo_R$    = valor_atual_BRL − valor_investido_BRL
lucro_prejuízo_%     = lucro_prejuízo_R$ / valor_investido_BRL × 100
patrimônio_total     = Σ valor_atual_BRL (positions with qtd_atual > 0)
alocação_ativo_%     = valor_atual_BRL_ativo / patrimônio_total × 100
```

Key subtleties:
- **A SELL does not change the average price** of remaining units (RN-03, Brazilian average-cost method). It only reduces quantity and realizes P/L on the units sold against the current average price.
- **A SELL larger than the position on that date must be rejected** (RN-02).
- Required edge-case tests: partial sale, full sale, asset with no quote available, multiple buys at different prices, foreign-currency asset, and zero-position (division by zero).

## Data model

Implementado em `apps/web/prisma/schema.prisma`. `User` (id, email unique, password_hash) → `Asset` (user_id FK, ticker, asset_class enum `STOCK_BR|FII|ETF|BDR|CRYPTO|STOCK_US`, currency `BRL|USD`, data_source `BRAPI|COINGECKO|FINNHUB`) → `Transaction` (asset_id FK, type `BUY|SELL`, date, unit_price, quantity, fees). `QuoteCache` (symbol, price, currency, fetched_at; unique per symbol+source).

## Key API endpoints

Implementados como Next.js Route Handlers em `apps/web/src/app/api/`:

- Auth (sem JWT): `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`
- Auth BFF (cookies HttpOnly, web only): `POST /api/session/login`, `POST /api/session/register`, `POST /api/session/refresh`, `POST /api/session/logout`
- Assets: `GET|POST /api/assets`, `GET|DELETE /api/assets/:id`, `GET|POST /api/assets/:id/transactions`
- Transactions: `PATCH|DELETE /api/transactions/:id`
- Portfolio: `GET /api/portfolio/summary`

Full table in `docs/SPEC.md §5` and `docs/specs/finalizadas/0011-migrate-api-to-nextjs.json`.

## Scope discipline

Out of scope for the MVP (resist adding before the manual flow is solid and tested): broker/Open Finance integration (Fase 2 via Pluggy), income-tax reports, investment recommendations, low-latency realtime quotes, detailed fixed-income mark-to-market.
