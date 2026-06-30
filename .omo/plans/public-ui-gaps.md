# public-ui-gaps - Work Plan

## TL;DR (For humans)

**What you'll get:** Toda a navegação da página inicial concertada — header section links e footer passam a funcionar de verdade. Altas/Baixas e Cripto mostram dados reais da API (não mais placeholders). Dividendos ganham agenda real com dados da Brapi. Cards de ativos e cripto passam a clicar e levar à página do ativo. Páginas que hoje dão 404 (/ativos, /proventos/agenda, /termos etc.) passam a existir.

**Why this approach:** 5 fases com dependência clara — primeiro os links quebrados (todo mundo vê), depois cards clicáveis (experiência), depois dados reais (conteúdo), depois páginas novas (destino dos links), por fim polimento (loading, stale, skeletons). Cada fase é testável isoladamente.

**What it will NOT do:** Não mexe em dashboard, auth, packages/core, nem adiciona features de usuário (wishlist, favoritos). Cursos continuam com curadoria manual (proposital).

**Effort:** Large
**Risk:** Medium — a criação da agenda agregada de dividendos toca API externa (Brapi) e pode ter rate limiting; a padronização do changePercent no backend pode afetar outros consumidores da API

**Decisions to sanity-check:** Formatação do changePercent no backend (prefixo `+`); endpoint dedicado de cripto vs reaproveitar highlights; conteúdo das páginas institucionais

---

> TL;DR (machine): Large effort, Medium risk, 5 phases, ~25 files, 13 todos, new API endpoints for dividends/crypto, new pages for /ativos /proventos/agenda /mercado/cripto + 4 institucionais.

## Scope
### Must have
- Navigation section IDs work (header links scroll to correct sections)
- Footer links are real routes (no `?type=` params, no 404s)
- AssetCard / Dividends rows / Crypto cards are clickable links to `/ativos/{ticker}`
- ChangePercent consistently formatted with `+` prefix for positives
- Dividends agenda shows real data from `/api/market/dividends/agenda` (Brapi)
- Crypto section shows real data from `/api/market/crypto/overview`
- Pages: `/ativos`, `/proventos/agenda`, `/mercado/cripto`, `/termos`, `/privacidade`, `/compliance`, `/ajuda`
- Component tests for clickable cards (cursor, focus, hover)

### Must NOT have (guardrails, anti-slop, scope boundaries)
- No auth/dashboard changes
- No packages/core changes
- No design token changes
- No search/autocomplete refactoring
- Courses remain manually curated
- No user features (wishlist, favorites, portfolio)

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: TDD for new API endpoints, tests-after for component changes
- Evidence: .omo/evidence/task-<N>-public-ui-gaps.txt

## Execution strategy
### Phases
- **Phase 1 — Navigation (T1, T2):** Fix section IDs, fix footer links, create institutional pages
- **Phase 2 — Clickable cards (T3, T4, T5):** AssetCard, dividends rows, crypto cards → Links
- **Phase 3 — Real data (T6, T7, T8, T9):** Fix changePercent format, create dividends agenda API + crypto overview API, wire frontend
- **Phase 4 — New pages (T10, T11):** `/ativos` listing, `/proventos/agenda`, `/mercado/cripto`
- **Phase 5 — Quality (T12):** Tests, empty states, loading skeletons

### Dependency matrix
| Todo | Phase | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- | --- |
| T1. Section IDs + footer links | 1 | — | — | T2 |
| T2. Institutional pages (/termos, etc.) | 1 | — | — | T1 |
| T3. AssetCard → Link | 2 | — | — | T4, T5 |
| T4. Dividends rows → Link | 2 | — | — | T3, T5 |
| T5. Crypto cards → Link | 2 | — | — | T3, T4 |
| T6. Fix changePercent format | 3 | — | — | T7, T8 |
| T7. /api/market/dividends/agenda | 3 | — | T9 | T6, T8 |
| T8. /api/market/crypto/overview | 3 | — | T9 | T6, T7 |
| T9. Wire real data to frontend | 3 | T7, T8 | — | — |
| T10. /ativos listing page | 4 | T6 | — | T11 |
| T11. /proventos/agenda + /mercado/cripto pages | 4 | T7, T8 | — | T10 |
| T12. Tests + quality polish | 5 | T3, T4, T5, T7, T8, T9 | — | — |

