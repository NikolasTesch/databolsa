---
slug: fix-gaps
status: awaiting-approval
intent: clear
pending-action: write .omo/plans/fix-gaps.md
approach: Fix 9 identified gaps (3×P0, 4×P1, 2×P2) in parallel waves by severity, with CI validation as the final gate.
---

# Draft: fix-gaps

## Components (topology ledger)
| id | outcome | status | evidence path |
|----|---------|--------|---------------|
| F1 - Docker deps stage | Add packages/core/package.json to COPY in Dockerfile | active | apps/web/Dockerfile:16-19 |
| F2 - Next standalone output | Add output:'standalone' to next.config.mjs | active | apps/web/next.config.mjs:21-31 |
| F3 - Typecheck clean | Fix e2e/*.spec.ts import errors + test import of B3CoursesSection | active | apps/web/tsconfig.json:25-26 |
| F4 - Web tests green | Fix groups.test.ts (JWT_REFRESH_SECRET), TrendBadge, PublicHeader, NewsCard, CurrencyConverter, IndicatorCard tests | active | src/test/ - 19 test files |
| F5 - CI runs web tests | Add pnpm --filter web test to ci.yml | active | .github/workflows/ci.yml:38-62 |
| F6 - Asset unique constraint | Add @@unique([user_id, ticker]) + duplicate check in POST | active | prisma/schema.prisma:122 + api/assets/route.ts:91 |
| F7 - API error envelope | Migrate all 80 bare Response.json({message}) to jsonError() | active | 28 route files with mixed patterns |
| F8 - Mobile quality gap | Fix app_tokens.dart stale, debug signing in release, add Flutter CI | active | apps/mobile/ |
| F9 - Documentation | Fix apps/web/README.md, packages/ui/README.md, ci.yml encoding | active | |

## Open assumptions (announced defaults)
| assumption | adopted default | rationale | reversible? |
|---|---|---|---|
| Error format for jsonError transitions | jsonError('CODE', 'msg', status) with { message, error: { code } } shape | Already is the standard helper used by 17 files; ADR-0013 cited | Yes, but consistent shape is the goal |
| TrendBadge zero test: text-on-surface-variant | Use text-on-surface-variant (M3 token) instead of removed text-content-muted | AGENTS.md explicitly says text-content-muted is deprecated, replaced by text-on-surface-variant | Yes, but must match component impl |
| JWT_REFRESH_SECRET in groups.test.ts | Set env var in test's globalSetup or vitest.config.ts | Production code throws if unset; test must mirror that | Yes |
| Asset duplicate strategy | Prisma @@unique + application-level check before create | Defense in depth; unique constraint prevents DB-level race | Yes, both can be added independently |
| e2e typecheck | Exclude e2e/ from tsconfig or add Playwright types | e2e tests use Playwright types not in tsconfig; either exclude or add @playwright/test types | Yes |
| Flutter CI step | Add to ci.yml as optional job | Mobile is secondary; CI should not block on it but should flag regressions | Yes, can be made required later |

## Findings (cited - path:lines)

### P0: Docker deps stage quebra
- `apps/web/Dockerfile:16-19` — copia `package.json` de `apps/web/`, `packages/types/`, `packages/ui/` mas **NÃO** copia `packages/core/package.json`
- Build chama `pnpm --filter @databolsa/core build` (Dockerfile:34) que precisa do pacote instalado

### P0: Typecheck sujo
- `apps/web/tsconfig.json:25` — `"include": ["**/*.ts", "**/*.tsx"]` inclui `e2e/` mas os specs usam tipos do Playwright que não estão no tsconfig
- `apps/web/src/test/components/market/B3CoursesSection.test.tsx:3` — importa `@/components/market/B3CoursesSection` (não existe), o real é `@/components/widgets/B3CoursesSection`

### P0: Testes web vermelhos + não rodam no CI
- `apps/web/src/test/api/groups.test.ts:77` — `signAccessToken()` chama `jwt.ts:8-10` que lê `JWT_REFRESH_SECRET` e **throwa** se não existir
- `apps/web/src/test/components/TrendBadge.test.tsx:23` — espera `text-content-muted` (token OLD removido, AGENTS.md: "do NOT use")
- `apps/web/src/test/components/PublicHeader.test.tsx` — pode estar desalinhado com a UI atualizada
- `apps/web/src/test/components/NewsCard.test.tsx` — pode estar desalinhado
- `apps/web/src/test/components/market/CurrencyConverter.test.tsx` — pode estar desalinhado
- `apps/web/src/test/components/IndicatorCard.test.tsx` — pode estar desalinhado
- `.github/workflows/ci.yml:38` — tem job `test-ui` mas **NÃO** tem job `test-web`
- `.github/workflows/ci.yml:62` — `build-web` job não roda `pnpm --filter web test` antes do build

### P1: Asset sem unique constraint
- `apps/web/prisma/schema.prisma:122` — `@@index([user_id, ticker])` (index, não unique)
- `apps/web/src/app/api/assets/route.ts:91` — `prisma.asset.create()` direto sem verificar duplicidade

### P1: Envelope de erro inconsistente
- `apps/web/src/lib/http/errors.ts:13` — `jsonError()` helper padronizado: `{ message, error: { code } }`
- Mas **80+ ocorrências** de `NextResponse.json({ message: '...' })` sem `error.code` (grep acima)
- `apps/web/src/app/api/alerts/route.ts:45,46,56,65` — usa `{ error: 'INVALID_INPUT' }` (formato diferente)
- `apps/web/src/types/api.ts:184` — `ApiError` model antigo: `{ statusCode, message, error?: string }`

### P1: Mobile fora da esteira
- `apps/mobile/lib/core/theme/app_tokens.dart` — usa paleta Navy antiga (`#0B1220`, `#5E8AD0`), desatualizado vs M3 atual (`#0A0A0A`, `#adc6ff`)
- `apps/mobile/android/app/build.gradle.kts:33-37` — `signingConfig = signingConfigs.getByName("debug")` em release build
- CI não roda Flutter tests nem `tokens:dart:check`

### P1: Next output:standalone
- `apps/web/Dockerfile:47` — copia `.next/standalone/`
- `apps/web/next.config.mjs:21-31` — **NÃO** define `output: 'standalone'` (Next gera `.next/standalone/` apenas com essa config)

### P2: Documentação desatualizada
- `apps/web/README.md:5` — "Consome `apps/api` via REST" (API não existe mais, ADR-0004)
- `packages/ui/README.md:58` — "text-content-muted" (token OLD)
- `.github/workflows/ci.yml` — comentários com caracteres corrompidos (encoding issue)

## Decisions (with rationale)

1. **Prioridade P0 > P1 > P2** — criticalidade do impacto (produção quebra > dados duplicados > docs)
2. **Parallel waves por independência** — Docker e Next config não dependem de testes; asset unique não depende de CI; docs são independentes
3. **Wave 1: Config/infra (F1, F2)** — Docker + Next standalone podem ser feitos juntos, sem dependências
4. **Wave 2: Dados + API (F6, F7)** — Asset unique constraint e migração de error envelope
5. **Wave 3: Testes (F3, F4)** — Typecheck + testes vermelhos
6. **Wave 4: CI + Mobile (F5, F8, F9)** — CI pipeline e documentação
7. **Final: Verificação** — build Docker, typecheck, testes, CI dry-run

## Scope IN

- Dockerfile: adicionar `packages/core/package.json` ao COPY stage deps
- next.config.mjs: adicionar `output: 'standalone'`
- tsconfig.json: excluir `e2e/` do include OU adicionar Playwright types
- B3CoursesSection.test.tsx: corrigir import path
- groups.test.ts: configurar JWT_REFRESH_SECRET via vitest.config.ts ou setup
- TrendBadge.test.tsx: trocar `text-content-muted` por `text-on-surface-variant`
- Executar `pnpm --filter web test` e corrigir TODOS os testes quebrados
- prisma/schema.prisma: `@@unique([user_id, ticker])` em Asset
- POST /api/assets: adicionar verificação de duplicidade antes de criar
- Migrar TODOS os `NextResponse.json({ message })` para `jsonError('CODE', 'msg', status)`
- Atualizar `apps/web/src/test/api/api.test.ts` e `apps/web/src/types/api.ts` se necessário
- packages/ui: regenerar `app_tokens.dart` e copiar para mobile
- apps/mobile/android: trocar signing debug por signing release adequado
- ci.yml: adicionar job `test-web` e/ou `pnpm --filter web test`
- ci.yml: adicionar job Flutter opcional (`flutter test`)
- apps/web/README.md: remover referência a apps/api
- packages/ui/README.md: trocar text-content-muted por text-on-surface-variant
- ci.yml: corrigir encoding dos comentários

## Scope OUT (Must NOT have)

- **Não** refatorar o sistema de autenticação (JWT, refresh, etc.)
- **Não** adicionar novas features ou endpoints
- **Não** alterar o comportamento de CI para Mobile de obrigatório
- **Não** reescrever testes que passam — apenas corrigir os quebrados
- **Não** alterar o formato do banco de dados (apenas constraints)
- **Não** mexer em packages/core (está saudável com 100% coverage)
- **Não** alterar o esquema de design tokens no Figma/design-tokens.json
- **Não** adicionar `output: 'standalone'` ao Docker ENV (apenas à config do Next)

## Correções pós-revisão Momus
- **Issue #1 (T8):** AC grep pattern corrigido de `signingConfigs.debug` para `getByName("debug")` — o padrão original não correspondia ao código real
- **Issue #2 (T4):** Escopo expandido para cobrir 5 arquivos com `{ error: }` (não apenas `alerts/route.ts`):
  - `simulate/route.ts` (3x INVALID_INPUT, POSITION_NOT_FOUND, SELL_EXCEEDS_POSITION)
  - `user/goals/route.ts` (3x INVALID_INPUT, um com message extra)
  - `portfolio/benchmark/route.ts` (2x error como string literal → codes INVALID_PERIOD, INVALID_BENCHMARK)
  - `portfolio/import/route.ts` (2x com campos extras parse_errors/errors → mantém NextResponse.json mas com shape padronizado { message, error: { code }, ... })
  - AC expandido para greps exaustivos de TODOS os padrões não-padronizados
- **T7:** Step tokens:dart:check movido para localização específica (final do job test-ui)
- **T3:** Adicionada nota sobre necessidade de banco para `prisma migrate dev`
- **Matriz de dependências:** Nota sobre T7 code change vs verification dependency

## Open questions
Nenhuma — todas as decisões foram resolvidas via exploração do código.

## Approval gate
status: awaiting-approval
