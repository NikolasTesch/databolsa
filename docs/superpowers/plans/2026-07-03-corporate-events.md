# Corporate Events & Results Calendar Implementation Plan

**Data:** 2026-07-03
**Status:** pronto para execucao
**Base:** SPEC-0048

## Goal

Adicionar infraestrutura de eventos corporativos: datas com/ex de dividendos, pagamentos de JCP, resultados trimestrais, assembleias e desdobramentos. Cache dedicado, API publica, pagina de calendario e integracao na pagina do ativo — substituindo o placeholder atual de "Proximos Eventos".

**Tech Stack:** Next.js App Router, TypeScript, Prisma, Decimal.js, Vitest, Tailwind, `@databolsa/ui`.

---

## File Structure

### Create

- `apps/web/prisma/migrations/NNNN_add_corporate_event_cache`
- `apps/web/src/lib/market/event-fetchers.ts`
  - Fetchers para eventos de cada fonte.
- `apps/web/src/lib/market/events.service.ts`
  - Servico com cache, stale e integracao de fontes.
- `apps/web/src/app/api/market/events/route.ts`
  - GET com filtros ticker, type, from, to, limit.
- `apps/web/src/app/api/market/[ticker]/events/route.ts`
  - Wrapper para eventos de um ticker.
- `apps/web/src/components/market/EventsList.tsx`
  - Lista de eventos para pagina de ativo.
- `apps/web/src/app/(public)/calendario-eventos/page.tsx`
  - Pagina com grid mensal e filtros.
- `apps/web/src/test/lib/market/events.service.test.ts`
- `apps/web/src/test/api/market-events.test.ts`
- `apps/web/src/test/components/market/EventsList.test.tsx`

### Modify

- `apps/web/prisma/schema.prisma`
  - Adicionar modelo `CorporateEventCache`.
- `apps/web/src/app/(public)/ativos/[ticker]/page.tsx`
  - Substituir placeholder de eventos por `EventsList`.
- `apps/web/src/app/(app)/dashboard/page.tsx`
  - Adicionar secao "Proximos eventos da carteira".

---

## Task 1: Database Migration

**Files:**
- Modify: `apps/web/prisma/schema.prisma`

- [ ] **Step 1: Add model**

```prisma
model CorporateEventCache {
  id          String   @id @default(uuid())
  symbol      String
  source      DataSource
  event_type  String
  event_date  DateTime @db.Date
  description String?
  data        Json?
  fetched_at  DateTime @default(now())

  @@unique([symbol, event_type, event_date])
  @@index([event_date])
  @@index([symbol, event_date])
  @@map("corporate_event_cache")
}
```

- [ ] **Step 2: Run migration**

```bash
cd apps/web
npx prisma migrate dev --name add_corporate_event_cache
```

Expected: migration applied, client generated.

- [ ] **Step 3: Commit**

```bash
git add apps/web/prisma
git commit -m "feat(web): add CorporateEventCache model"
```

---

## Task 2: Event Fetchers

**Files:**
- Create: `apps/web/src/lib/market/event-fetchers.ts`

- [ ] **Step 1: Implement fetchers**

Data sources:
- Reuse `fetchBrapiDividends` for dividend/JCP events (already exists).
- Create curated list for earnings dates (major companies).
- Static fallback for common events.

Event types:
- `DIVIDEND_EX` — data ex-direito.
- `DIVIDEND_PAYMENT` — data de pagamento.
- `JCP_PAYMENT` — pagamento de JCP.
- `EARNINGS` — divulgacao de resultados trimestrais.
- `SHAREHOLDER_MEETING` — assembleia.
- `SPLIT` / `REVERSE_SPLIT` — desdobramento/grupamento.
- `FILING` — comunicado relevante.

```ts
export interface CorporateEvent {
  symbol: string;
  eventType: string;
  eventDate: string; // ISO date
  description: string;
  source: DataSource;
}
```

- [ ] **Step 2: Create curated earnings list**

Add to `curated-lists.ts` or new file `earnings-calendar.ts`:
- Ticker, quarter/period, estimated date, source: 'curated'.

```ts
export const CURATED_EARNINGS: Array<{
  ticker: string;
  period: string;
  estimatedDate: string; // MM-DD (recurring yearly estimate)
}> = [
  { ticker: 'PETR4', period: '2026Q3', estimatedDate: '10-28' },
  { ticker: 'VALE3', period: '2026Q3', estimatedDate: '10-24' },
  // ...
];
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/market/event-fetchers.ts
git commit -m "feat(web): add corporate event fetchers"
```

---

## Task 3: Events Service

**Files:**
- Create: `apps/web/src/lib/market/events.service.ts`
- Create: `apps/web/src/test/lib/market/events.service.test.ts`

- [ ] **Step 1: Write tests**

```ts
// getEvents returns events for ticker within date range
// getEvents returns stale when cache expired and source fails
// getEvents returns empty when no matching events
// upsertEvents deduplicates by unique key
```

- [ ] **Step 2: Implement service**

```ts
export async function getEvents(params: {
  ticker?: string;
  type?: string;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<{ data: CorporateEvent[]; total: number; asOf: string; stale: boolean }>
```

