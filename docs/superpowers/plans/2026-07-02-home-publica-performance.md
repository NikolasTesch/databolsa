# Home Publica Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduzir travadas perceptiveis na home publica e em rotas publicas de mercado, diminuindo JavaScript inicial, hidratacao desnecessaria e renderizacao dinamica sem cache.

**Architecture:** A home deve renderizar conteudo critico no servidor e carregar interatividade abaixo da dobra em ilhas client-side sob demanda. Dados de mercado publicos devem usar cache/revalidate curto em vez de `force-dynamic`, preservando frescor razoavel sem recalcular tudo a cada request.

**Tech Stack:** Next.js App Router 14, React 18, TanStack Query, Tailwind, Prisma, pnpm workspace.

---

## File Structure

- Modify: `apps/web/src/app/(public)/page.tsx`
  - Responsavel por orquestrar a home e decidir quais blocos entram no bundle inicial.
- Create: `apps/web/src/app/(public)/home-lazy-sections.tsx`
  - Client component com imports dinamicos para secoes abaixo da dobra.
- Create: `apps/web/src/components/widgets/HighlightsSectionServer.tsx`
  - Server component que busca a aba inicial de destaques sem fetch no navegador.
- Modify: `apps/web/src/components/widgets/HighlightsSection.tsx`
  - Fica responsavel apenas pela interacao de abas client-side, recebendo dados iniciais do server.
- Modify: `apps/web/src/components/layout/RevealOnScroll.tsx`
  - Reduz trabalho de animacao e usa margem mais conservadora para evitar muitos updates.
- Modify: public market route files:
  - `apps/web/src/app/(public)/page.tsx`
  - `apps/web/src/app/(public)/ativos/page.tsx`
  - `apps/web/src/app/(public)/ativos/[ticker]/page.tsx`
  - `apps/web/src/app/(public)/mercado/cripto/page.tsx`
  - `apps/web/src/app/(public)/mercados/page.tsx`
  - `apps/web/src/app/(public)/cripto/page.tsx`
  - `apps/web/src/app/(public)/dividendos/page.tsx`
  - `apps/web/src/app/(public)/proventos/agenda/page.tsx`
- Modify: `apps/web/src/app/layout.tsx`
  - Reduz custo da fonte Material Symbols, se a medicao mostrar impacto relevante.
- Verify only: `apps/web/next.config.mjs`
  - Ja possui `experimental.optimizePackageImports`.

---

## Prerequisite: Fix Local Verification Environment

The previous verification was blocked because `apps/web/node_modules/next/dist/bin/next` and `@prisma/client` were not resolvable. Before implementation, restore dependency links.

- [ ] **Step 1: Reinstall workspace dependencies using the correct package manager**

Run from repo root:

```powershell
pnpm install
```

Expected:

```text
Done
```

- [ ] **Step 2: Verify Next CLI resolves**

Run:

```powershell
Test-Path 'apps/web/node_modules/next/dist/bin/next'
```

Expected:

```text
True
```

- [ ] **Step 3: Verify Prisma client resolves**

Run:

```powershell
Test-Path 'apps/web/node_modules/@prisma/client/index.d.ts'
```

Expected:

```text
True
```

- [ ] **Step 4: Establish baseline build output**

Run:

```powershell
pnpm --filter web run build
```

Expected:

```text
✓ Compiled successfully
```

Record the `First Load JS` values for `/`, `/ferramentas`, `/ativos`, and `/mercado/cripto`.

---

## Task 1: Lazy-Load Below-The-Fold Home Sections

**Files:**
- Create: `apps/web/src/app/(public)/home-lazy-sections.tsx`
- Modify: `apps/web/src/app/(public)/page.tsx`

- [ ] **Step 1: Create dynamic home section loader**

Create `apps/web/src/app/(public)/home-lazy-sections.tsx`:

```tsx
'use client';

import dynamic from 'next/dynamic';

const SectionSkeleton = ({ height = 'h-64' }: { height?: string }) => (
  <div className={`${height} mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop`}>
    <div className="h-full rounded-lg bg-surface-muted/40 animate-pulse" />
  </div>
);

export const LazyInvestorProfileQuiz = dynamic(
  () => import('@/components/widgets/InvestorProfileQuiz'),
  {
    loading: () => <SectionSkeleton height="h-80" />,
    ssr: false,
  },
);

export const LazyGlossarySection = dynamic(
  () => import('@/components/widgets/GlossarySection'),
  {
    loading: () => <SectionSkeleton height="h-72" />,
    ssr: false,
  },
);
```

