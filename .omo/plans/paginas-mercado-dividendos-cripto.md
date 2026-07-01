# paginas-mercado-dividendos-cripto - Work Plan

## TL;DR (For humans)

**What you'll get:** Três páginas completas no estilo do `/cursos`: Mercado (/mercados), Dividendos (/dividendos) e Cripto (/cripto) — cada uma com seção hero, filtros, grade principal de dados e seções secundárias (notícias, educacional). A navegação do header e os links dos widgets da home passam a apontar para essas páginas.

**Why this approach:** Reaproveita as libs de dados existentes (`crypto-overview`, `dividends-agenda`, `highlights-data`) e o padrão visual já estabelecido nas páginas de cursos e ferramentas — sem novas APIs, sem novas fontes de dados, sem refatorar rotas existentes (`/ativos`, `/proventos/agenda`, `/mercado/cripto` permanecem intocadas).

**What it will NOT do:** Não vai alterar as páginas existentes `/ativos`, `/proventos/agenda` ou `/mercado/cripto`. Não vai criar novas fontes de dados ou APIs. Não vai modificar a autenticação, layout global ou footer além dos links de navegação. Não vai implementar gráficos interativos nem mapas de calor.

**Effort:** Medium
**Risk:** Low — pattern bem compreendido, dados existentes, mudanças pontuais
**Decisions to sanity-check:** Tabela de Mercados é enxuta (4-5 colunas); HighlightsSection link será dinâmico (requer mínima alteração estrutural no widget).

Your next move: **Approve** this plan, then run `$start-work` to execute.

---

> TL;DR (machine): Medium effort, Low risk. Create 3 new full pages (/mercados, /dividendos, /cripto) following the /cursos pattern: hero + filters + data grid + secondary sections. Update navigation and widget links. 3 parallel waves + 1 integration wave. P0 structure, P1 content.

## Scope
### Must have
1. New route `/mercados` — full market overview (hero + indices cards + asset table + gainers/losers sidebar + news)
2. New route `/dividendos` — full dividends page (hero + full agenda table with filters + dividend news)
3. New route `/cripto` — full crypto page (hero + crypto grid/table + trending + news + educational section)
4. `PublicHeader.tsx` NAV_ITEMS updated: Mercados→`/mercados`, Dividendos→`/dividendos`, Cripto→`/cripto`
5. Home page widget links updated to point to new routes
6. `PublicFooter.tsx` links verified/updated
7. All pages follow M3 Stitch tokens, glass-panel pattern, responsive grid, proper empty/loading states

### Must NOT have (guardrails, anti-slop, scope boundaries)
- NÃO alterar `/ativos`, `/proventos/agenda`, `/mercado/cripto` existentes
- NÃO criar novas APIs ou fontes de dados
- NÃO adicionar dependências externas
- NÃO modificar layout global, PublicLayout, ou estilos base
- NÃO criar arquivos de documentação (README, MD) — só o que o usuário pediu
- NÃO usar valores hardcoded de cores — sempre tokens CSS / Tailwind
- NÃO usar `float` para valores financeiros — sempre Decimal.js
- NÃO adicionar emojis a menos que já existam no padrão (material-icons OK)

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: tests-after (verify pages render with real data, handle empty state, handle error)
- Evidence: .omo/evidence/task-<N>-paginas-mercado-dividendos-cripto.txt (build check and test output)
- Verification: `pnpm build` at root must succeed (catches type errors in new files)

## Execution strategy
### Parallel execution waves
- **Wave 1 (3 parallel):** T1 (mercados) + T2 (dividendos) + T3 (cripto) — páginas independentes
- **Wave 2 (serial after W1):** T4 (navigation + footer + widget link updates) — depende das rotas existirem
- **Wave 3 (parallel final):** Build check + verification

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| T1. `/mercados` page | — | T4 | T2, T3 |
| T2. `/dividendos` page | — | T4 | T1, T3 |
| T3. `/cripto` page | — | T4 | T1, T2 |
| T4. Navigation & link updates | T1, T2, T3 | — | — |
| T5. Build & verify | T4 | — | — |

## Todos