## Todos

### Phase 1 — Navegação

- [x] 1. Adicionar section IDs e corrigir links do footer
  What to do / Must NOT do:
    1. Em `apps/web/src/app/(public)/page.tsx`, adicionar `id="mercados"` na section de Highlights (envolver o `<HighlightsSection />` ou adicionar attr no componente). Adicionar `id="dividendos"` no `<DividendsSection />`. Adicionar `id="cripto"` no `<CryptoSections />`.
    2. Em `apps/web/src/components/layout/PublicHeader.tsx`, corrigir NAV_ITEMS: `/#cursos` → `/cursos` (rota real)
    3. Em `apps/web/src/components/widgets/HighlightsSection.tsx`, adicionar `id="mercados"` na section principal (linha 86)
    4. Em `apps/web/src/components/widgets/DividendsSection.tsx`, adicionar `id="dividendos"` na section principal (linha 61)
    5. Em `apps/web/src/components/widgets/CryptoSections.tsx`, adicionar `id="cripto"` na section principal (linha 66)
    6. Em `apps/web/src/components/layout/PublicFooter.tsx`, trocar os links da coluna "Mercado" de `/?type=XXX` para `/ativos?classe=XXX` (rota que será criada na Fase 4). Usar `/ativos?classe=STOCK_BR`, `/ativos?classe=FII`, etc.
    7. Em `PublicFooter.tsx`, trocar links "Ferramentas" de genérico `/ferramentas` para âncoras específicas: `/ferramentas#conversor`, `/ferramentas#simulador`, `/ferramentas#calculadora-ir`, `/ferramentas#comparador`
    Não alterar outras seções ou estilos.
  References: page.tsx:30-75, PublicHeader.tsx:13-20, PublicFooter.tsx:4-25, HighlightsSection.tsx:86, DividendsSection.tsx:61, CryptoSections.tsx:66, B3CoursesSection.tsx:39 (exemplo de id existente)
  Acceptance criteria: `grep -c 'id="mercados"' apps/web/src/components/widgets/HighlightsSection.tsx` retorna 1. `grep -c 'id="dividendos"' apps/web/src/components/widgets/DividendsSection.tsx` retorna 1. `grep -c 'id="cripto"' apps/web/src/components/widgets/CryptoSections.tsx` retorna 1. Nenhum link no footer usa `?type=` para mercado.
  QA scenarios: happy (header links navegam para sections corretas, footer links não dão 404), failure (section IDs ausentes → header não scrolla). Evidence .omo/evidence/task-1-public-ui-gaps.txt
  Commit: fix(nav): add section IDs and fix footer links

