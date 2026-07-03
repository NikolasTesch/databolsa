# Analytical Watchlist & Fundamentals Alerts Implementation Plan

**Data:** 2026-07-03
**Status:** pronto para execucao
**Base:** SPEC-0047

## Goal

Evoluir a wishlist (AssetWatch) para watchlist analitica com colunas de score e ultimo fundamento, mais alertas fundamentalistas configuraveis: DY, P/VP, P/L, ROE, score, stale. Novo modelo `AnalysisAlertRule` com avaliacao lazy no padrao ADR-0010.

**Tech Stack:** Next.js App Router, TypeScript, Prisma, Decimal.js, Vitest, Tailwind, `@databolsa/ui`.

---

## File Structure

### Create

- `apps/web/prisma/migrations/NNNN_add_analysis_alert_rule`
- `apps/web/src/lib/analysis/analysis-alert.service.ts`
  - CRUD + lazy evaluation service.
- `apps/web/src/app/api/analysis-alerts/route.ts`
  - GET (list) + POST (create).
- `apps/web/src/app/api/analysis-alerts/[id]/route.ts`
  - PATCH (update) + DELETE.
- `apps/web/src/components/analysis/AlertRuleModal.tsx`
  - Modal de configuracao de alerta.
- `apps/web/src/hooks/useAlertRules.ts`
  - Hook para consumir API de alertas.
- `apps/web/src/test/lib/analysis/analysis-alert.service.test.ts`
- `apps/web/src/test/api/analysis-alerts.test.ts`
- `apps/web/src/test/components/AlertRuleModal.test.tsx`

### Modify

- `apps/web/prisma/schema.prisma`
  - Adicionar modelo `AnalysisAlertRule`.
- `apps/web/src/app/(app)/wishlist/page.tsx`
  - Adicionar colunas de score, ultimo fundamento, chips de alerta.
- `apps/web/src/lib/analysis/asset-analysis-score.ts`
  - Exportar funcao helper para extrair metrica por nome.

---

## Task 1: Database Migration

**Files:**
- Modify: `apps/web/prisma/schema.prisma`

- [ ] **Step 1: Add model**

```prisma
model AnalysisAlertRule {
  id           String         @id @default(uuid())
  user_id      String
  ticker       String
  metric       String
  condition    AlertCondition
  target_value Decimal        @db.Decimal(18, 4)
  is_active    Boolean        @default(true)
  triggered_at DateTime?
  created_at   DateTime       @default(now())
  user         User           @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
  @@map("analysis_alert_rules")
}
```

- [ ] **Step 2: Reuse existing AlertCondition enum**

```prisma
enum AlertCondition {
  ABOVE
  BELOW
}
```

- [ ] **Step 3: Run migration**

```bash
cd apps/web
npx prisma migrate dev --name add_analysis_alert_rule
```

Expected: migration applied, client generated.

- [ ] **Step 4: Commit**

```bash
git add apps/web/prisma
git commit -m "feat(web): add AnalysisAlertRule model"
```

---

## Task 2: Alert Service

**Files:**
- Create: `apps/web/src/lib/analysis/analysis-alert.service.ts`
- Create: `apps/web/src/test/lib/analysis/analysis-alert.service.test.ts`

- [ ] **Step 1: Write tests**

```ts
// createAlert creates alert with valid params
// createAlert rejects invalid metric
// listAlerts returns only user's alerts
// evaluateAlert triggers when condition is met
// evaluateAlert does not trigger when is_active=false
// evaluateAlert resets when is_active toggled back on
```

- [ ] **Step 2: Implement service**

Public API:

```ts
export async function createAlert(params: CreateAlertParams): Promise<AnalysisAlertRule>
export async function listAlerts(userId: string, ticker?: string): Promise<AnalysisAlertRule[]>
export async function updateAlert(id: string, userId: string, params: UpdateAlertParams): Promise<AnalysisAlertRule>
export async function deleteAlert(id: string, userId: string): Promise<void>
export async function evaluateAlert(alert: AnalysisAlertRule): Promise<boolean>
```

Evaluation logic:
- Fetch `getAssetAnalysis(ticker)` to get current metric value.
- Compare with `target_value` using `Decimal.js`.
- If condition met AND `is_active` AND `triggered_at` is null: set `triggered_at = now()`.
- If condition not met AND `triggered_at` is set: clear `triggered_at`.
- Return whether triggered.

Valid metrics: `dy`, `pe`, `pb`, `roe`, `score`, `stale`.

