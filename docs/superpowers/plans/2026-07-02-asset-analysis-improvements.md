# Asset Analysis Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Melhorar as analises de ativos no Databolsa para que usuarios consigam avaliar ativos da carteira e ativos pesquisados com indicadores, comparacoes, alertas analiticos e filtros inspirados em Investidor10 e Status Invest.

**Architecture:** A implementacao deve criar uma camada reutilizavel de analise (`asset-analysis`) acima dos servicos existentes de cotacao, fundamentos, dividendos, historico e carteira. A pagina publica `/ativos/[ticker]`, o screener publico e a carteira devem consumir o mesmo contrato de analise, evitando logica duplicada em componentes React.

**Tech Stack:** Next.js App Router, TypeScript, Prisma, Decimal.js, Vitest, MSW, React Query, Tailwind, design tokens de `@databolsa/ui`.

---

## Scope Check

Este escopo cruza tres experiencias: pagina publica do ativo, screener/pesquisa e carteira. Para manter entregas pequenas, a execucao deve ser feita em quatro incrementos testaveis:

1. Base de analise e score reutilizavel.
2. Pagina publica do ativo enriquecida.
3. Screener fundamentalista publico.
4. Diagnostico personalizado da carteira.

Cada incremento deve compilar, passar testes e poder ser entregue separadamente.

## Required Repo Workflow

- [ ] **Step 1: Arquiteto**

  O agente `arquiteto` deve ler este plano, `AGENTS.md`, `docs/specs/finalizadas/0013-asset-analysis-page.json`, `docs/adr/0005-fundamentals-data-source-and-cache.md`, `apps/web/src/lib/fundamentals/*`, `apps/web/src/app/(public)/ativos/[ticker]/page.tsx`, `apps/web/src/components/tools/ScreenerAvaliador.tsx` e `apps/web/src/app/(app)/portfolio/page.tsx`.

  Entrega esperada:

  ```text
  docs/adr/0016-asset-analysis-score-and-screener.md
  docs/specs/pendentes/0044-asset-analysis-improvements.json
  ```

  A ADR deve decidir:

  ```text
  - contrato canonico de AssetAnalysis
  - pesos de score por classe de ativo
  - quais dados ficam em cache
  - quais campos sao derivados em runtime
  - como tratar dados ausentes sem recomendacao financeira
  ```

- [ ] **Step 2: Implementador**

  O agente `implementador` deve executar este plano depois da ADR/spec do `arquiteto`. Ele nao deve redesenhar o escopo. Ajustes tecnicos pequenos sao permitidos se documentados no resumo final.

## File Structure

### Create

- `apps/web/src/lib/analysis/asset-analysis.types.ts`
  - Tipos publicos de analise, scores, alertas, pares e categorias.
- `apps/web/src/lib/analysis/asset-analysis-score.ts`
  - Funcoes puras para calcular scores com `Decimal.js`.
- `apps/web/src/lib/analysis/asset-analysis.service.ts`
  - Orquestra fundamentos, cotacao, setor, dividendos, historico e pares.
- `apps/web/src/app/api/market/[ticker]/analysis/route.ts`
  - Endpoint publico para analise de um ticker.
- `apps/web/src/app/api/market/screener/route.ts`
  - Endpoint publico para filtros de ativos por fundamentos e score.
- `apps/web/src/components/market/AnalysisSummary.tsx`
  - Resumo executivo do ativo.
- `apps/web/src/components/market/IndicatorCategoryGrid.tsx`
  - Indicadores agrupados por valuation, rentabilidade, dividendos, risco e liquidez.
- `apps/web/src/components/market/PeerComparisonTable.tsx`
  - Comparacao com pares do mesmo setor/classe.
- `apps/web/src/components/market/DividendAnalysisPanel.tsx`
  - Leitura de dividendos anual, ultimos pagamentos e yield.
- `apps/web/src/components/tools/FundamentalScreener.tsx`
  - Novo screener com filtros, presets e ordenacao.
- `apps/web/src/components/portfolio/PortfolioDiagnostics.tsx`
  - Diagnostico personalizado da carteira.