Implementation:
1. Check cache in `CorporateEventCache` for matching params.
2. If cache miss or expired, fetch from sources.
3. Fall back to stale cache on source failure (RN-10).
4. Return results.

- [ ] **Step 3: Run tests**

```bash
pnpm --filter web test -- events.service.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/market/events.service.ts apps/web/src/test/lib/market
git commit -m "feat(web): add corporate events service with cache"
```

---

## Task 4: Events API

**Files:**
- Create: `apps/web/src/app/api/market/events/route.ts`
- Create: `apps/web/src/app/api/market/[ticker]/events/route.ts`
- Create: `apps/web/src/test/api/market-events.test.ts`

- [ ] **Step 1: Write tests**

```ts
// GET /api/market/events?ticker=PETR4 returns events
// GET /api/market/events with from/to filters by date range
// GET /api/market/events with type filter
// GET /api/market/events returns stale when source fails
// GET /api/market/events?limit=999 returns 400
```

- [ ] **Step 2: Implement routes**

`GET /api/market/events`:
- Parse query: ticker (optional), type (optional), from (ISO), to (ISO), limit (default 20, max 50).
- Call `getEvents`.
- Return JSON response.

`GET /api/market/[ticker]/events`:
- Wrapper that extracts ticker from path.
- Calls `getEvents` with ticker pre-filled.

- [ ] **Step 3: Run tests**

```bash
pnpm --filter web test -- market-events.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/api/market/events apps/web/src/app/api/market/[ticker]/events apps/web/src/test/api/market-events.test.ts
git commit -m "feat(web): add corporate events API"
```

---

## Task 5: Events List Component & Asset Page Integration

**Files:**
- Create: `apps/web/src/components/market/EventsList.tsx`
- Create: `apps/web/src/test/components/market/EventsList.test.tsx`
- Modify: `apps/web/src/app/(public)/ativos/[ticker]/page.tsx`

- [ ] **Step 1: Create EventsList component**

Props: `{ ticker: string; limit?: number }`

Behavior:
- Fetches from `/api/market/[ticker]/events` on mount.
- Renders event cards: date, type badge, description.
- Empty state: "Nenhum evento encontrado para os proximos dias."
- Loading: skeleton cards.
- Event type icons: dividends=pPayments, earnings=monitoring, meetings=groups, split=swap_horiz.

- [ ] **Step 2: Write tests**

```ts
// renders event cards from API
// renders empty state when no events
// renders error state on API failure
```

- [ ] **Step 3: Integrate in /ativos/[ticker]/page.tsx**

Replace the current placeholder section:
```tsx
{/* Proximos Eventos */}
<section className="mt-8">
  <div className="flex items-center gap-2 mb-4">
    <span className="material-symbols-outlined text-primary">event</span>
    <h2 className="text-lg font-semibold text-on-surface">Proximos Eventos</h2>
  </div>
  <Suspense fallback={...}>
    <EventsList ticker={ticker} limit={5} />
  </Suspense>
</section>
```

- [ ] **Step 4: Run tests**

```bash
pnpm --filter web test -- EventsList.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/market/EventsList.tsx apps/web/src/test/components/market apps/web/src/app/(public)/ativos/[ticker]/page.tsx
git commit -m "feat(web): add events list to asset detail page"
```

---

## Task 6: Events Calendar Page

**Files:**
- Create: `apps/web/src/app/(public)/calendario-eventos/page.tsx`

- [ ] **Step 1: Implement page**

Server component that:
- Fetches next 60 days of events.
- Renders grid by month.
- Each month section: header, card grid.
- Event cards: date, ticker link, type badge, description.

Filter controls:
- Ticker search (client-side filter).
- Type pill buttons: Todos, Dividendos, Resultados, Assembleias, Desdobramentos.

Responsive: 1 column mobile, 2 tablet, 3 desktop.

- [ ] **Step 2: Build**

```bash
pnpm --filter web build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/(public)/calendario-eventos
git commit -m "feat(web): add corporate events calendar page"
```

---

## Task 7: Dashboard Integration

**Files:**
- Modify: `apps/web/src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Add events section**

Fetch events for assets in user's portfolio:
- Get user's assets from `listAssets`.
- Call `GET /api/market/events?ticker=TICKER1,TICKER2,...&limit=5` per asset.
- Render compact event list with links.

This section appears only when there are events for the user's assets.

- [ ] **Step 2: Build**

```bash
pnpm --filter web build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/(app)/dashboard
git commit -m "feat(web): add upcoming events section to dashboard"
```

---

## Task 8: Integration Verification

- [ ] **Step 1: Run full test suite**

```bash
pnpm --filter web test
```

Expected: all passing.

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter web exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Update SPEC-0048**

Mark all tasks done, set status.

## Risk Controls

- [ ] Nao expoe dados de usuario em rotas publicas.
- [ ] Cache TTL de 6h com fallback stale.
- [ ] Eventos duplicados deduplicados por unique key.
- [ ] Datas em formato ISO, sem timezone ambigua.
- [ ] Falha de fonte externa nunca quebra pagina.

## Self-Review

- Cobertura: migration, fetchers, service, API, EventsList, calendar page, dashboard.
- Sem fontes pagas — apenas brapi + curated.
- Placeholder de eventos substituido por dados reais.
