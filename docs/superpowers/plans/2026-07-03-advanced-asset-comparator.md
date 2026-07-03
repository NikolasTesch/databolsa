# Advanced Asset Comparator Implementation Plan

**Data:** 2026-07-03
**Status:** pronto para execucao
**Base:** SPEC-0046

## Goal

Criar pagina dedicada de comparacao de ate 6 ativos lado a lado com fundamentos, scores, dividendos, historico normalizado e export CSV. Reutiliza camada `AssetAnalysis` e endpoints existentes.

**Tech Stack:** Next.js App Router, TypeScript, Recharts, Decimal.js, Vitest, Tailwind, `@databolsa/ui`.

---

## File Structure

### Create

- `apps/web/src/app/api/market/compare/route.ts`
  - Batch wrapper que chama `getAssetAnalysis` em paralelo.
- `apps/web/src/components/tools/AdvancedComparator.tsx`
  - Componente principal de comparacao.
- `apps/web/src/components/tools/ComparatorPriceChart.tsx`
  - Grafico de precos normalizado (base 100).
- `apps/web/src/components/tools/ComparatorDividendsTable.tsx`
  - Tabela de dividendos comparada.
- `apps/web/src/app/(public)/ferramentas/comparador-avancado/page.tsx`
  - Pagina com layout responsivo.
- `apps/web/src/test/api/market-compare.test.ts`
- `apps/web/src/test/components/tools/AdvancedComparator.test.tsx`

### Modify

- `apps/web/src/app/(public)/ferramentas/client.tsx` (opcional — adicionar link na navegacao de ferramentas)

---

## Task 1: Compare API

**Files:**
- Create: `apps/web/src/app/api/market/compare/route.ts`
- Create: `apps/web/src/test/api/market-compare.test.ts`

- [ ] **Step 1: Write tests**

```ts
// GET /api/market/compare?tickers=PETR4,VALE3 returns 2 items
// GET /api/market/compare?tickers=PETR4,INVALIDO returns 1 item + failedTickers
// GET /api/market/compare?tickers=A,B,C,D,E,F,G returns 400 (max 6)
```

- [ ] **Step 2: Implement route**

Behavior:
- Parse `tickers` query param (comma-separated, max 6).
- Validate each ticker with `isValidTicker`.
- Call `getAssetAnalysis` for each via `Promise.allSettled`.
- Return `{ items, failedTickers, asOf }`.
- On > 6 tickers, return 400.

- [ ] **Step 3: Run tests**

```bash
pnpm --filter web test -- market-compare.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/api/market/compare apps/web/src/test/api/market-compare.test.ts
git commit -m "feat(web): add asset comparison batch API"
```

---

## Task 2: AdvancedComparator Component

**Files:**
- Create: `apps/web/src/components/tools/AdvancedComparator.tsx`
- Create: `apps/web/src/test/components/tools/AdvancedComparator.test.tsx`

- [ ] **Step 1: Write tests**

```ts
// renders empty state with search bar
// renders two columns after adding PETR4 and VALE3
// partial failure does not break UI
// different classes show common indicators
```

- [ ] **Step 2: Implement UI**

Required controls:
- Search input with debounce (300ms) for adding tickers.
- Token/chip display for selected tickers with remove button.
- Max 6 tickers enforcement.
- Column layout (responsive: scroll horizontal em mobile).

Required data sections:
- Score total e por categoria (colored bars).
- Tabela de indicadores: P/L, P/VP, DY, ROE, margem, divida/PL.
- Best indicator destacado em verde escuro, worst em vermelho escuro.
- DY acima de 15% destacado como atencao (amarelo), nao automaticamente positivo.

- [ ] **Step 3: Run tests**

```bash
pnpm --filter web test -- AdvancedComparator.test.tsx
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/tools/AdvancedComparator.tsx apps/web/src/test/components/tools
git commit -m "feat(web): add advanced comparator main view"
```

---

## Task 3: Normalized Price Chart

**Files:**
- Create: `apps/web/src/components/tools/ComparatorPriceChart.tsx`

- [ ] **Step 1: Implement chart**

Uses Recharts (already in project):
- Line chart with one series per ticker.
- Normalized to base 100 (first price = 100).
- Colors from `chartColors.categorical` palette.
- Responsive container.
- Tooltip with ticker, date, normalized value.
- Loading skeleton while fetching.

- [ ] **Step 2: Integration verification**

```bash
pnpm --filter web exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/tools/ComparatorPriceChart.tsx
git commit -m "feat(web): add normalized price comparison chart"
```

---

## Task 4: Dividend Comparison & CSV Export

**Files:**
- Create: `apps/web/src/components/tools/ComparatorDividendsTable.tsx`

- [ ] **Step 1: Implement dividend table**

- Columns: Ativo, DY, Ultimo provento, Total no periodo, Eventos.
- Row per asset.
- DY destacado: verde (3-12%), amarelo (>12% atencao), cinza (sem dados).

- [ ] **Step 2: Implement CSV export**

- Button "Exportar CSV" gera Blob e trigger de download.
- CSV columns: Ativo, Score, P/L, P/VP, DY, ROE, Margem, Divida/PL, DY, Ultimo provento.
- Separador: ponto e virgula (compativel Excel pt-BR).

- [ ] **Step 3: Run build**

```bash
pnpm --filter web build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/tools/ComparatorDividendsTable.tsx
git commit -m "feat(web): add dividend comparison table and CSV export"
```

---

## Task 5: Comparator Page

**Files:**
- Create: `apps/web/src/app/(public)/ferramentas/comparador-avancado/page.tsx`
- Modify: `apps/web/src/app/(public)/ferramentas/client.tsx` (adicionar link)

- [ ] **Step 1: Create page**

```tsx
import type { Metadata } from 'next';
import AdvancedComparator from '@/components/tools/AdvancedComparator';

export const metadata: Metadata = {
  title: 'Comparador Avançado | DataBolsa',
  description: 'Compare até 6 ativos lado a lado com fundamentos, scores e dividendos.',
};

export default function ComparadorAvancadoPage() {
  return <AdvancedComparator />;
}
```

- [ ] **Step 2: Add navigation link**

In the tools section client component, add link to `/ferramentas/comparador-avancado`.

- [ ] **Step 3: Build**

```bash
pnpm --filter web build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/(public)/ferramentas/comparador-avancado
git commit -m "feat(web): add advanced comparator page"
```

---

## Task 6: Integration Verification

- [ ] **Step 1: Run test suite**

```bash
pnpm --filter web test
```

Expected: all passing.

- [ ] **Step 2: Update SPEC-0046**

Mark all tasks done, set status.

## Risk Controls

- [ ] Max 6 ativos — UI bloqueia adicao apos limite.
- [ ] DY alto (>15%) tratado como atencao, nao positivo.
- [ ] Toda comparacao usa Decimal.js, nunca float.
- [ ] Nenhum texto de recomendacao financeira.
- [ ] Grafico usa cores da paleta categorical (6 cores max).

## Self-Review

- Cobertura de tasks: API batch, UI, grafico, dividendos, CSV, pagina.
- Tipos consistentes com `AssetAnalysis` e `PeerComparisonItem`.
- Export CSV funcional com Excel pt-BR.