- `apps/web/src/test/lib/analysis/asset-analysis-score.test.ts`
- `apps/web/src/test/lib/analysis/asset-analysis.service.test.ts`
- `apps/web/src/test/api/market-analysis.test.ts`
- `apps/web/src/test/api/market-screener.test.ts`
- `apps/web/src/test/components/market/AnalysisSummary.test.tsx`
- `apps/web/src/test/components/tools/FundamentalScreener.test.tsx`
- `apps/web/src/test/components/portfolio/PortfolioDiagnostics.test.tsx`

### Modify

- `apps/web/src/app/(public)/ativos/[ticker]/page.tsx`
  - Consumir `getAssetAnalysis` e renderizar novos blocos.
- `apps/web/src/components/market/IndicatorGrid.tsx`
  - Manter compatibilidade ou migrar para `IndicatorCategoryGrid`.
- `apps/web/src/components/tools/ScreenerAvaliador.tsx`
  - Substituir a tabela simples por `FundamentalScreener` ou virar wrapper.
- `apps/web/src/app/(app)/portfolio/page.tsx`
  - Adicionar aba `diagnostico`.
- `apps/web/src/lib/query-keys.ts`
  - Adicionar chaves de analysis/screener se forem consumidas no client.
- `apps/web/src/types/api.ts`
  - Exportar DTOs novos se o padrao local exigir.

## Task 1: Define Analysis Contract

**Files:**
- Create: `apps/web/src/lib/analysis/asset-analysis.types.ts`
- Test: `apps/web/src/test/lib/analysis/asset-analysis-score.test.ts`

- [ ] **Step 1: Create type contract**

  Add:

  ```ts
  import type { AssetClass } from '@/types/api';
  import type { NormalizedFundamentals } from '@/lib/fundamentals/fundamentals-adapter.interface';

  export type AnalysisSignalLevel = 'positive' | 'neutral' | 'warning' | 'negative' | 'unknown';
  export type AnalysisCategory = 'valuation' | 'quality' | 'dividends' | 'risk' | 'momentum' | 'data';

  export interface AnalysisScoreBreakdown {
    category: AnalysisCategory;
    score: string;
    level: AnalysisSignalLevel;
    reasons: string[];
  }

  export interface AnalysisAlert {
    id: string;
    level: Exclude<AnalysisSignalLevel, 'positive' | 'neutral'>;
    title: string;
    description: string;
  }

  export interface PeerComparisonItem {
    ticker: string;
    name?: string | null;
    sector?: string | null;
    industry?: string | null;
    indicators: Pick<NormalizedFundamentals, 'pe' | 'pb' | 'dy' | 'roe' | 'netMargin' | 'dailyLiquidity'>;
    score: string;
  }

  export interface AssetAnalysis {
    ticker: string;
    name: string;
    assetClass: AssetClass;
    sector?: string | null;
    industry?: string | null;
    asOf: string;
    stale: boolean;
    fundamentals: NormalizedFundamentals;
    totalScore: string;
    scoreLevel: AnalysisSignalLevel;
    breakdown: AnalysisScoreBreakdown[];
    alerts: AnalysisAlert[];
    peers: PeerComparisonItem[];
  }
  ```

- [ ] **Step 2: Run typecheck expectation**

  Run:

  ```bash
  pnpm --filter web exec tsc --noEmit
  ```

  Expected: may fail because no implementation imports the new types yet, but the new file itself must not contain syntax errors.

## Task 2: Implement Pure Score Engine

**Files:**
- Create: `apps/web/src/lib/analysis/asset-analysis-score.ts`
- Test: `apps/web/src/test/lib/analysis/asset-analysis-score.test.ts`