- [x] 1. **Criar página `/mercados` — Mercado Completo**
  What to do / Must NOT do:
  - Criar `apps/web/src/app/(public)/mercados/page.tsx` (server: metadata + render client)
  - Criar `apps/web/src/app/(public)/mercados/client.tsx` (client component)
  - Hero section: título "Mercado", stats de índices (IBOV, S&P 500 via `/api/market/indices`), gradient orbs como em `/cursos`
  - Asset table com abas de classe: Ações | FIIs | BDRs | ETFs | Cripto | Stocks US — mesmas classes do `HighlightsSection`
  - Cada aba carrega dados de `fetchAssetsForClass()` da `highlights-data.ts`
  - Tabela com colunas: ticker, nome, preço, var%, P/L, DY, volume, valor de mercado
  - Sidebar com maiores altas/baixas da classe ativa + últimas notícias (via `/api/market/news`)
  - Busca por ticker/nome + ordenação (maiores altas, maiores baixas, nome A-Z)
  - Paginação (20 itens/página)
  - Empty state + loading skeleton (shimmer)
  - Dados servidor-side com `export const dynamic = 'force-dynamic'`
  - NÃO usar `'use client'` no page.tsx — só no client.tsx
  - NÃO alterar rotas existentes
  - Refs: `apps/web/src/app/(public)/cursos/page.tsx` (padrão hero + filtros), `apps/web/src/components/widgets/FullMarketTable.tsx` (estrutura de tabela), `apps/web/src/components/widgets/HighlightsSection.tsx` (tabs de classe), `apps/web/src/lib/market/highlights-data.ts` (fetchAssetsForClass), `apps/web/src/app/(public)/ativos/page.tsx` (asset list + paginação existente)
  - Acceptance: `Test-Path apps/web/src/app/(public)/mercados/page.tsx` e `client.tsx`; página responde em `/mercados`
  - QA: `pnpm build` passa; navegar para `/mercados` mostra hero + tabela com dados; trocar aba carrega classe correta; classe sem dados mostra empty state
  - Commit: N | feat(web): create /mercados full market page

- [x] 2. **Criar página `/dividendos` — Proventos & Dividendos**
  What to do / Must NOT do:
  - Criar `apps/web/src/app/(public)/dividendos/page.tsx` e `client.tsx`
  - Hero section: título "Dividendos e Proventos", stats (total ativos na agenda, faixa de tipos)
  - Filtros: Todos | Dividendos | JCP — via tabs de tipo
  - Busca por ticker
  - Tabela completa da agenda (reusa `getDividendsAgenda()` — NÃO limitar a 5 linhas como na home): Ativo, Tipo, Data Com, Pagamento, Valor (R$), Yield
  - Paginação na tabela
  - Seção de notícias sobre proventos (reusa `fetchDividendsNews()`)
  - Seção educacional "Como funcionam os proventos": cards explicativos sobre DIV, JCP, bonificações
  - Empty state + loading skeleton
  - NÃO recriar a roda — reaproveitar lógica de `DividendsSection.tsx` e `proventos/agenda/page.tsx`
  - Refs: `apps/web/src/components/widgets/DividendsSection.tsx` (tabela + news), `apps/web/src/app/(public)/proventos/agenda/page.tsx` (agenda existente), `apps/web/src/lib/market/dividends-agenda.ts` (getDividendsAgenda), `apps/web/src/lib/news/news.service.ts` (fetchDividendsNews)
  - Acceptance: `Test-Path apps/web/src/app/(public)/dividendos/page.tsx` e `client.tsx`; página responde em `/dividendos`
  - QA: `pnpm build` passa; `/dividendos` mostra tabela com dados; filtro JCP mostra só JCP; busca por ticker funciona; empty state quando sem dados
  - Commit: N | feat(web): create /dividendos full dividends page

- [x] 3. **Criar página `/cripto` — Mercado Cripto**
  What to do / Must NOT do:
  - Criar `apps/web/src/app/(public)/cripto/page.tsx` e `client.tsx`
  - Hero section: título "Mercado Cripto", stats (ativos listados, maior variação)
  - Grid de cards com todas as criptos do `getCryptoOverview()` (não só as da home): símbolo, nome, preço, variação 24h, volume 24h
  - Trending sidebar (ativos com maior variação absoluta)
  - Notícias cripto (reusa `fetchCryptoNews()`)
  - Seção "Aprenda sobre Cripto": cards dos cursos B3 da categoria 'Criptomoedas' (reusa `B3_COURSES.filter(c => c.category === 'Criptomoedas')`)
  - Busca por nome/símbolo
  - Empty state + loading skeleton
  - NÃO usar `'use client'` no page.tsx
  - Refs: `apps/web/src/components/widgets/CryptoSections.tsx` (cards + news + trending), `apps/web/src/app/(public)/mercado/cripto/page.tsx` (página existente — serve de inspiração, não de substituição), `apps/web/src/lib/market/crypto-overview.ts` (getCryptoOverview), `apps/web/src/lib/news/news.service.ts` (fetchCryptoNews), `apps/web/src/lib/courses-data.ts` (B3_COURSES)
  - Acceptance: `Test-Path apps/web/src/app/(public)/cripto/page.tsx` e `client.tsx`; página responde em `/cripto`
  - QA: `pnpm build` passa; `/cripto` mostra grid com dados; busca filtra ativos; seção de cursos aparece; empty state quando API falha
  - Commit: N | feat(web): create /cripto full crypto page