- [ ] **Step 2: Replace direct imports in the home**

In `apps/web/src/app/(public)/page.tsx`, remove:

```tsx
import InvestorProfileQuiz from '@/components/widgets/InvestorProfileQuiz';
import GlossarySection from '@/components/widgets/GlossarySection';
```

Add:

```tsx
import { LazyGlossarySection, LazyInvestorProfileQuiz } from './home-lazy-sections';
```

Replace:

```tsx
<InvestorProfileQuiz />
```

with:

```tsx
<LazyInvestorProfileQuiz />
```

Replace:

```tsx
<GlossarySection />
```

with:

```tsx
<LazyGlossarySection />
```

- [ ] **Step 3: Build and compare bundle**

Run:

```powershell
pnpm --filter web run build
```

Expected:

```text
✓ Compiled successfully
```

Compare `/` `First Load JS` against the baseline. Expected result: lower initial JS for `/`, with separate chunks for lazy sections.

- [ ] **Step 4: Commit**

```powershell
git add 'apps/web/src/app/(public)/page.tsx' 'apps/web/src/app/(public)/home-lazy-sections.tsx'
git commit -m "perf(web): lazy-load home sections below fold"
```

---

## Task 2: Make Highlights Server-First

**Files:**
- Create: `apps/web/src/components/widgets/HighlightsSectionServer.tsx`
- Modify: `apps/web/src/components/widgets/HighlightsSection.tsx`
- Modify: `apps/web/src/app/(public)/page.tsx`
- Test: `apps/web/src/test/components/HighlightsSection.test.tsx`

- [ ] **Step 1: Update the client component API**

In `apps/web/src/components/widgets/HighlightsSection.tsx`, change the component signature from:

```tsx
export default function HighlightsSection() {
  const [activeTab, setActiveTab] = useState<string>('STOCK_BR');
  const [data, setData] = useState<HighlightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
```

to:

```tsx
interface HighlightsSectionProps {
  initialData: HighlightsResponse | null;
}

export default function HighlightsSection({ initialData }: HighlightsSectionProps) {
  const [activeTab, setActiveTab] = useState<string>(initialData?.type ?? 'STOCK_BR');
  const [data, setData] = useState<HighlightsResponse | null>(initialData);
  const [loading, setLoading] = useState(false);
```

- [ ] **Step 2: Prevent duplicate fetch for initial tab**

Replace the current `useEffect` in `HighlightsSection.tsx`:

```tsx
useEffect(() => {
  setLoading(true);
  fetch(`/api/market/highlights?type=${activeTab}&limit=4`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => setData(d))
    .catch(() => setData(null))
    .finally(() => setLoading(false));
}, [activeTab]);
```

with:

```tsx
useEffect(() => {
  if (data?.type === activeTab) return;

  let cancelled = false;
  setLoading(true);

  fetch(`/api/market/highlights?type=${activeTab}&limit=4`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (!cancelled) setData(d);
    })
    .catch(() => {
      if (!cancelled) setData(null);
    })
    .finally(() => {
      if (!cancelled) setLoading(false);
    });

  return () => {
    cancelled = true;
  };
}, [activeTab, data?.type]);
```

- [ ] **Step 3: Create server wrapper**

Create `apps/web/src/components/widgets/HighlightsSectionServer.tsx`:

```tsx
import HighlightsSection from './HighlightsSection';
import { fetchAssetsForClass } from '@/lib/market/highlights-data';

function sortByChangeDesc<T extends { changePercent: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => parseFloat(b.changePercent) - parseFloat(a.changePercent));
}

function sortByChangeAsc<T extends { changePercent: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => parseFloat(a.changePercent) - parseFloat(b.changePercent));
}

export default async function HighlightsSectionServer() {
  try {
    const items = await fetchAssetsForClass('STOCK_BR');
    const initialData = {
      gainers: sortByChangeDesc(items).slice(0, 4),
      losers: sortByChangeAsc(items).slice(0, 4),
      type: 'STOCK_BR',
    };

    return <HighlightsSection initialData={initialData} />;
  } catch {
    return <HighlightsSection initialData={null} />;
  }
}
```