- [ ] **Step 1: Write failing tests**

  Cover these cases:

  ```ts
  import { describe, expect, it } from 'vitest';
  import { calculateAssetAnalysisScore } from '@/lib/analysis/asset-analysis-score';
  import { EMPTY_FUNDAMENTALS } from '@/lib/fundamentals/fundamentals-adapter.interface';

  describe('calculateAssetAnalysisScore', () => {
    it('scores a profitable dividend stock with positive signals', () => {
      const result = calculateAssetAnalysisScore('STOCK_BR', {
        ...EMPTY_FUNDAMENTALS,
        pe: '8',
        pb: '1.1',
        dy: '7',
        roe: '18',
        netMargin: '15',
        debtToEquity: '0.6',
      });

      expect(Number(result.totalScore)).toBeGreaterThanOrEqual(70);
      expect(result.scoreLevel).toBe('positive');
      expect(result.alerts).toEqual([]);
    });

    it('does not create NaN when all indicators are missing', () => {
      const result = calculateAssetAnalysisScore('STOCK_BR', EMPTY_FUNDAMENTALS);

      expect(result.totalScore).toBe('0');
      expect(result.scoreLevel).toBe('unknown');
      expect(result.breakdown.every((item) => item.score !== 'NaN')).toBe(true);
      expect(result.alerts.some((alert) => alert.id === 'missing-fundamentals')).toBe(true);
    });

    it('uses crypto-specific indicators instead of stock valuation', () => {
      const result = calculateAssetAnalysisScore('CRYPTO', {
        ...EMPTY_FUNDAMENTALS,
        marketCap: '1000000000000',
        volume24h: '50000000000',
        change7d: '4',
        change30d: '12',
      });

      expect(result.breakdown.map((item) => item.category)).toContain('momentum');
      expect(result.breakdown.map((item) => item.category)).not.toContain('dividends');
    });
  });
  ```

- [ ] **Step 2: Run failing test**

  Run:

  ```bash
  pnpm --filter web test -- asset-analysis-score.test.ts
  ```

  Expected: FAIL because `asset-analysis-score.ts` does not exist.

- [ ] **Step 3: Implement score engine**

  Requirements:

  ```text
  - Use Decimal.js for every numeric comparison.
  - Never use JavaScript float math for financial values.
  - Return strings for scores.
  - Clamp category scores between 0 and 100.
  - Use 'unknown' when no meaningful indicators exist.
  - Generate warning alerts for missing data and extreme risk.
  ```

  Core thresholds:

  ```text
  STOCK_BR/STOCK_US/BDR:
  - valuation positive: pe between 1 and 12, pb <= 2.5
  - quality positive: roe >= 12, netMargin >= 8
  - dividends positive: dy between 3 and 12
  - risk warning: debtToEquity > 2

  FII:
  - valuation positive: pb between 0.75 and 1.05
  - dividends positive: dy between 6 and 14
  - liquidity positive: dailyLiquidity > 1000000
  - risk warning: vacancyRate > 15

  ETF:
  - cost positive: adminFee <= 0.5
  - liquidity positive: dailyLiquidity > 1000000

  CRYPTO:
  - liquidity positive: volume24h > 100000000
  - momentum positive: change7d and change30d positive
  - risk warning: marketCap missing or volume24h missing
  ```

- [ ] **Step 4: Run tests**

  Run:

  ```bash
  pnpm --filter web test -- asset-analysis-score.test.ts
  ```

  Expected: PASS.

- [ ] **Step 5: Commit**

  ```bash
  git add apps/web/src/lib/analysis apps/web/src/test/lib/analysis/asset-analysis-score.test.ts
  git commit -m "feat(web): add asset analysis score engine"
  ```

## Task 3: Build Asset Analysis Service

**Files:**
- Create: `apps/web/src/lib/analysis/asset-analysis.service.ts`
- Test: `apps/web/src/test/lib/analysis/asset-analysis.service.test.ts`

- [ ] **Step 1: Write service tests**

  Test expectations:

  ```text
  - calls getFundamentals(ticker, classHint)
  - includes sector and related tickers from sector-data
  - calculates score using calculateAssetAnalysisScore
  - returns stale=true when fundamentals are stale
  - returns empty peers when related tickers fail
  ```

