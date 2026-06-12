# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

**Scaffolded skeleton — pre-implementation.** The monorepo directory structure exists (`/apps/{web,mobile,api}`, `/packages/{core,types,ui}`), along with Docker infrastructure (`docker-compose.yml`, multi-stage `Dockerfile`s for api/web) and the base design system (`docs/design-system.md` + `packages/ui/src/tokens/design-tokens.json`). The backend stack is decided (Node.js + NestJS — see `docs/adr/0001`). The app directories are still empty placeholders (`.gitkeep`); **no application code, `package.json`/workspace tooling, or tests exist yet**, so there are no build/lint/test commands to run.

Work done so far, by spec: SPEC-0002 (monorepo scaffold + design system, `verified`), SPEC-0003 (Docker infra, `verified`). Next up: SPEC-0001 (`packages/core` position & P/L calculations, currently `draft`). Follow the architecture and roadmap in `docs/SPEC.md` and keep this file updated with the real commands once the tooling exists.

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

**MeuPatrimônio** (provisional name) — a personal investment-portfolio tracker. The user manually records assets and buy/sell transactions; the system fetches current quotes, converts everything to BRL, and computes position, profit/loss, return, and allocation. Web is the primary client; a mobile app is complementary. Documents are written in Portuguese (pt-BR); domain/code identifiers are in English.

Three asset classes in the MVP: B3 securities (stocks, FIIs, ETFs, BDRs), crypto, and US/foreign stocks.

## Architecture

Client-server with a single backend serving both web and mobile and brokering all external quote APIs. **API keys and business logic live exclusively on the backend** — clients never call external data sources directly.

Monorepo layout (directories scaffolded; apps not yet implemented):
- `/apps/web` — Next.js + TypeScript + Tailwind (Recharts)
- `/apps/mobile` — Flutter + Dart (fl_chart) — decided in `docs/adr/0002-mobile-flutter.md`; standalone sub-project within the monorepo (managed by `flutter` CLI, not pnpm workspace)
- `/apps/api` — backend: **Node.js + NestJS** (decided in `docs/adr/0001-backend-stack-node-nestjs.md`; ORM: Prisma)
- `/packages/core` — **financial calculations and business rules** (RN-01..RN-11), framework-agnostic and reusable
- `/packages/types` — shared API contracts/types
- `/packages/ui` — shared components (if applicable)

Backend → PostgreSQL (ORM: Prisma). Auth: JWT + refresh token. Every route except `/auth/*` requires JWT and filters by `user_id`.

External quote sources (server-side, cached): **brapi.dev** (B3), **CoinGecko** (crypto, can return BRL directly), **Finnhub** (US stocks), **AwesomeAPI** (USD/BRL FX).

**Local dev / deploy runs on Docker** (`docker compose up` brings up `postgres` + `api` + `web` with hot-reload; mobile/Flutter is not containerized — run with `flutter run` locally). Build context is always the monorepo root so `packages/*` are copied. Details in `docs/SPEC.md §10.1` and `docs/specs/0003-docker-infra.json`.

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

## Data model (planned)

`User` (id, email unique, password_hash) → `Asset` (user_id FK, ticker, asset_class enum `STOCK_BR|FII|ETF|BDR|CRYPTO|STOCK_US`, currency `BRL|USD`, data_source `BRAPI|COINGECKO|FINNHUB`) → `Transaction` (asset_id FK, type `BUY|SELL`, date, unit_price, quantity, fees). `QuoteCache` (symbol, price, currency, fetched_at; unique per symbol+source).

## Key API endpoints (planned)

`POST /auth/{register,login,refresh}`, `GET|POST /assets`, `GET /assets/:id`, `POST /assets/:id/transactions`, `PATCH|DELETE /transactions/:id`, `GET /portfolio/summary`, `GET /portfolio/history`. Full table in `docs/SPEC.md §5`.

## Scope discipline

Out of scope for the MVP (resist adding before the manual flow is solid and tested): broker/Open Finance integration (Fase 2 via Pluggy), income-tax reports, investment recommendations, low-latency realtime quotes, detailed fixed-income mark-to-market.