- [ ] **Step 4: Use the server wrapper on the home**

In `apps/web/src/app/(public)/page.tsx`, replace:

```tsx
import HighlightsSection from '@/components/widgets/HighlightsSection';
```

with:

```tsx
import HighlightsSectionServer from '@/components/widgets/HighlightsSectionServer';
```

Replace:

```tsx
<HighlightsSection />
```

with:

```tsx
<HighlightsSectionServer />
```

- [ ] **Step 5: Update component test**

In `apps/web/src/test/components/HighlightsSection.test.tsx`, render the client component with initial data:

```tsx
render(
  <HighlightsSection
    initialData={{
      type: 'STOCK_BR',
      gainers: mockGainers,
      losers: mockLosers,
    }}
  />,
);
```

Add assertion that initial render does not need a loading state:

```tsx
expect(screen.getByText('Maiores Altas')).toBeInTheDocument();
expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
```

- [ ] **Step 6: Run focused test**

Run:

```powershell
pnpm --filter web test -- src/test/components/HighlightsSection.test.tsx
```

Expected:

```text
1 passed
```

- [ ] **Step 7: Build**

Run:

```powershell
pnpm --filter web run build
```

Expected:

```text
✓ Compiled successfully
```

- [ ] **Step 8: Commit**

```powershell
git add 'apps/web/src/components/widgets/HighlightsSection.tsx' 'apps/web/src/components/widgets/HighlightsSectionServer.tsx' 'apps/web/src/app/(public)/page.tsx' 'apps/web/src/test/components/HighlightsSection.test.tsx'
git commit -m "perf(web): render market highlights server-first"
```

---

## Task 3: Replace Force Dynamic With Short Revalidation

**Files:**
- Modify: `apps/web/src/app/(public)/page.tsx`
- Modify: `apps/web/src/app/(public)/ativos/page.tsx`
- Modify: `apps/web/src/app/(public)/ativos/[ticker]/page.tsx`
- Modify: `apps/web/src/app/(public)/mercado/cripto/page.tsx`
- Modify: `apps/web/src/app/(public)/mercados/page.tsx`
- Modify: `apps/web/src/app/(public)/cripto/page.tsx`
- Modify: `apps/web/src/app/(public)/dividendos/page.tsx`
- Modify: `apps/web/src/app/(public)/proventos/agenda/page.tsx`

- [ ] **Step 1: Replace home dynamic mode**

In `apps/web/src/app/(public)/page.tsx`, replace:

```tsx
export const dynamic = 'force-dynamic';
```

with:

```tsx
export const revalidate = 60;
```

- [ ] **Step 2: Replace listing routes dynamic mode**

In these files:

```text
apps/web/src/app/(public)/ativos/page.tsx
apps/web/src/app/(public)/mercado/cripto/page.tsx
apps/web/src/app/(public)/mercados/page.tsx
apps/web/src/app/(public)/cripto/page.tsx
apps/web/src/app/(public)/dividendos/page.tsx
apps/web/src/app/(public)/proventos/agenda/page.tsx
```

replace:

```tsx
export const dynamic = 'force-dynamic';
```

with:

```tsx
export const revalidate = 300;
```

- [ ] **Step 3: Replace asset detail route dynamic mode**

In `apps/web/src/app/(public)/ativos/[ticker]/page.tsx`, replace:

```tsx
export const dynamic = 'force-dynamic';
```

with:

```tsx
export const revalidate = 300;
```

- [ ] **Step 4: Verify there are no unintended public force-dynamic pages**

Run:

```powershell
rg -n "dynamic = 'force-dynamic'" apps/web/src/app/\(public\)
```

Expected: no output, unless a page reads per-request cookies or user-specific data.

- [ ] **Step 5: Build**

Run:

```powershell
pnpm --filter web run build
```

Expected:

```text
✓ Compiled successfully
```

Check the route table. Expected: public market pages should no longer all appear as fully dynamic server-rendered routes.

- [ ] **Step 6: Commit**

```powershell
git add 'apps/web/src/app/(public)'
git commit -m "perf(web): cache public market pages with revalidation"
```

---

## Task 4: Reduce RevealOnScroll Runtime Work

**Files:**
- Modify: `apps/web/src/components/layout/RevealOnScroll.tsx`

- [ ] **Step 1: Shorten transition duration and reveal earlier**