- [ ] **Step 2: Implement service**

  Public API:

  ```ts
  export async function getAssetAnalysis(
    ticker: string,
    assetClassHint?: AssetClass,
  ): Promise<AssetAnalysis>
  ```

  Implementation notes:

  ```text
  - Reuse getFundamentals from fundamentals.service.ts.
  - Reuse getSectorInfo and getRelatedTickers from sector-data.ts.
  - Fetch peer fundamentals with Promise.allSettled.
  - Limit peers to 5 to protect external APIs.
  - Do not query user tables in this service.
  ```

- [ ] **Step 3: Run tests**

  Run:

  ```bash
  pnpm --filter web test -- asset-analysis.service.test.ts
  ```

  Expected: PASS.

- [ ] **Step 4: Commit**

  ```bash
  git add apps/web/src/lib/analysis apps/web/src/test/lib/analysis/asset-analysis.service.test.ts
  git commit -m "feat(web): add asset analysis service"
  ```

## Task 4: Expose Public Analysis API

**Files:**
- Create: `apps/web/src/app/api/market/[ticker]/analysis/route.ts`
- Test: `apps/web/src/test/api/market-analysis.test.ts`

- [ ] **Step 1: Write route tests**

  Cover:

  ```text
  GET /api/market/PETR4/analysis returns ticker, score, breakdown and alerts.
  Invalid ticker returns 404 or error envelope consistent with existing API helpers.
  Query ?class=FII passes class hint to service.
  ```

- [ ] **Step 2: Implement route**

  Route behavior:

  ```text
  - Validate ticker with isValidTicker.
  - Read optional searchParam class.
  - Call getAssetAnalysis.
  - Return JSON.
  - On invalid ticker, return 404.
  - On unexpected error, return existing API error envelope pattern.
  ```

- [ ] **Step 3: Run tests**

  Run:

  ```bash
  pnpm --filter web test -- market-analysis.test.ts
  ```

  Expected: PASS.

- [ ] **Step 4: Commit**

  ```bash
  git add apps/web/src/app/api/market/[ticker]/analysis apps/web/src/test/api/market-analysis.test.ts
  git commit -m "feat(web): expose asset analysis api"
  ```

## Task 5: Enrich Public Asset Page

**Files:**
- Create: `apps/web/src/components/market/AnalysisSummary.tsx`
- Create: `apps/web/src/components/market/IndicatorCategoryGrid.tsx`
- Create: `apps/web/src/components/market/PeerComparisonTable.tsx`
- Create: `apps/web/src/components/market/DividendAnalysisPanel.tsx`
- Modify: `apps/web/src/app/(public)/ativos/[ticker]/page.tsx`
- Test: `apps/web/src/test/components/market/AnalysisSummary.test.tsx`

- [ ] **Step 1: Write component tests**

  Cover:

  ```text
  - AnalysisSummary renders total score and alert titles.
  - IndicatorCategoryGrid groups indicators by category.
  - PeerComparisonTable renders empty state when peers=[].
  - Components render "Dados insuficientes" instead of NaN.
  ```

- [ ] **Step 2: Implement `AnalysisSummary`**

  Required UI:

  ```text
  - Score badge: "Score 82/100", "Dados insuficientes" when unknown.
  - Three short lists: Pontos fortes, Pontos de atencao, Dados ausentes.
  - Use M3 tokens: bg-surface, border-border, text-on-surface, text-on-surface-variant.
  - No financial recommendation wording like "compre" or "venda".
  ```

- [ ] **Step 3: Implement grouped indicators and peers**

  Required behavior:

  ```text
  - Valuation: P/L, P/VP, EV/EBITDA.
  - Rentabilidade: ROE, margem liquida, EPS.
  - Dividendos: DY, ultimo dividendo.
  - Risco/liquidez: divida/PL, vacancia, liquidez diaria.
  - Hide categories with no applicable indicators.
  ```

- [ ] **Step 4: Update asset page**

  In `apps/web/src/app/(public)/ativos/[ticker]/page.tsx`:

  ```text
  - Keep AssetHeader.
  - Fetch quote, fundamentals, usdBrl and analysis in parallel when possible.
  - Render AnalysisSummary immediately below AssetHeader.
  - Replace or supplement IndicatorGrid with IndicatorCategoryGrid.
  - Render PeerComparisonTable after setor/ativos relacionados.
  - Render DividendAnalysisPanel before DividendsTable when dividends exist.
  ```