- [ ] **Step 3: Run tests**

```bash
pnpm --filter web test -- analysis-alert.service.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/analysis/analysis-alert.service.ts apps/web/src/test/lib/analysis
git commit -m "feat(web): add analysis alert service with lazy evaluation"
```

---

## Task 3: Alert API

**Files:**
- Create: `apps/web/src/app/api/analysis-alerts/route.ts`
- Create: `apps/web/src/app/api/analysis-alerts/[id]/route.ts`
- Create: `apps/web/src/test/api/analysis-alerts.test.ts`

- [ ] **Step 1: Write tests**

```ts
// POST /api/analysis-alerts creates alert
// POST with invalid metric returns 400
// GET /api/analysis-alerts returns user alerts
// GET evaluates lazy triggers before returning
// PATCH /api/analysis-alerts/[id] updates alert
// PATCH for another user returns 404
// DELETE removes alert
```

- [ ] **Step 2: Implement routes**

All routes require authentication via existing `getUserFromToken`.
User ID extracted from JWT session.

- [ ] **Step 3: Run tests**

```bash
pnpm --filter web test -- analysis-alerts.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/api/analysis-alerts apps/web/src/test/api/analysis-alerts.test.ts
git commit -m "feat(web): add analysis alerts CRUD API"
```

---

## Task 4: Alert Rule Modal & Hook

**Files:**
- Create: `apps/web/src/components/analysis/AlertRuleModal.tsx`
- Create: `apps/web/src/hooks/useAlertRules.ts`
- Create: `apps/web/src/test/components/AlertRuleModal.test.tsx`

- [ ] **Step 1: Create hook**

```ts
export function useAlertRules(ticker?: string) {
  // returns { alerts, createAlert, updateAlert, deleteAlert, isLoading }
  // fetches GET /api/analysis-alerts
  // auto-evaluates on fetch
}
```

- [ ] **Step 2: Create modal**

Required UI:
- Select de metrica: DY, P/L, P/VP, ROE, Score, Stale.
- Select de condicao: Acima de, Abaixo de (esconde para stale).
- Input de valor alvo (esconde para stale — nao tem target).
- Botao Salvar / Cancelar.
- Validacao: target_value > 0.
- Loading state no submit.
- Feedback de sucesso/erro.

- [ ] **Step 3: Run tests**

```bash
pnpm --filter web test -- AlertRuleModal.test.tsx
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/analysis/AlertRuleModal.tsx apps/web/src/hooks apps/web/src/test/components/AlertRuleModal.test.tsx
git commit -m "feat(web): add alert rule modal and hook"
```

---

## Task 5: Updated Wishlist Page

**Files:**
- Modify: `apps/web/src/app/(app)/wishlist/page.tsx`

- [ ] **Step 1: Add score column**

- Fetch `getAssetAnalysis` for each watched ticker (debounced/batched).
- Display score number with color coding.
- Show "—" when fetch fails or no data.

- [ ] **Step 2: Add "last fundamental" column**

- For tickers with active alerts, show the current metric value.
- Example: if alert is on DY=6, show "DY: 8.5%".

- [ ] **Step 3: Add alert chips**

- Show `<Chip>` component with "Alerta ativo" for tickers with `is_active` alerts.
- Show "Disparado" in amber for tickers with `triggered_at` set.

- [ ] **Step 4: Add "Criar alerta" button**

- Opens `AlertRuleModal` pre-filled with ticker.
- After creation, refresh alerts list.

- [ ] **Step 5: Run build**

```bash
pnpm --filter web build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/(app)/wishlist
git commit -m "feat(web): enrich wishlist with scores, fundamentals and alerts"
```

---

## Task 6: Integration Verification

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

- [ ] **Step 3: Manual smoke test**

```bash
pnpm --filter web dev
```

Visit `/wishlist` with authenticated user that has watches. Verify: score column renders, alert creation modal works, chips appear.

## Risk Controls

- [ ] Alerta de outro usuario retorna 404 (RN-11).
- [ ] Numeros usam Decimal.js, nunca float.
- [ ] Avaliacao lazy nao faz request extra se todos os alertas estiverem inativos.
- [ ] Modal de alerta valida target_value > 0.
- [ ] Triggered_at nao e atualizado se alerta estiver inativo.

## Self-Review

- Cobertura: migration, service, API, hook, modal, wishlist — todos com tasks.
- Isolamento: CRUD filtra por user_id.
- Lazy evaluation segue mesmo padrao do ADR-0010 (price alerts).