- [x] 4. **Atualizar navegação, footer e links dos widgets**
  What to do / Must NOT do:
  - `PublicHeader.tsx`: mudar NAV_ITEMS — Mercados: `/#mercados`→`/mercados`, Dividendos: `/#dividendos`→`/dividendos`, Cripto: `/#cripto`→`/cripto`
  - `PublicFooter.tsx`: verificar links — atualmente apontam para `/ativos?classe=...` e `/proventos/agenda`. Se houver link para `/mercado/cripto` ou hash sections, atualizar para novas rotas
  - Widgets da home page:
    - `HighlightsSection.tsx`: links "Ver todos" → `/mercados?classe=X`
    - `DividendsSection.tsx`: "Ver agenda completa" → `/dividendos`
    - `CryptoSections.tsx`: "Painel completo" → `/cripto`
  - NÃO modificar layout, estrutura ou estilo dos componentes — só as URLs
  - NÃO quebrar links existentes — adicionar novos, manter redirecionamentos se necessário
  - Refs: `apps/web/src/components/layout/PublicHeader.tsx` (linhas 14-21), `apps/web/src/components/layout/PublicFooter.tsx` (todo o FOOTER_LINKS), `apps/web/src/components/widgets/HighlightsSection.tsx:151,177`, `apps/web/src/components/widgets/DividendsSection.tsx:41`, `apps/web/src/components/widgets/CryptoSections.tsx:47`
  - Acceptance: Header mostra links ativos para as 3 novas rotas; footer links funcionam; widgets linkam para novas páginas
  - QA: Clicar em "Mercados" no header → `/mercados`; "Dividendos" → `/dividendos`; "Cripto" → `/cripto`; "Ver agenda completa" na home → `/dividendos`
  - Commit: N | feat(web): update navigation and widget links to new pages

- [x] 5. **Build e verificação final**
  What to do / Must NOT do:
  - Rodar `pnpm build` na raiz do monorepo
  - Verificar se compila sem erros
  - Caso haja erros de tipo ou import, corrigir nos arquivos afetados (T1-T4)
  - NÃO modificar nada além do necessário para o build passar
  - Acceptance: `pnpm build` exit code 0
  - QA: Rodar `pnpm build` — deve passar sem warnings
  - Commit: Y | chore(web): final build verification for new pages

## Final verification wave
> Runs in parallel after ALL todos. All must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [x] F1. Plan compliance audit — todas as 3 páginas existem? navegação atualizada? build passa?
- [x] F2. Code quality review — pattern consistente com `/cursos`? sem dead code? sem hardcoded values?
- [x] F3. Real manual QA — as páginas renderizam no navegador? links funcionam? dados aparecem?
- [x] F4. Scope fidelity — nada foi alterado fora do escopo? rotas existentes intactas?

## Commit strategy
5 commits no mesmo branch:
1. `feat(web): create /mercados full market page`
2. `feat(web): create /dividendos full dividends page`
3. `feat(web): create /cripto full crypto page`
4. `feat(web): update navigation and widget links to new pages`
5. `chore(web): final build verification for new pages`

## Success criteria
- [ ] `/mercados` responde com hero + tabela de ativos + sidebar com altas/baixas + notícias
- [ ] `/dividendos` responde com hero + tabela de agenda completa + filtros + notícias
- [ ] `/cripto` responde com hero + grid de criptos + trending + notícias + seção de cursos
- [ ] Header nav aponta para as 3 novas rotas
- [ ] Widgets da home linkam para as novas páginas
- [ ] `pnpm build` passa sem erros
- [ ] Rotas existentes `/ativos`, `/proventos/agenda`, `/mercado/cripto` intactas
