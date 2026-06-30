# fix-gaps - Work Plan

## TL;DR (For humans)

**What you'll get:** 9 gaps corrigidos no seu monorepo — desde o Docker de produção que não copiava o package.json do core (P0) até documentação desatualizada (P2). Os testes web voltam a ficar verdes, o typecheck passa limpo, a build Docker fica consistente, ativos não podem mais ser duplicados por engano, e toda API retorna erros no mesmo formato padronizado. O Mobile (Flutter) volta a sincronizar com os tokens de design e ganha um job opcional de CI.

**Why this approach:** Dividimos em 4 ondas paralelas por independência técnica — infra/config primeiro, depois dados/API, depois testes, e por fim CI + docs no final. Cada gap tem seu próprio todo com acceptance criteria executável por agente, sem necessidade de intervenção humana.

**What it will NOT do:** Não adiciona novas features, não refatora auth, não altera o schema do banco além das constraints, não mexe no packages/core.

**Effort:** Medium
**Risk:** Medium - Docker e testes web estão quebrados, e a migração do envelope de erro toca 28 arquivos de rota
**Decisions to sanity-check:** O formato padronizado de erro (manter jsonError com { message, error: { code } }), e a estratégia de unique constraint (Prisma DB + aplicação)

Your next move: **Approve** this plan, then I'll write the full task list. Or ask for a high-accuracy review first.

---

> TL;DR (machine): Medium effort, Medium risk, 9 gaps across 9 plan files, 4 parallel waves, migration of 80+ error responses, Docker + Next config + unique constraint + test fixes + CI + mobile + docs.

## Scope
### Must have
- Docker de produção funcional (packages/core copiado no estágio deps)
- Next output:standalone configurado
- Typecheck limpo (pnpm --filter web exec tsc --noEmit passa)
- Testes web verdes (pnpm --filter web test passa)
- CI roda testes web automaticamente
- Asset unique constraint (Prisma @@unique + check no POST)
- Todas as rotas de API usam jsonError padronizado
- Mobile: app_tokens.dart atualizado, CI opcional, release signing fixo
- Documentação corrigida (READMEs + encoding do ci.yml)

### Must NOT have (guardrails, anti-slop, scope boundaries)
- Nenhuma nova feature ou endpoint
- Nenhuma alteração no packages/core
- CI Mobile permanece opcional (não bloqueante)
- Nenhuma alteração no design-tokens.json ou esquema de tokens
- Nenhuma refatoração de auth ou JWT
- Apenas corrigir testes quebrados — não reescrever testes que passam

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: tests-after (corrigir testes existentes, não escrever novos)
- Evidence: .omo/evidence/task-<N>-fix-gaps.txt

## Execution strategy
### Parallel execution waves
- **Wave 1 (Infra/Config):** F1 (Docker) + F2 (Next standalone) — sem dependências
- **Wave 2 (Dados/API):** F6 (Asset unique) + F7 (Error envelope) — F6 não depende de F7
- **Wave 3 (Testes):** F3 (Typecheck) + F4 (Testes web) — F3 pode ser feito em paralelo com F4
- **Wave 4 (CI/Mobile/Docs):** F5 (CI) + F8 (Mobile) + F9 (Docs) — tudo independente

> ^[a] T7 code change (YAML) é independente de T6, mas a **verificação** depende dos testes web estarem verdes (CI só pode validar após T6).
> 
### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| T1. Docker: copiar packages/core | — | — | T2 |
| T2. Next: output standalone | — | — | T1 |
| T3. Asset: unique constraint + app check | — | — | T4 |
| T4. API: migrar error envelope | — | — | T3 |
| T5. Typecheck: fix e2e + imports | — | — | T6 |
| T6. Testes: corrigir todos os quebrados | — | — | T5 |
| T7. CI: adicionar test-web + Flutter | T6 ^[a] | — | T8 |
| T8. Mobile: tokens + signing | — | — | T7 |
| T9. Docs: atualizar READMEs + encoding | — | — | T7 |

## Todos

