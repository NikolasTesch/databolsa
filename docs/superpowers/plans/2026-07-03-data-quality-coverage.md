# Data Quality & Source Coverage Implementation Plan

**Data:** 2026-07-03
**Status:** pronto para execucao
**Base:** SPEC-0045

## Goal

Criar uma camada de qualidade de dados que informa o usuario sobre a integridade, atualizacao e cobertura dos indicadores fundamentalistas. Badges visuais, tooltips e pagina de status das fontes aumentam a transparencia e a confianca na analise.

**Tech Stack:** Next.js App Router, TypeScript, Decimal.js, Vitest, Tailwind, design tokens de `@databolsa/ui`.

---

## File Structure

### Create

- `apps/web/src/lib/analysis/data-quality.ts`
  - Tipos `DataQualityReport`, `DataQualityLevel`, funcao `calculateDataQualityScore`.
- `apps/web/src/components/analysis/DataQualityBadge.tsx`
  - Badge com tooltip que mostra detalhes de cobertura.
- `apps/web/src/app/api/market/[ticker]/data-quality/route.ts`
  - Endpoint publico que retorna report sem chamadas externas.
- `apps/web/src/app/api/market/source-status/route.ts`
  - Agrega estado de todas as fontes.
- `apps/web/src/app/(public)/status-fontes/page.tsx`
  - Pagina com tabela de fontes, cobertura por classe.
- `apps/web/src/test/lib/analysis/data-quality.test.ts`
- `apps/web/src/test/api/data-quality-api.test.ts`
- `apps/web/src/test/components/DataQualityBadge.test.tsx`

### Modify

- `apps/web/src/lib/analysis/asset-analysis.types.ts`
  - Adicionar `dataQuality?: DataQualityReport` em `AssetAnalysis`.
- `apps/web/src/lib/analysis/asset-analysis.service.ts`
  - Incluir `calculateDataQualityScore` no retorno.
- `apps/web/src/components/market/IndicatorCategoryGrid.tsx`
  - Adicionar stale icon por indicador individual.
- `apps/web/src/components/market/AnalysisSummary.tsx`
  - Integrar `DataQualityBadge` no cabecalho de resumo.
- `apps/web/src/components/market/AssetHeader.tsx`
  - Integrar `DataQualityBadge` ao lado do ticker (opcional).

---

## Task 1: Data Quality Types and Engine

**Files:**
- Create: `apps/web/src/lib/analysis/data-quality.ts`
- Create: `apps/web/src/test/lib/analysis/data-quality.test.ts`

- [ ] **Step 1: Define types**

```ts
export type DataQualityLevel = 'complete' | 'partial' | 'insufficient';

export interface DataQualityReport {
  coverageScore: string; // decimal string 0..100
  level: DataQualityLevel;
  missingFields: string[];
  staleFields: string[];
  sourceWarnings: string[];
  lastUpdatedAt: string;
}
```

- [ ] **Step 2: Implement calculateDataQualityScore**

Rules:
- Conhece todos os indicadores esperados por classe (mesma lista de `IndicatorCategoryGrid`).
- `coverageScore = (filledCount / expectedCount) * 100`.
- `level = score >= 80 ? 'complete' : score >= 40 ? 'partial' : 'insufficient'`.
- `staleFields` = campos onde `fetched_at` > 24h.
- `missingFields` = campos com valor null/NaN.
- Usar `Decimal.js` para o calculo do score.

- [ ] **Step 3: Run tests**

```bash
pnpm --filter web test -- data-quality.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/analysis/data-quality.ts apps/web/src/test/lib/analysis/data-quality.test.ts
git commit -m "feat(web): add data quality types and score engine"
```

---

## Task 2: Data Quality Badge Component

**Files:**
- Create: `apps/web/src/components/analysis/DataQualityBadge.tsx`
- Create: `apps/web/src/test/components/DataQualityBadge.test.tsx`

- [ ] **Step 1: Write tests**

```ts
// renders "Dados completos" for coverageScore >= 80
// renders "Dados parciais" for coverageScore 40-79
// renders "Dados insuficientes" for coverageScore < 40
// renders tooltip with missing and stale fields on hover
```

- [ ] **Step 2: Implement UI**

```tsx
interface DataQualityBadgeProps {
  report: DataQualityReport;
}
```

Required UI:
- Badge com cor condicional: verde (complete), amarelo (partial), cinza (insufficient).
- Tooltip/hover card: "Campos ausentes: ...", "Campos desatualizados: ...", "Ultima atualizacao: ...".
- Usar M3 tokens.
- Se report vazio/undefined, renderizar null.

- [ ] **Step 3: Run tests**

```bash
pnpm --filter web test -- DataQualityBadge.test.tsx
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/analysis apps/web/src/test/components/DataQualityBadge.test.tsx
git commit -m "feat(web): add data quality badge component with tooltip"
```