In `RevealOnScroll.tsx`, replace:

```tsx
{ rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
```

with:

```tsx
{ rootMargin: '160px 0px', threshold: 0.01 },
```

Replace:

```tsx
'motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out',
```

with:

```tsx
'motion-safe:transition-opacity motion-safe:duration-300 motion-safe:ease-out',
```

Replace:

```tsx
isVisible
  ? 'motion-safe:translate-y-0 motion-safe:opacity-100'
  : 'motion-safe:translate-y-8 motion-safe:opacity-0',
```

with:

```tsx
isVisible ? 'motion-safe:opacity-100' : 'motion-safe:opacity-0',
```

- [ ] **Step 2: Run focused layout grep**

Run:

```powershell
rg -n "translate-y-|duration-700|transition-all" apps/web/src/components/layout/RevealOnScroll.tsx
```

Expected: no output.

- [ ] **Step 3: Build**

Run:

```powershell
pnpm --filter web run build
```

Expected:

```text
✓ Compiled successfully
```

- [ ] **Step 4: Commit**

```powershell
git add apps/web/src/components/layout/RevealOnScroll.tsx
git commit -m "perf(web): reduce reveal animation work"
```

---

## Task 5: Audit Material Symbols Loading

**Files:**
- Modify: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: Check icon usage before changing font strategy**

Run:

```powershell
rg -n "material-symbols-outlined" apps/web/src
```

Expected: list all icon usages. If usage is broad, do not remove the font in this task.

- [ ] **Step 2: Add preconnects for Google font origins**

In `apps/web/src/app/layout.tsx`, inside `<head>`, before the Material Symbols stylesheet, add:

```tsx
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
```

- [ ] **Step 3: Build**

Run:

```powershell
pnpm --filter web run build
```

Expected:

```text
✓ Compiled successfully
```

- [ ] **Step 4: Commit**

```powershell
git add apps/web/src/app/layout.tsx
git commit -m "perf(web): preconnect material icon font origins"
```

---

## Task 6: Final Performance Verification

**Files:**
- Verify only.

- [ ] **Step 1: Run full web build**

Run:

```powershell
pnpm --filter web run build
```

Expected:

```text
✓ Compiled successfully
```

- [ ] **Step 2: Run web tests**

Run:

```powershell
pnpm --filter web test
```

Expected:

```text
Test Files  ... passed
Tests       ... passed
```

- [ ] **Step 3: Compare bundle metrics**

Compare build output with the baseline from the prerequisite.

Expected improvements:

```text
/              First Load JS lower than baseline
/ferramentas   First Load JS lower than pre-optimization state
```

- [ ] **Step 4: Manual smoke test**

Run:

```powershell
pnpm --filter web dev
```

Open:

```text
http://localhost:3000
http://localhost:3000/ferramentas
http://localhost:3000/ativos
http://localhost:3000/mercado/cripto
```

Expected:

```text
Home renders hero immediately.
Sections below the fold show stable skeletons before loading.
Highlights show initial STOCK_BR data without visible client loading flash.
Tools page opens without loading all tool UIs upfront.
Public market pages render successfully with cached/revalidated data.
```

- [ ] **Step 5: Final commit if verification required fixes**

```powershell
git status --short
git add apps/web
git commit -m "perf(web): finalize public page performance optimizations"
```

---

## ADR

**Decision:** Use server-first rendering for market data needed at first paint, and dynamic client islands for interactive or below-the-fold sections.

**Rationale:** The current public home combines many client components, client fetches, animations, and `force-dynamic` rendering. The highest-impact optimization is to reduce initial hydration and avoid per-request rendering for public market data that already tolerates short TTLs.

**Consequences:** Some sections load after initial paint with skeletons. Public market data may be up to 60-300 seconds old, which matches the existing quote-cache expectation and is preferable to blocking every request on fresh external data.

**Rejected Alternative:** Keeping the entire home dynamic and only tuning animations. That would leave server rendering and hydration costs largely unchanged.

---

## Self-Review

- Spec coverage: Covers lazy loading, server-first highlights, route revalidation, animation reduction, font preconnect, and verification.
- Placeholder scan: No `TBD`, `TODO`, or unspecified test command remains.
- Type consistency: `HighlightsResponse`, `HighlightItem`, `initialData`, and `Component` names match the proposed code flow.