- [x] 1. Docker: copiar packages/core/package.json no estágio deps
  What to do / Must NOT do: Adicionar `COPY packages/core/package.json ./packages/core/` à linha 18 do Dockerfile (entre os COPYs de packages/types e packages/ui). Não alterar mais nada no Dockerfile.
  Parallelization: Wave 1 | Blocked by: — | Blocks: —
  References:
    - apps/web/Dockerfile:16-19 (linhas dos COPYs)
    - AGENTS.md (build order: pnpm --filter @databolsa/core build)
  Acceptance criteria (agent-executable): `cat apps/web/Dockerfile | grep -c "packages/core/package.json"` retorna 1
  QA scenarios: happy (grep pelo conteúdo adicionado), failure (não adicionar → grep falha). Evidence .omo/evidence/task-1-fix-gaps.txt
  Commit: chore(web): add packages/core/package.json to Docker deps stage

- [x] 2. Next.js: configurar output: 'standalone'
  What to do / Must NOT do: Adicionar `output: 'standalone',` ao objeto `nextConfig` em `apps/web/next.config.mjs` (linha 21, antes de `transpilePackages` ou depois). Não alterar security headers ou qualquer outra config.
  Parallelization: Wave 1 | Blocked by: — | Blocks: —
  References:
    - apps/web/next.config.mjs:21 (objeto nextConfig)
    - apps/web/Dockerfile:47 (copia .next/standalone)
    - apps/web/Dockerfile:31 (comentário "Habilita output standalone")
  Acceptance criteria (agent-executable): `cat apps/web/next.config.mjs | grep "output:"` retorna `output: 'standalone'`
  QA scenarios: happy (grep confirma), failure (não adicionado). Evidence .omo/evidence/task-2-fix-gaps.txt
  Commit: chore(web): add output:standalone to next.config.mjs

- [x] 3. Asset: adicionar @@unique + verificação de duplicidade
  What to do / Must NOT do:
    1. Em `prisma/schema.prisma:122`, trocar `@@index([user_id, ticker])` por `@@unique([user_id, ticker])` no model Asset
    2. Em `apps/web/src/app/api/assets/route.ts`, antes do `prisma.asset.create()` (linha 91), adicionar `const existing = await prisma.asset.findFirst({ where: { user_id: user.id, ticker: ticker.toUpperCase() } }); if (existing) return jsonError('DUPLICATE_TICKER', 'Ativo já cadastrado', 409);`
    3. Rodar `pnpm --filter web exec prisma migrate dev --name asset_unique_user_ticker` para gerar a migration. **Nota:** Requer banco de dados rodando localmente (ver `docker compose up` em AGENTS.md). Se não houver banco disponível, usar `prisma migrate dev --create-only` para gerar o arquivo de migration sem aplicar, e commitá-lo.
    Não alterar outros modelos ou rotas.
  Parallelization: Wave 2 | Blocked by: — | Blocks: —
  References:
    - prisma/schema.prisma:122 (@@index atual)
    - apps/web/src/app/api/assets/route.ts:91-100 (create)
    - apps/web/src/lib/http/errors.ts (jsonError helper)
  Acceptance criteria (agent-executable): `cat apps/web/prisma/schema.prisma | grep "user_id.*ticker"` mostra `@@unique`. Teste POST duplicado retorna 409.
  QA scenarios: happy (criar dois assets com mesmo ticker → 409), failure (ticker diferente → 201). Evidence .omo/evidence/task-3-fix-gaps.txt
  Commit: feat(api): add unique constraint and duplicate check for assets