---

## Task 3: API Endpoints

**Files:**
- Create: `apps/web/src/app/api/market/[ticker]/data-quality/route.ts`
- Create: `apps/web/src/app/api/market/source-status/route.ts`
- Create: `apps/web/src/test/api/data-quality-api.test.ts`

- [ ] **Step 1: Write API tests**

```ts
// GET /api/market/PETR4/data-quality returns report with coverageScore
// GET /api/market/INVALIDO/data-quality returns 404
// GET /api/market/source-status returns source list
```

- [ ] **Step 2: Implement GET /api/market/[ticker]/data-quality**

Behavior:
- Validate ticker with `isValidTicker`.
- Call `getFundamentals` to get `NormalizedFundamentals` + `asOf`.
- Call `calculateDataQualityScore`.
- Return JSON with report.
- No user table queries.
- If fundamentals fail, return 404.

- [ ] **Step 3: Implement GET /api/market/source-status**

Behavior:
- Read metadata from `curated-lists.ts`, `market-cache.ts`, `market-fetchers.ts`.
- Return list of sources with last sync time, estimated success rate, coverage by class.
- Cache response in memory for 5 minutes.

- [ ] **Step 4: Run tests**

```bash
pnpm --filter web test -- data-quality-api.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/api/market/ apps/web/src/test/api/data-quality-api.test.ts
git commit -m "feat(web): add data quality and source status APIs"
```

---

## Task 4: Stale Indicators in Category Grid

**Files:**
- Modify: `apps/web/src/components/market/IndicatorCategoryGrid.tsx`

- [ ] **Step 1: Add stale detection**

- Receive optional `staleFields?: string[]` prop.
- For each indicator, if key is in staleFields, add `schedule` icon next to value.

- [ ] **Step 2: Run existing tests**

```bash
pnpm --filter web test -- IndicatorCategoryGrid.test.tsx
```

Expected: PASS (existing tests plus new behavior).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/market/IndicatorCategoryGrid.tsx
git commit -m "feat(web): add stale indicator icon to category grid"
```

---

## Task 5: Integrate with AssetAnalysis

**Files:**
- Modify: `apps/web/src/lib/analysis/asset-analysis.types.ts`
- Modify: `apps/web/src/lib/analysis/asset-analysis.service.ts`
- Modify: `apps/web/src/components/market/AnalysisSummary.tsx`
- Modify: `apps/web/src/components/market/AssetHeader.tsx`

- [ ] **Step 1: Extend AssetAnalysis type**

```ts
export interface AssetAnalysis {
  // ... existing fields
  dataQuality?: DataQualityReport;
}
```

- [ ] **Step 2: Update service**

In `getAssetAnalysis`, call `calculateDataQualityScore(fundamentals.indicators, fundamentals.assetClass, fundamentals.asOf)` and attach to result.

- [ ] **Step 3: Integrate badges**

- `AnalysisSummary`: Add `<DataQualityBadge>` next to score badge.
- `AssetHeader`: Optionally add small badge near ticker.

- [ ] **Step 4: Run tests**

```bash
pnpm --filter web test -- asset-analysis.service.test.ts AnalysisSummary.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/analysis/ apps/web/src/components/market/
git commit -m "feat(web): integrate data quality into asset analysis"
```

---

## Task 6: Source Status Page

**Files:**
- Create: `apps/web/src/app/(public)/status-fontes/page.tsx`
- Create: `apps/web/src/test/api/source-status-page.test.tsx`

- [ ] **Step 1: Implement page**

Server component that fetches `/api/market/source-status` and renders:
- Table with columns: Fonte, Status, Ultima sync, Taxa de sucesso, Cobertura, Ativos.
- Status indicators: online (verde), offline (vermelho), degraded (amarelo).
- Responsive layout, M3 tokens.

- [ ] **Step 2: Run build**

```bash
pnpm --filter web build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/(public)/status-fontes
git commit -m "feat(web): add source status page"
```

---

## Task 7: Integration Verification

- [ ] **Step 1: Run full web test suite**

```bash
pnpm --filter web test
```

Expected: all passing.

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter web exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Update SPEC-0045**

- Mark all tasks as done.
- Set status to `implemented` or `verified`.

## Risk Controls

- [ ] `coverageScore` nunca retorna NaN ou Infinity.
- [ ] Tooltips nao quebram em mobile (touch funciona).
- [ ] Pagina de status nao expoe dados de usuario.
- [ ] Todas as cores tem descricao textual (acessibilidade).

## Self-Review

- Spec coverage: types, engine, badge, APIs, integration, status page — todos com tasks.
- Placeholder scan: nenhum TBD/TODO.
- Type consistency: `DataQualityReport`, `DataQualityLevel`, `AssetAnalysis` estendido.
- Repo rules: sem pnpm em packages/core.