- [ ] **Step 5: Run tests**

  Run:

  ```bash
  pnpm --filter web test -- AnalysisSummary.test.tsx
  ```

  Expected: PASS.

- [ ] **Step 6: Commit**

  ```bash
  git add apps/web/src/components/market apps/web/src/app/(public)/ativos/[ticker]/page.tsx apps/web/src/test/components/market
  git commit -m "feat(web): enrich public asset analysis page"
  ```

## Task 6: Add Fundamental Screener API

**Files:**
- Create: `apps/web/src/app/api/market/screener/route.ts`
- Test: `apps/web/src/test/api/market-screener.test.ts`

- [ ] **Step 1: Write route tests**

  Cover query examples:

  ```text
  /api/market/screener?class=STOCK_BR&preset=dividends
  /api/market/screener?class=FII&minDy=8&maxPb=1.1
  /api/market/screener?class=STOCK_BR&minRoe=12&sort=score
  ```

- [ ] **Step 2: Implement route**

  Required filters:

  ```text
  - class
  - sector
  - minDy
  - maxPe
  - maxPb
  - minRoe
  - minLiquidity
  - preset: dividends | graham | quality | low-debt | liquidity
  - sort: score | dy | roe | liquidity | change
  - limit default 30, max 100
  ```

  Data source strategy:

  ```text
  - Start from curated lists already present in apps/web/src/lib/market/curated-lists.ts.
  - For each candidate, call getAssetAnalysis with Promise.allSettled.
  - Apply filters after normalization.
  - Return partial results when some candidates fail.
  - Include stale/asOf in response.
  ```

- [ ] **Step 3: Run tests**

  Run:

  ```bash
  pnpm --filter web test -- market-screener.test.ts
  ```

  Expected: PASS.

- [ ] **Step 4: Commit**

  ```bash
  git add apps/web/src/app/api/market/screener apps/web/src/test/api/market-screener.test.ts
  git commit -m "feat(web): add fundamental screener api"
  ```

## Task 7: Replace Screener UI

**Files:**
- Create: `apps/web/src/components/tools/FundamentalScreener.tsx`
- Modify: `apps/web/src/components/tools/ScreenerAvaliador.tsx`
- Test: `apps/web/src/test/components/tools/FundamentalScreener.test.tsx`

- [ ] **Step 1: Write UI tests**

  Cover:

  ```text
  - renders class tabs.
  - selecting "Dividendos" preset calls API with preset=dividends.
  - renders score, DY, P/L, P/VP, ROE and liquidity columns.
  - "Abrir analise" links to /ativos/[ticker]?class=...
  ```

- [ ] **Step 2: Implement UI**

  Required controls:

  ```text
  - Class segmented control: Acoes, FIIs, ETFs, BDRs, Stocks, Cripto.
  - Preset chips: Dividendos, Graham, Qualidade, Baixa divida, Liquidez.
  - Numeric filters with compact inputs.
  - Sort select.
  - Result table with stable columns and no layout shift.
  ```

- [ ] **Step 3: Wire existing wrapper**

  `ScreenerAvaliador.tsx` should default-export `FundamentalScreener` or render it while keeping backwards-compatible import paths.

- [ ] **Step 4: Run tests**

  Run:

  ```bash
  pnpm --filter web test -- FundamentalScreener.test.tsx
  ```

  Expected: PASS.

- [ ] **Step 5: Commit**

  ```bash
  git add apps/web/src/components/tools apps/web/src/test/components/tools/FundamentalScreener.test.tsx
  git commit -m "feat(web): add fundamental screener ui"
  ```

## Task 8: Add Portfolio Diagnostics

**Files:**
- Create: `apps/web/src/components/portfolio/PortfolioDiagnostics.tsx`
- Modify: `apps/web/src/app/(app)/portfolio/page.tsx`
- Test: `apps/web/src/test/components/portfolio/PortfolioDiagnostics.test.tsx`