- [x] 4. API: migrar envelope de erro para jsonError padronizado
  What to do / Must NOT do:
    1. Em TODOS os route handlers que usam `NextResponse.json({ message: '...' }, { status })`, substituir por `jsonError('CODE', 'message', status)`. CÓDIGOS SUGERIDOS por categoria:
       - 401 (não autorizado): 'UNAUTHORIZED'
       - 404 (não encontrado): 'NOT_FOUND'
       - 400 (validação/payload): 'INVALID_INPUT' ou 'INVALID_<FIELD>'
       - 422 (regra de negócio): manter código específico
       - 500 (erro interno): 'INTERNAL_ERROR'
    2. Migrar também todas as respostas com `{ error: 'CODE' }` (sem `message` ou com formato alternativo) para `jsonError('CODE', 'mensagem', status)`. ARQUIVOS AFETADOS:
       - `apps/web/src/app/api/alerts/route.ts` — 3x `{ error: 'INVALID_INPUT' }` → `jsonError('INVALID_INPUT', 'msg', 422)`
       - `apps/web/src/app/api/portfolio/simulate/route.ts` — 3x `{ error: 'INVALID_INPUT' }`, 1x `{ error: 'POSITION_NOT_FOUND' }`, 1x `{ error: 'SELL_EXCEEDS_POSITION' }`. Adicionar mensagens pt-BR: 'INVALID_INPUT' → 'Parâmetros inválidos', 'POSITION_NOT_FOUND' → 'Posição não encontrada para o ticker informado', 'SELL_EXCEEDS_POSITION' → 'Venda excede posição atual'
       - `apps/web/src/app/api/user/goals/route.ts` — 2x `{ error: 'INVALID_INPUT' }`, 1x `{ error: 'INVALID_INPUT', message: '...' }`. Migrar para `jsonError` preservando a mensagem existente
       - `apps/web/src/app/api/portfolio/benchmark/route.ts` — 2x `{ error: 'mensagem literal' }` (erro não é code, é texto). Trocar para `jsonError('INVALID_PERIOD', '...', 422)` e `jsonError('INVALID_BENCHMARK', '...', 422)`
    3. ROTAS COM CAMPOS EXTRAS (import/route.ts): `{ error: 'CODE', parse_errors: [...] }` e `{ error: 'NO_VALID_ROWS', errors: [...] }` — NÃO usar `jsonError`. Manter `NextResponse.json()` MAS ajustar para o shape padronizado: incluir `message` + `error: { code: 'CODE' }` + campos extras. Exemplo:
       - `{ error: 'PARSE_ERROR', parse_errors: [...] }` → `{ message: 'Erro ao processar CSV', error: { code: 'PARSE_ERROR' }, parse_errors: [...] }`
       - `{ error: 'NO_VALID_ROWS', errors: [...] }` → `{ message: 'Nenhuma linha válida para importar', error: { code: 'NO_VALID_ROWS' }, errors: [...] }`
       - As 2x `{ error: 'INVALID_INPUT', message: '...' }` → `jsonError('INVALID_INPUT', 'mensagem', 422)`
    4. Atualizar `apps/web/src/types/api.ts:184` — interface `ApiError` deve espelhar o formato `{ message: string, error: { code: string } }` do jsonError, não o modelo antigo `{ statusCode, message, error?: string }`
    5. **Não** alterar a lógica de negócio das rotas — apenas o formato da resposta de erro. Respostas de SUCESSO (status 200/201) continuam usando `NextResponse.json` normalmente.
  Parallelization: Wave 2 | Blocked by: — | Blocks: —
  References:
    - apps/web/src/lib/http/errors.ts:13 (formato canônico)
    - 28 route files com 80+ ocorrências de Response.json({message}) (grep completo no draft)
    - apps/web/src/app/api/alerts/route.ts:45,56,65 (formato { error: 'INVALID_INPUT' })
    - apps/web/src/app/api/portfolio/simulate/route.ts:20,32,47,59,125 (formato { error })
    - apps/web/src/app/api/user/goals/route.ts:32,49,52 (formato { error })
    - apps/web/src/app/api/portfolio/benchmark/route.ts:78,81 (error como literal)
    - apps/web/src/app/api/portfolio/import/route.ts:133,151,164,219 (complexo, com extras)
    - apps/web/src/types/api.ts:184 (ApiError interface desatualizada)
  Acceptance criteria (agent-executable):
    1. `grep -rn 'NextResponse.json({ message:' apps/web/src/app/api/ | grep -v 'success\|access_token\|monthly_income\|ticker\|results\|gainers\|indices\|data_points\|ok\|dividends' | grep -v 'PARSE_ERROR\|NO_VALID_ROWS'` — retorna 0. As únicas exceções permitidas são `import/route.ts` com `PARSE_ERROR` e `NO_VALID_ROWS` (que têm campos extras) e handlers de sucesso.
    2. `grep -rn "'INVALID_INPUT'" apps/web/src/app/api/ | grep -v node_modules` — retorna 0 (todos migrados).
    3. `grep -rn "error: 'POSITION_NOT_FOUND\|error: 'SELL_EXCEEDS\|error: 'PARSE_ERROR\|error: 'NO_VALID_ROWS\|error: 'period inválido\|error: 'benchmark inválido" apps/web/src/app/api/ | grep -v node_modules` — retorna 0 (todos migrados).
    4. TypeScript compila sem erros: `pnpm --filter web exec tsc --noEmit` exit code 0.
  QA scenarios: happy (cada rota retorna erro no formato { message, error: { code } }), edge case (import route mantém parse_errors/errors extras), regression (rotas de sucesso não mudam). Evidence .omo/evidence/task-4-fix-gaps.txt
  Commit: refactor(api): standardize all error responses to use jsonError helper