- [x] 2. Criar páginas institucionais (termos, privacidade, compliance, ajuda)
  What to do / Must NOT do:
    Criar 4 páginas Next.js estáticas em `apps/web/src/app/(public)/`:
    1. `apps/web/src/app/(public)/termos/page.tsx` — título "Termos de Uso", conteúdo: seções "Uso do Serviço", "Isenção de Responsabilidade", "Propriedade Intelectual", "Limitação de Responsabilidade". Texto institucional padrão.
    2. `apps/web/src/app/(public)/privacidade/page.tsx` — título "Política de Privacidade", conteúdo: "Coleta de Dados", "Cookies", "Compartilhamento", "Direitos do Usuário (LGPD)".
    3. `apps/web/src/app/(public)/compliance/page.tsx` — título "Compliance", conteúdo: "Código de Conduta", "Canal de Denúncias" (email genérico compliance@databolsa.app).
    4. `apps/web/src/app/(public)/ajuda/page.tsx` — título "Ajuda", conteúdo: "FAQ", "Contato" (email suporte@databolsa.app).
    Cada página deve usar o mesmo layout da home (PublicHeader + PublicFooter), com conteúdo em container `max-w-3xl mx-auto py-12 px-4`. Usar `export default function NomePage()`.
    Não adicionar funcionalidades interativas. Mantenha conteúdo placeholder mas realista.
  References: PublicFooter.tsx:20-23 (links que apontam para essas rotas), page.tsx:17-82 (layout pattern)
  Acceptance criteria: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/termos` retorna 200 (ou o server não está rodando; usar `Test-Path` no arquivo). `Test-Path apps/web/src/app/(public)/termos/page.tsx` retorna True. O mesmo para privacidade, compliance, ajuda.
  QA scenarios: happy (4 páginas criadas, footer links não dão 404). Evidence .omo/evidence/task-2-public-ui-gaps.txt
  Commit: feat(pages): create institutional pages (termos, privacidade, compliance, ajuda)

### Phase 2 — Cards clicáveis

- [x] 3. AssetCard (Highlights) → Link clicável
  What to do / Must NOT do:
    Em `apps/web/src/components/widgets/HighlightsSection.tsx`:
    1. Adicionar `import Link from 'next/link'` (já existe na linha 4)
    2. No componente `AssetCard` (linha 35-65), trocar a `<div>` externa (linha 39) por `<Link>`:
       ```tsx
       <Link
         href={`/ativos/${ticker}?class=${assetClass}`}
         className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 hover:bg-surface-muted transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
       >
       ```
       OBS: AssetCard atual não recebe `assetClass` como prop. Adicionar `assetClass?: string` à interface `AssetItem` e passar do map.
    3. No `gainers.map` e `losers.map` (linhas 154-155, 180-181), passar `assetClass={data?.type ?? 'STOCK_BR'}` para o AssetCard
    4. Adicionar `assetClass?: string` à interface AssetItem (linha 7-12)
  Must NOT do: Não alterar o layout visual do card (apenas torná-lo clicável).
  References: HighlightsSection.tsx:35-65 (AssetCard), HighlightsSection.tsx:154-181 (maps)
  Acceptance criteria: AssetCard envolto em `<Link>` com href para `/ativos/{ticker}?class=...`. `grep -c '<Link' apps/web/src/components/widgets/HighlightsSection.tsx` retorna >1.
  QA scenarios: happy (card é link → cursor pointer, foco visível, navega para página do ativo). Evidence .omo/evidence/task-3-public-ui-gaps.txt
  Commit: feat(highlights): make AssetCard clickable link to ativos page

- [x] 4. Dividends rows → Link clicável
  What to do / Must NOT do:
    Em `apps/web/src/components/widgets/DividendsSection.tsx`:
    1. Na linha 92-131, cada `<tr>` da tabela de dividendos — tornar a linha (ou ao menos o ticker + nome) clicável para `/ativos/{ticker}?class=STOCK_BR`
    2. Adicionar `className="cursor-pointer hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"` na `<tr>`
    3. Envolver o conteúdo do ticker (linha 102-104) em `<Link href={`/ativos/${row.ticker}?class=STOCK_BR`}>` ou usar `onClick={() => router.push(...)}` na tr inteira
    Decisão: usar `<Link>` no ticker (mais semântico, acessível) + cursor pointer na tr toda para área de clique maior.
  References: DividendsSection.tsx:92-131 (table rows)
  Acceptance criteria: Linha de dividendos tem link para `/ativos/{ticker}?class=STOCK_BR`. `grep -c '/ativos/' apps/web/src/components/widgets/DividendsSection.tsx` retorna pelo menos 1.
  QA scenarios: happy (clicar no ticker vai para página do ativo). Evidence .omo/evidence/task-4-public-ui-gaps.txt
  Commit: feat(dividends): make dividend rows clickable to ativos page

- [x] 5. Crypto cards → Link clicável
  What to do / Must NOT do:
    Em `apps/web/src/components/widgets/CryptoSections.tsx`:
    1. No map de CRYPTO_ASSETS (linha 80-101), trocar a `<div key={asset.symbol}>` externa (linha 81) por `<Link>`:
       ```tsx
       <Link
         key={asset.symbol}
         href={`/ativos/${asset.symbol}?class=CRYPTO`}
         className="glass-panel rounded-lg p-4 block cursor-pointer focus-visible:ring-2 focus-visible:ring-primary transition-shadow hover:shadow-md"
       >
       ```
    2. Remover a `<div>` externa e colocar o conteúdo dentro do Link
    Não alterar o layout visual do card.
  References: CryptoSections.tsx:79-101 (crypto cards)
  Acceptance criteria: Cards de cripto são `<Link>` para `/ativos/{symbol}?class=CRYPTO`. `grep -c '<Link' apps/web/src/components/widgets/CryptoSections.tsx` retorna >1.
  QA scenarios: happy (card clicável navega para página do ativo). Evidence .omo/evidence/task-5-public-ui-gaps.txt
  Commit: feat(crypto): make crypto cards clickable to ativos page

### Phase 3 — Dados reais

- [x] 6. Padronizar changePercent na API
  What to do / Must NOT do:
    Em `apps/web/src/app/api/market/highlights/route.ts`, modificar o retorno para que `changePercent` SEMPRE tenha prefixo `+` para valores positivos e mantenha o sinal `-` para negativos:
    1. Criar função auxiliar:
       ```typescript
       function formatChangePercent(value: string | null): string {
         if (value === null || value === '0') return '0,00%';
         const num = parseFloat(value);
         if (num > 0) return `+${value}%`;
         if (num < 0) return `${value}%`;
         return '0,00%';
       }
       ```
    2. Aplicar nos mapeamentos de `getHighlightsForB3` (linha 55-57), `getHighlightsForCrypto` (linha 88-95), `getHighlightsForUS` (linha 132-139)
    3. **Importante:** Preservar o valor numérico sem o `%` no campo para que a ordenação por `parseFloat` em `splitGainersLosers` (linha 146) continue funcionando. O formato com `%` e `+` deve ser apenas na resposta final.
    4. NOTA: A API atualmente retorna `"0.43"` (sem `%`, sem `+`). Após a mudança, retornará `"+0.43%"`. Verificar se `HighlightsSection.tsx:36` (`startsWith('+')`) funciona corretamente com o novo formato (sim, vai funcionar).
  Must NOT do: Não alterar o formato numérico usado para ordenação (splitGainersLosers faz parseFloat). O `%` no final NÃO quebra parseFloat.
  References: highlights/route.ts:55-57, 88-95, 132-139, 143-151
  Acceptance criteria: `fetch('/api/market/highlights?type=STOCK_BR&limit=2').then(r=>r.json()).then(d=>d.gainers[0].changePercent.startsWith('+'))` retorna true (para um gainer). Verificar manualmente com curl.
  QA scenarios: happy (changePercent prefixado com + para positivos), edge case (zero retorna "0,00%"), edge case (negativo mantém sinal). Evidence .omo/evidence/task-6-public-ui-gaps.txt
  Commit: fix(api): standardize changePercent format with +/prefix

- [x] 7. Criar /api/market/dividends/agenda
  What to do / Must NOT do:
    Criar `apps/web/src/app/api/market/dividends/agenda/route.ts`:
    1. Exportar `async function GET(request: NextRequest)`
    2. Usar `fetchBrapiDividends` (já existe em `src/lib/market/market-fetchers.ts:127`)
    3. Buscar dividendos para TODOS os tickers em `CURATED_LISTS.STOCK_BR` + `CURATED_LISTS.FII` (total ~25 tickers)
    4. Usar `Promise.allSettled` com **batching** para evitar rate limit do Brapi (free tier ~30 req/min). Dividir em batches de 5 com `Promise.allSettled`, processando cada batch sequencialmente (ex: `for (const batch of chunks(tickers, 5)) { ... await delay(200); }`)
    5. Cache em memória por 1 hora (Map global como já feito em `fetchBrapiDividends:124`)
    6. Retornar array plano de:
       ```typescript
       interface AgendaItem {
         ticker: string;
         assetClass: 'STOCK_BR' | 'FII';
         type: string;        // "Dividendo" | "JCP"
         paymentDate: string; // ISO date
         value: string;       // decimal string
         stale: boolean;
       }
       ```
    7. Ordenar por `paymentDate` ascendente (mais próximos primeiro)
    8. Rate limit: usar `checkRateLimit` como nas outras rotas
    9. Se não conseguir dados de nenhum ticker, retornar 503 com `{ message: '...', data: [] }`
  Must NOT do: Não incluir tickers US ou CRYPTO (não têm dividendos via Brapi free tier). Não usar cache persistente.
  References: market-fetchers.ts:127-144 (fetchBrapiDividends), curated-lists.ts:3-17 (STOCK_BR + FII), highlights/route.ts (padrão de rota com rate limit)
  Acceptance criteria: `curl -s 'http://localhost:3000/api/market/dividends/agenda' | head -c 200` retorna JSON com array de items. Teste unitário mockando fetchBrapiDividends.
  QA scenarios: happy (retorna array ordenado por data), edge case (ticker sem dividendos não quebra), failure (Brapi offline → 503). Evidence .omo/evidence/task-7-public-ui-gaps.txt
  Commit: feat(api): add /api/market/dividends/agenda endpoint

- [x] 8. Criar /api/market/crypto/overview
  What to do / Must NOT do:
    Criar `apps/web/src/app/api/market/crypto/overview/route.ts`:
    1. Exportar `async function GET(request: NextRequest)`
    2. Consumir CoinGecko via `fetchCoinGeckoMulti` para os 5 coins curados (bitcoin, ethereum, tether, solana, binancecoin)
    3. Para cada coin, buscar preço, changePercent (24h), market_cap, total_volume
    4. Cache via `fetchCachedMarketValue` (5 min TTL) como as outras rotas
    5. Retornar:
       ```typescript
       interface CryptoOverviewItem {
         symbol: string;         // "BTC"
         name: string;           // "Bitcoin"
         price: string;          // "R$ 68.234,00"
         changePercent: string;  // "+1,45%"
         marketCap: string;      // "R$ 1.2T"
         volume24h: string;      // "R$ 32B"
         stale: boolean;
       }
       ```
    6. Incluir `asOf: string` e `trending: CryptoOverviewItem[]` (top 3 por changePercent)
  Must NOT do: Não adicionar tokens não curados. Não chamar CoinGecko sem cache.
  References: market-fetchers.ts (fetchCoinGeckoMulti), curated-lists.ts:15 (CRYPTO), highlights/route.ts:62-104 (padrão CoinGecko usage)
  Acceptance criteria: `curl -s 'http://localhost:3000/api/market/crypto/overview' | head -c 200` retorna JSON com items. Teste unitário mockando CoinGecko.
  QA scenarios: happy (retorna 5 criptos + trending), failure (CoinGecko offline → dados em stale). Evidence .omo/evidence/task-8-public-ui-gaps.txt
  Commit: feat(api): add /api/market/crypto/overview endpoint

- [x] 9. Wire dados reais no frontend (Dividendos + Cripto)
  What to do / Must NOT do:
    **Dividendos** (`apps/web/src/components/widgets/DividendsSection.tsx`):
    1. Remover a constante `DIVIDEND_DATA` hardcoded (linhas 14-39)
    2. CRÍTICO: O componente é `async server component` — NÃO usar `fetch('/api/...')` (URL relativa não funciona em server components). Em vez disso, importar e chamar a função de dados diretamente.
    3. Estratégia: criar uma função utilitária em `src/lib/market/dividends-agenda.ts` que exporta `async function getDividendsAgenda(): Promise<AgendaItem[]>`:
       - Importar `fetchBrapiDividends` de `market-fetchers.ts`
       - Importar `CURATED_LISTS` de `curated-lists.ts`
       - Chamar `fetchBrapiDividends` para cada ticker em batches de 5 (com delay 200ms entre batches)
       - Consolidar resultados, ordenar por `paymentDate`
       - Cache em memória de 1h (seguindo padrão de `dividendCache` em `market-fetchers.ts:124`)
    4. Em `DividendsSection.tsx`, importar `getDividendsAgenda` e chamar diretamente:
       ```typescript
       const agenda = await getDividendsAgenda();
       const rows = agenda.slice(0, 5);
       ```
    5. Exibir no máximo 5 linhas (slice(0, 5))
    6. Se dados vazios ou erro, mostrar "Agenda indisponível no momento"

    **Cripto** (`apps/web/src/components/widgets/CryptoSections.tsx`):
    1. Remover a constante `CRYPTO_ASSETS` hardcoded (linhas 21-26)
    2. Remover `TRENDING` hardcoded (linhas 28-33)
    3. CRÍTICO: Mesmo padrão — não usar `fetch('/api/...')`. Criar `src/lib/market/crypto-overview.ts` com `async function getCryptoOverview(): Promise<CryptoOverviewItem[]>`:
       - Importar `fetchCoinGeckoMulti` de `market-fetchers.ts`
       - Importar `CURATED_LISTS`, `CRYPTO_ID_TO_TICKER`, `CRYPTO_ID_TO_NAME` de `curated-lists.ts`
       - Cache via `fetchCachedMarketValue` com 5min TTL
    4. O componente já é async server component (linha 60: `async function CryptoSections()`) — importar `getCryptoOverview` e chamar diretamente
    5. Mapear resposta para os cards (substituir CRYPTO_ASSETS.map)
    6. Trending sidebar usa `trending` do response
    7. Emojis: mapear símbolo → emoji (BTC: ₿, ETH: Ξ, USDT: ₮, SOL: S, BNB: ◆)
    8. Se dados vazios, mostrar "Dados de cripto indisponíveis no momento"
  Must NOT do: Não quebrar o layout visual. Manter skeleton/loading states.
  References: DividendsSection.tsx:14-39 (hardcoded), DividendsSection.tsx:56-58 (fetch atual), CryptoSections.tsx:21-33 (hardcoded), CryptoSections.tsx:60-62 (fetch atual)
  Acceptance criteria: Após o deploy, a seção de dividendos mostra dados reais da Brapi e a seção de cripto mostra dados reais do CoinGecko. Nenhuma referência a DIVIDEND_DATA ou CRYPTO_ASSETS hardcoded permanece.
  QA scenarios: happy (seções mostram dados reais), failure (API externa offline → mensagem de indisponibilidade). Evidence .omo/evidence/task-9-public-ui-gaps.txt
  Commit: feat(widgets): wire real dividend and crypto data from API

### Phase 4 — Páginas de listagem

- [x] 10. Criar /ativos (listagem pública)
  What to do / Must NOT do:
    **Arquitetura:** Extrair lógica de fetch para lib compartilhada antes de criar a página.
    
    **Passo A — Criar `apps/web/src/lib/market/highlights-data.ts`:**
    Funções exportadas:
    ```typescript
    // Reunir a lógica de getHighlightsForB3, getHighlightsForCrypto, getHighlightsForUS
    // do arquivo highlights/route.ts para esta lib compartilhada
    export async function fetchAssetsForClass(
      assetClass: AssetClass,
    ): Promise<HighlightItem[]>
    
    export interface HighlightItem {
      ticker: string;
      name: string;
      assetClass: AssetClass;
      price: string;
      changePercent: string;
      stale: boolean;
    }
    ```
    - Mover as 3 funções de fetch do `highlights/route.ts` para esta lib
    - Refatorar `highlights/route.ts` para importar da lib e só fazer o rate-limit + splitGainersLosers
    - As funções devem aceitar `limit?: number` opcional (para highlights usar default 6, para pagina usar sem limite ou 20)

    **Passo B — Criar `apps/web/src/app/(public)/ativos/page.tsx`:**
    1. Server component com `searchParams: { classe?: string; sort?: string; page?: string }`
    2. Aceitar `classe` (STOCK_BR, FII, ETF, BDR, CRYPTO, STOCK_US — default: STOCK_BR) e `sort` (change, change_asc, name — default: change)
    3. Importar `fetchAssetsForClass` da lib compartilhada e chamar diretamente (sem fetch HTTP)
    4. Ordenar resultados em memória baseado em `sort`:
       - `change`: decrescente por parseFloat(changePercent)
       - `change_asc`: crescente
       - `name`: alfabético
    5. Paginação simples: `limit=20`, `page` de searchParams, slice do array
    6. Renderizar:
       - **Tabs/classe selector:** mesmo componente visual das tabs do HighlightsSection (reaproveitar ou copiar). MOSTRAR apenas classes com dados disponíveis.
       - **Grid de cards:** reagrupamento horizontal de 2-4 colunas. Cada card é um `AssetCard` (pode copiar o mesmo visual de HighlightsSection, mas com Link)
       - **Link:** cada card → `/ativos/${ticker}?class=${assetClass}`
       - **Ordenação:** dropdown de select ou tabs secundárias (change, change_asc, nome)
       - **Paginação:** "Mostrar mais" ou botão de próxima página

    **Passo C — Atualizar rota existente:**
    - Em `highlights/route.ts`, substituir as 3 funções `getHighlightsFor*` por imports de `@/lib/market/highlights-data.ts`
    - Garantir que `splitGainersLosers` e rate-limit continuem na rota (só a lógica de fetch vai pra lib)
  Must NOT do: Não adicionar funcionalidades de dashboard (adicionar ao portfolio). Não exigir autenticação.
  References: CURATED_LISTS em curated-lists.ts, fetchCachedMarketValue, highlights/route.ts (lógica de fetch)
  Acceptance criteria: `curl -s 'http://localhost:3000/ativos?classe=STOCK_BR&sort=change'` retorna HTML 200. Test-Path do arquivo retorna True.
  QA scenarios: happy (página carrega com tabs e cards), failure (classe inválida → fallback para STOCK_BR), edge case (sort inválido → fallback). Evidence .omo/evidence/task-10-public-ui-gaps.txt
  Commit: feat(pages): create /ativos public listing page

- [x] 11. Criar /proventos/agenda e /mercado/cripto
  What to do / Must NOT do:
    **`/proventos/agenda`** (`apps/web/src/app/(public)/proventos/agenda/page.tsx`):
    1. Server component async
    2. Fetch `fetch('/api/market/dividends/agenda')` (URL absoluta interna)
    3. Exibir tabela completa (sem limite de linhas), mesma UI da DividendsSection
    4. Cada linha clicável → `/ativos/{ticker}?class=STOCK_BR`
    5. Filtro por tipo (Dividendo / JCP) via searchParams ou tabs
    6. Breadcrumb: Home > Proventos > Agenda

    **`/mercado/cripto`** (`apps/web/src/app/(public)/mercado/cripto/page.tsx`):
    1. Server component async
    2. Fetch `/api/market/crypto/overview`
    3. Grid completo de cards (5+ moedas), mesma UI da CryptoSections
    4. Cards clicáveis → `/ativos/{symbol}?class=CRYPTO`
    5. Seção de notícias cripto (reaproveitar fetchCryptoNews)
    6. Breadcrumb: Home > Cripto > Mercado
  Must NOT do: Não duplicar lógica — reaproveitar funções de fetch existentes. Não adicionar auth.
  References: DividendsSection.tsx, CryptoSections.tsx, /ativos/[ticker]/page.tsx (padrão de layout)
  Acceptance criteria: `Test-Path apps/web/src/app/(public)/proventos/agenda/page.tsx` True. `Test-Path apps/web/src/app/(public)/mercado/cripto/page.tsx` True.
  QA scenarios: happy (páginas carregam com dados reais). Evidence .omo/evidence/task-11-public-ui-gaps.txt
  Commit: feat(pages): create /proventos/agenda and /mercado/cripto pages

### Phase 5 — Qualidade

- [x] 12. Testes + polish
  What to do / Must NOT do:
    1. **Testes de componente** — criar/adicionar em `apps/web/src/test/components/`:
       - `HighlightsSection.test.tsx`: verificar que AssetCard renderiza como `<Link>` com href correto
       - `DividendsSection.test.tsx`: verificar que linhas têm link para ativo
       - `CryptoSections.test.tsx`: verificar que cards de cripto são clicáveis
    2. **Testes API** — criar em `apps/web/src/test/api/`:
       - `dividends-agenda.test.ts`: mockar fetchBrapiDividends, verificar formato e ordenação
       - `crypto-overview.test.ts`: mockar CoinGecko, verificar formato
    3. **Estados vazios** — verificar que todas as seções mostram "dados indisponíveis" quando API falha
    4. **Skeletons** — verificar que HighlightsSection já tem skeleton (linhas 118-131 ✅). Adicionar skeleton em DividendsSection e CryptoSections se não tiverem
    5. **Stale badge** — verificar que dados com `stale: true` mostram indicador visual
    6. **Links Ver todos** — atualizar para rotas reais: `/ativos?classe=STOCK_BR&sort=change` etc.
  Must NOT do: Não alterar lógica de produção além do necessário para os testes passarem. Não remover testes existentes.
  References: TrendBadge.test.tsx (padrão de teste), HighlightsSection.tsx:118-131 (skeleton existente), test/ (19 arquivos)
  Acceptance criteria: `pnpm --filter web test` exit code 0. Novos testes específicos para as features das Fases 1-4.
  QA scenarios: happy (todos os testes passam), edge case (API mockada retorna vazio → componente mostra empty state). Evidence .omo/evidence/task-12-public-ui-gaps.txt
  Commit: test: add clickable card tests, dividends/crypto API tests, and polish empty states

## Final verification wave
<!-- APPEND FINAL VERIFICATION CHECKBOXES WITH PARENS NUMBERS -->
- [ ] (F1) Build: `pnpm --filter web build` passa
- [ ] (F2) Testes: `pnpm --filter web test` exit code 0
- [ ] (F3) Typecheck: `pnpm --filter web exec tsc --noEmit` exit code 0
- [ ] (F4) Navegação: header links scrollam para sections corretas, footer links não dão 404
- [ ] (F5) Cards clicáveis: todos os cards de ativo/cripto/dividendo são links para /ativos/{ticker}
- [ ] (F6) Dados reais: dividendos agenda + crypto overview funcionam com dados das APIs
- [ ] (F7) Páginas novas: /ativos, /proventos/agenda, /mercado/cripto, /termos, /privacidade, /compliance, /ajuda retornam 200
- [ ] (F8) Scope fidelity: nenhuma alteração em auth, dashboard, packages/core

## Commit strategy
13 commits, um por todo, na ordem das fases. Commits são atômicos e auto-contidos. PR único.

## Success criteria
- `/api/market/dividends/agenda` retorna JSON com dividendos reais ordenados por data
- `/api/market/crypto/overview` retorna JSON com 5+ criptos e trending
- `/ativos`, `/proventos/agenda`, `/mercado/cripto` retornam HTML 200
- `/termos`, `/privacidade`, `/compliance`, `/ajuda` retornam HTML 200
- Footer "Mercado" links apontam para `/ativos?classe=...` (não `/?type=...`)
- Header "Mercados", "Dividendos", "Cripto" scrollam para as sections corretas
- Todos os AssetCards, dividendos rows e crypto cards são links clicáveis
- changePercent na API tem prefixo `+` para positivos
- `pnpm --filter web test` exit code 0
- `pnpm --filter web build` exit code 0