- [ ] **Step 1: Write tests**

  Cover:

  ```text
  - flags concentration when allocation is above 25%.
  - flags stale quote when position.is_stale is true.
  - shows yield on cost and total return.
  - links each position to /ativos/[ticker].
  - never leaks another user's data; component only receives already-authorized positions.
  ```

- [ ] **Step 2: Implement diagnostics component**

  Required sections:

  ```text
  - Resumo: quantidade de alertas, score medio disponivel, posicoes sem dados.
  - Alertas por ativo: concentracao, cotacao stale, prejuizo relevante, DY extremo, setor concentrado.
  - Ranking interno: maior retorno, maior perda, maior peso, maior yield on cost.
  - CTA por ativo: abrir analise publica.
  ```

- [ ] **Step 3: Add portfolio tab**

  In `apps/web/src/app/(app)/portfolio/page.tsx`, add tab:

  ```ts
  { id: 'diagnostico', label: 'Diagnostico' }
  ```

  Render:

  ```tsx
  {activeTab === 'diagnostico' && (
    <PortfolioDiagnostics summary={summary} assets={assets} />
  )}
  ```

- [ ] **Step 4: Run tests**

  Run:

  ```bash
  pnpm --filter web test -- PortfolioDiagnostics.test.tsx
  ```

  Expected: PASS.

- [ ] **Step 5: Commit**

  ```bash
  git add apps/web/src/components/portfolio/PortfolioDiagnostics.tsx apps/web/src/app/(app)/portfolio/page.tsx apps/web/src/test/components/portfolio/PortfolioDiagnostics.test.tsx
  git commit -m "feat(web): add portfolio diagnostics"
  ```

## Task 9: Integration Verification

**Files:**
- Modify only if tests reveal defects.

- [ ] **Step 1: Run focused web tests**

  Run:

  ```bash
  pnpm --filter web test -- analysis market-analysis market-screener FundamentalScreener PortfolioDiagnostics
  ```

  Expected: PASS.

- [ ] **Step 2: Run web test suite**

  Run:

  ```bash
  pnpm --filter web test
  ```

  Expected: PASS.

- [ ] **Step 3: Run build**

  Run:

  ```bash
  pnpm --filter web build
  ```

  Expected: PASS. This also builds `@databolsa/core` and runs `prisma generate` per project scripts.

- [ ] **Step 4: Manual smoke test**

  Run:

  ```bash
  pnpm --filter web dev
  ```

  Visit:

  ```text
  http://localhost:3000/ativos/PETR4
  http://localhost:3000/ferramentas/screener
  http://localhost:3000/portfolio?tab=diagnostico
  ```

  Expected:

  ```text
  - PETR4 page renders score, grouped indicators, peers, price history and dividends.
  - Screener filters do not crash when external data is partially unavailable.
  - Portfolio diagnostics renders only authenticated user's positions.
  ```

## Risk Controls

- [ ] Do not scrape Investidor10 or Status Invest.
- [ ] Do not call user portfolio tables from public `/api/market/*` routes.
- [ ] Keep all monetary and quantity calculations in `Decimal.js`.
- [ ] Mock external APIs in tests.
- [ ] Treat high DY as an attention signal, not automatically positive.
- [ ] Avoid text that sounds like financial advice: use "pontos de atencao", "sinais", "dados disponiveis".
- [ ] Keep old token names out of new UI: do not use `text-content`, `text-content-muted`, `text-content-subtle`.

## Self-Review

- [ ] Spec coverage: public asset page, screener and portfolio diagnostics are each mapped to tasks.
- [ ] Placeholder scan: no task contains unresolved TBD/TODO language.
- [ ] Type consistency: all service and component tasks use `AssetAnalysis`, `AnalysisScoreBreakdown`, `AnalysisAlert` and existing `NormalizedFundamentals`.
- [ ] Repo rules: package manager remains pnpm for `apps/web`; no pnpm commands are used in `packages/core`.