- [x] 5. Typecheck: corrigir e2e + imports
  What to do / Must NOT do:
    1. Em `apps/web/tsconfig.json:26`, adicionar `"e2e"` ao `exclude`: `"exclude": ["node_modules", "e2e"]` OU instalar `@playwright/test` como devDep e adicionar ao `include`. Decisão: **excluir e2e/** do tsconfig (mais simples, e2e tem seu próprio tsconfig via Playwright).
    2. Em `apps/web/src/test/components/market/B3CoursesSection.test.tsx:3`, trocar `import { B3CoursesSection } from '@/components/market/B3CoursesSection'` por `import B3CoursesSection from '@/components/widgets/B3CoursesSection'` (default export).
    3. Rodar `pnpm --filter web exec tsc --noEmit` e verificar que passa.
    Não mexer em outros arquivos tsconfig nem nas configurações do Playwright.
  Parallelization: Wave 3 | Blocked by: — | Blocks: —
  References:
    - apps/web/tsconfig.json:25-26 (include/exclude)
    - apps/web/src/test/components/market/B3CoursesSection.test.tsx:3 (import errado)
    - apps/web/src/components/widgets/B3CoursesSection.tsx:34 (default export)
  Acceptance criteria (agent-executable): `pnpm --filter web exec tsc --noEmit` exit code 0
  QA scenarios: happy (typecheck passa), failure (tsc --noEmit falha). Evidence .omo/evidence/task-5-fix-gaps.txt
  Commit: fix(web): exclude e2e from tsconfig and fix B3CoursesSection import path

- [x] 6. Testes: corrigir todos os quebrados
  What to do / Must NOT do:
    1. Executar `pnpm --filter web test` para ver o estado atual
    2. **groups.test.ts** (`apps/web/src/test/api/groups.test.ts`): Adicionar `process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-32-chars!!'` no topo OU no `beforeAll`/setup — verificar a melhor abordagem (provavelmente no `src/test/setup.ts` global)
    3. **TrendBadge.test.tsx** (`apps/web/src/test/components/TrendBadge.test.tsx:23`): Trocar `text-content-muted` por `text-on-surface-variant` (token M3 correto, ver AGENTS.md)
    4. **PublicHeader.test.tsx** (`apps/web/src/test/components/PublicHeader.test.tsx`): Executar e corrigir se o componente mudou (verificar se o header ainda tem os mesmos textos/elementos)
    5. **NewsCard.test.tsx** (`apps/web/src/test/components/market/NewsCard.test.tsx`): Executar e corrigir se o componente mudou
    6. **CurrencyConverter.test.tsx** (`apps/web/src/test/components/market/CurrencyConverter.test.tsx`): Executar e corrigir se o componente mudou
    7. **IndicatorCard.test.tsx** (`apps/web/src/test/components/IndicatorCard.test.tsx`): Executar e corrigir se o componente mudou
    8. Corrigir quaisquer outros testes quebrados até `pnpm --filter web test` passar completamente
    Não remover testes — apenas corrigi-los. Não reduzir cobertura.
  Parallelization: Wave 3 | Blocked by: — | Blocks: T7
  References:
    - apps/web/vitest.config.ts (config de teste)
    - apps/web/src/test/setup.ts (setup global)
    - apps/web/src/test/api/groups.test.ts:77 (signAccessToken)
    - apps/web/src/lib/auth/jwt.ts:8-10 (JWT_REFRESH_SECRET required)
    - apps/web/src/test/components/TrendBadge.test.tsx:23
    - apps/web/src/test/components/PublicHeader.test.tsx
    - apps/web/src/test/components/market/NewsCard.test.tsx
    - apps/web/src/test/components/market/CurrencyConverter.test.tsx
    - apps/web/src/test/components/IndicatorCard.test.tsx
    - AGENTS.md (M3 token mapping)
  Acceptance criteria (agent-executable): `pnpm --filter web test` exit code 0
  QA scenarios: happy (todos os testes passam), failure (teste quebrado → falha). Evidence .omo/evidence/task-6-fix-gaps.txt
  Commit: fix(web): repair all failing tests - JWT env, TrendBadge token, component alignment

- [x] 7. CI: adicionar test-web e Flutter opcional
  What to do / Must NOT do:
    1. Em `.github/workflows/ci.yml`, adicionar job `test-web` entre `test-ui` e `build-web`:
       - Deve rodar `pnpm install --frozen-lockfile` + `pnpm --filter web test`
       - Deve ser `needs: [test-ui]`
       - Deve usar `env: JWT_REFRESH_SECRET: ${{ secrets.JWT_REFRESH_SECRET }}` (ou um valor fixo de teste)
    2. Garantir que `build-web` depende de `test-web` (adicionar `test-web` ao `needs:` de build-web)
    3. Adicionar job `test-mobile` (opcional, `if: always()`):
       - `runs-on: ubuntu-latest`
       - Setup Flutter via `subosito/flutter-action@v2`
       - `flutter test` em `apps/mobile`
       - `continue-on-error: true` (não bloqueante)
    4. Adicionar step `tokens:dart:check` ao final do job `test-ui` (após "Test — packages/ui"):
       ```yaml
       - name: Check Flutter tokens are in sync
         run: pnpm --filter @databolsa/ui tokens:dart:check
       ```
    5. Corrigir encoding dos comentários do ci.yml (substituir caracteres corrompidos se houver)
    Não alterar jobs existentes. Não tornar mobile obrigatório.
  Parallelization: Wave 4 | Blocked by: T6 | Blocks: —
  References:
    - .github/workflows/ci.yml:38-62 (jobs existentes)
    - .github/workflows/ci.yml:83 (build step)
    - AGENTS.md (key commands: test, build)
  Acceptance criteria (agent-executable): Validação sintática do YAML: `node -e "require('js-yaml').load(require('fs').readFileSync('.github/workflows/ci.yml','utf8'))"` não lança erro
  QA scenarios: happy (YAML válido, jobs estruturados), failure (YAML inválido). Evidence .omo/evidence/task-7-fix-gaps.txt
  Commit: ci: add web test and optional Flutter jobs; fix comment encoding

- [x] 8. Mobile: atualizar tokens + release signing
  What to do / Must NOT do:
    1. Regenerar `app_tokens.dart` rodando `node packages/ui/scripts/generate-theme-dart.mjs` (gera em `packages/ui/src/app_tokens.dart`)
    2. Copiar para `apps/mobile/lib/core/theme/app_tokens.dart`
    3. Em `apps/mobile/android/app/build.gradle.kts:33-37`, trocar `signingConfig = signingConfigs.getByName("debug")` por um TODO comentado ou config de release real. Decisão: manter comentário `// TODO: Add production signing config` e deixar o bloco vazio (sem signing = build falha com erro claro, melhor que assinar com debug)
    4. Verificar se `pnpm --filter @databolsa/ui tokens:dart:check` passa após a cópia
    Não alterar lógica de negócio ou layouts do Flutter. Não adicionar dependências novas.
  Parallelization: Wave 4 | Blocked by: — | Blocks: —
  References:
    - apps/mobile/lib/core/theme/app_tokens.dart (desatualizado — paleta Navy antiga)
    - packages/ui/scripts/generate-theme-dart.mjs (gerador)
    - packages/ui/package.json:24-25 (comandos tokens:dart)
    - apps/mobile/android/app/build.gradle.kts:33-37 (debug signing)
    - packages/ui/README.md (guia de copy para mobile)
  Acceptance criteria (agent-executable): `cd packages/ui && node scripts/generate-theme-dart.mjs --check` exit code 0. `grep -c 'getByName("debug")' apps/mobile/android/app/build.gradle.kts` retorna 0 (a chamada ao método getByName("debug") foi removida do bloco release).
  QA scenarios: happy (tokens Dart gerados e check CI passa), failure (app_tokens.dart divergente). Evidence .omo/evidence/task-8-fix-gaps.txt
  Commit: chore(mobile): regenerate design tokens and fix release signing config

- [x] 9. Docs: corrigir READMEs + encoding ci.yml
  What to do / Must NOT do:
    1. `apps/web/README.md:5`: Trocar "Consome `apps/api` via REST." por "API própria via Route Handlers do Next.js (ADR-0004)." (ou remover a linha)
    2. `packages/ui/README.md:58`: Trocar `text-content-muted` por `text-on-surface-variant`
    3. `.github/workflows/ci.yml`: Verificar se há caracteres corrompidos nos comentários e corrigir (re-escrever com UTF-8 limpo)
    Não alterar outros arquivos de documentação.
  Parallelization: Wave 4 | Blocked by: — | Blocks: —
  References:
    - apps/web/README.md:5
    - packages/ui/README.md:58
    - .github/workflows/ci.yml (comentários)
    - AGENTS.md (token mapping: text-content-muted → text-on-surface-variant)
  Acceptance criteria (agent-executable): `grep -c "apps/api" apps/web/README.md` retorna 0. `grep -c "text-content-muted" packages/ui/README.md` retorna 0.
  QA scenarios: happy (grep não encontra texto antigo). Evidence .omo/evidence/task-9-fix-gaps.txt
  Commit: docs: update READMEs and fix CI encoding

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit — todos executados, nada fora do escopo
- [ ] F2. Build verificatório: `pnpm --filter web build` passa (inclui core build + prisma generate + next build)
- [ ] F3. Testes: `pnpm --filter web test` passa, `pnpm --filter core test` passa
- [ ] F4. Docker build: `docker build -f apps/web/Dockerfile .` não quebra no estágio deps
- [ ] F5. Typecheck: `pnpm --filter web exec tsc --noEmit` passa
- [ ] F6. Mobile: `cd packages/ui && node scripts/generate-theme-dart.mjs --check` passa
- [ ] F7. Scope fidelity: nenhuma nova feature, nenhuma alteração em packages/core

## Commit strategy
9 commits independentes (um por todo), na ordem das ondas. Cada commit é atômico e auto-contido. PR único com squash opcional.

## Success criteria
- `docker build -f apps/web/Dockerfile .` completa o estágio deps e build sem erro
- `pnpm --filter web exec tsc --noEmit` exit code 0
- `pnpm --filter web test` exit code 0
- `pnpm --filter core test` exit code 0
- POST /api/assets com mesmo ticker retorna 409
- Todas as respostas de erro seguem `{ message, error: { code } }`
- `pnpm --filter @databolsa/ui tokens:dart:check` exit code 0
- `grep -r "text-content-muted" apps/web/src packages/ui/` retorna vazio
- `grep -r "apps/api" apps/web/README.md` retorna vazio
