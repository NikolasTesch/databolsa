# SPEC.md — DataBolsa

> Especificação técnica · Versão 0.1 — MVP
> Documento companheiro do PRD.md

## 1. Arquitetura geral

Arquitetura cliente-servidor com um único app Next.js (`apps/web`) servindo dois clientes (web e mobile) e intermediando as APIs externas de cotação. As chaves de API externas e a lógica de negócio ficam **exclusivamente no lado servidor** — os clientes nunca falam direto com as fontes de dados. A API NestJS original foi migrada para Next.js Route Handlers (ADR-0004, SPEC-0011).

```
┌─────────────────────────────────────────────┐
│             apps/web (Next.js)              │
│                                             │
│  ┌──────────────────┐  ┌───────────────┐   │
│  │  Frontend (React)│  │  API Routes   │   │
│  │  /dashboard      │  │  /api/auth    │   │
│  │  /assets         │  │  /api/assets  │   │
│  │  /login          │  │  /api/portfolio│  │
│  └──────────────────┘  └──────┬────────┘   │
└─────────────────────────────────────────────┘
         ▲ cookies/BFF (web)    │
         │ Bearer Token (mobile)│    ┌──────────────────┐
┌────────┴──────┐               ├──► │  PostgreSQL      │
│Mobile (Flutter│               │    └──────────────────┘
└───────────────┘               │
                                │ (server-side, com cache)
                                ▼
           ┌──────────────────────────────────────────┐
           │ APIs externas de cotação                  │
           │  • brapi.dev      → B3 (ações/FII/ETF/BDR)│
           │  • CoinGecko      → criptoativos          │
           │  • Finnhub        → ações EUA             │
           │  • AwesomeAPI     → câmbio USD/BRL        │
           └──────────────────────────────────────────┘
```

## 2. Stack de tecnologias

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Web | Next.js + TypeScript | Padrão de mercado, SSR, forte demanda em vagas |
| Mobile | **Flutter + Dart** (decidido — ADR-0002) | Performance nativa sem bridge JS; cliente puro da API REST; `fl_chart` para gráficos |
| Estilização (web) | Tailwind CSS | Muito requisitado, produtividade alta |
| Gráficos | Recharts (web) / fl_chart (mobile) | Visualização de alocação e evolução |
| Backend | **Next.js Route Handlers** (decidido — ADR-0004) | API integrada ao app web; deploy gratuito na Vercel; reusa `packages/core` e `packages/types` sem reescrita |
| Banco de dados | PostgreSQL | Relacional, transacional, ideal para dados financeiros |
| ORM | **Prisma** (decidido — ADR-0001) | Migrations e tipagem do schema; schema em `apps/web/prisma/` |
| Autenticação | JWT + refresh token | Híbrido: cookies HttpOnly para web (BFF, ADR-0003); Bearer Token para mobile |
| Monorepo | pnpm workspaces | Compartilhar tipos e lógica entre web e mobile |

> **Decisão original ([ADR-0001](adr/0001-backend-stack-node-nestjs.md)):** backend em **Node.js + NestJS**. **Supersedida por ([ADR-0004](adr/0004-migrate-api-to-nextjs.md)):** API migrada para **Next.js Route Handlers** para simplificar deploy e eliminar CORS. NestJS foi removido.
>
> **Decisão tomada ([ADR-0002](adr/0002-mobile-flutter.md)):** mobile em **Flutter + Dart**, substituindo React Native + Expo. O app mobile é cliente puro da API REST, tornando a perda de reaproveitamento de código TS marginal frente ao ganho de performance nativa.

## 3. Estrutura de pastas (monorepo sugerido)

```
/apps
  /web        → Next.js (frontend + API Route Handlers + Prisma)
  /mobile     → Flutter + Dart (ADR-0002); cliente puro da API REST
/packages
  /core       → regras de negócio e cálculos (compartilhável)
  /types      → tipos/contratos da API
  /ui         → componentes compartilhados (web)
```

Manter os **cálculos financeiros em `/packages/core`** permite testá-los isoladamente e reusá-los, e é um ótimo ponto de demonstração técnica. `packages/ui` é exclusivo do web (Flutter não compartilha componentes React); tipos de contrato para o mobile são gerados em Dart via OpenAPI (`openapi-generator-cli dart-dio`) e ficam em `apps/mobile/lib/api/`. O app `apps/api` (NestJS) foi removido — veja ADR-0004.

## 4. Modelo de dados

Entidades principais (nomes ilustrativos):

**User**
- `id` (uuid, PK)
- `email` (único)
- `password_hash`
- `created_at`

**Asset** — um ativo na carteira de um usuário
- `id` (uuid, PK)
- `user_id` (FK → User)
- `ticker` (ex.: PETR4, BTC, AAPL)
- `name`
- `asset_class` (enum: `STOCK_BR`, `FII`, `ETF`, `BDR`, `CRYPTO`, `STOCK_US`)
- `currency` (enum: `BRL`, `USD`)
- `data_source` (enum: `BRAPI`, `COINGECKO`, `FINNHUB`)
- `created_at`

**Transaction** — uma operação de compra ou venda
- `id` (uuid, PK)
- `asset_id` (FK → Asset)
- `type` (enum: `BUY`, `SELL`)
- `date`
- `unit_price` (decimal)
- `quantity` (decimal)
- `fees` (decimal, default 0)
- `created_at`

**QuoteCache** — cotação mais recente por ativo/símbolo
- `id` (uuid, PK)
- `symbol`
- `price` (decimal)
- `currency`
- `fetched_at`
- *(chave de unicidade por símbolo + fonte)*

> **Atenção a tipos:** usar `decimal`/`numeric` para preços e quantidades, **nunca `float`**, para evitar erros de arredondamento em dinheiro.

## 5. API interna (endpoints principais)

Implementados como Next.js Route Handlers em `apps/web/src/app/api/`. Autenticação híbrida: cookies HttpOnly para web (via rotas `/api/session/*`) e Bearer Token para mobile (via rotas `/api/auth/*`).

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/auth/register` | — | Cria conta (retorna tokens no body) |
| POST | `/api/auth/login` | — | Autentica (retorna tokens no body) |
| POST | `/api/auth/refresh` | — | Renova token (body) |
| POST | `/api/session/register` | — | Cria conta + seta cookies HttpOnly (web BFF) |
| POST | `/api/session/login` | — | Autentica + seta cookies HttpOnly (web BFF) |
| POST | `/api/session/refresh` | — | Renova token via cookie (web BFF) |
| POST | `/api/session/logout` | — | Limpa cookies (web BFF) |
| GET | `/api/assets` | JWT | Lista ativos do usuário |
| POST | `/api/assets` | JWT | Adiciona ativo à carteira |
| GET | `/api/assets/:id` | JWT | Detalhe de um ativo |
| DELETE | `/api/assets/:id` | JWT | Remove ativo |
| GET | `/api/assets/:id/transactions` | JWT | Lista transações do ativo |
| POST | `/api/assets/:id/transactions` | JWT | Registra operação (BUY/SELL) |
| PATCH | `/api/transactions/:id` | JWT | Edita operação |
| DELETE | `/api/transactions/:id` | JWT | Exclui operação |
| GET | `/api/portfolio/summary` | JWT | Patrimônio total, alocação, métricas consolidadas |

Todas as rotas protegidas exigem JWT (cookie ou Bearer) e filtram por `user_id`. `/portfolio/history` está fora do escopo do MVP.

## 6. Integração com APIs externas

| Fonte | Uso | Observações de limite/free tier |
|-------|-----|---------------------------------|
| **brapi.dev** | Cotações B3 (ações, FII, ETF, BDR) | Tier gratuito; alguns tickers (PETR4, VALE3, MGLU3, ITUB4) funcionam sem token — bom para desenvolvimento |
| **CoinGecko** | Cotações de cripto | Tier gratuito generoso; pode retornar preço direto em BRL |
| **Finnhub** | Cotações de ações EUA | Tier gratuito de ~60 chamadas/min; cotação com atraso |
| **AwesomeAPI** | Câmbio USD/BRL | Gratuita e brasileira; usada para consolidar exterior em BRL |

**Estratégia de cache (obrigatória):** cotações são lidas do `QuoteCache` e só renovadas após um TTL (ex.: 5–15 min). Isso protege contra os limites das APIs gratuitas e acelera o dashboard. Um job agendado pode atualizar as cotações dos ativos ativos em lote.

**Resiliência:** em falha de uma fonte, usar o último valor em cache e marcar `stale` (RN-10). Implementar timeout e tratamento de erro em toda chamada externa.

## 7. Cálculos financeiros (referência das fórmulas)

Implementados em `/packages/core`, cobrindo as regras RN-01 a RN-09 do PRD.

```
preço_médio          = (Σ(qtd_compra × preço_compra) + taxas) / Σ qtd_compra
qtd_atual            = Σ qtd_compra − Σ qtd_venda
valor_investido      = qtd_atual × preço_médio
valor_atual (moeda)  = qtd_atual × cotação_atual
valor_atual (BRL)    = valor_atual × câmbio        (se moeda ≠ BRL)
lucro_prejuízo_R$    = valor_atual_BRL − valor_investido_BRL
lucro_prejuízo_%     = lucro_prejuízo_R$ / valor_investido_BRL × 100
patrimônio_total     = Σ valor_atual_BRL (posições com qtd_atual > 0)
alocação_ativo_%     = valor_atual_BRL_ativo / patrimônio_total × 100
```

## 8. Segurança

- Chaves de API externas em variáveis de ambiente, **somente no backend**.
- Senhas com hash (bcrypt/argon2). Nunca armazenar em texto puro.
- JWT com expiração curta + refresh token.
- Validação de entrada em todas as rotas (DTOs do NestJS com class-validator, ou Zod).
- HTTPS em produção; CORS restrito aos domínios dos clientes.
- LGPD: endpoints de exportação e exclusão de dados do usuário.

## 9. Estratégia de testes

| Tipo | Alvo | Ferramentas |
|------|------|-------------|
| Unitário | **Regras de negócio e cálculos** (RN-01 a RN-11) — prioridade máxima | Jest/Vitest (Node) ou pytest (Python) |
| Unitário | Componentes de UID | React Testing Library |
| Integração | Endpoints da API + acesso ao banco | Supertest (Node) / pytest + httpx (Python); banco de teste |
| Integração | Camada de cotações com APIs externas | Mocks/stubs das respostas externas |
| E2E | Fluxo crítico: criar conta → cadastrar ativo → registrar operação → ver patrimônio | Playwright ou Cypress (web) |
| Mobile | Fluxos principais do app | Widget tests (`flutter_test`); E2E opcional com `integration_test` |

**Princípios de teste:**
- Os cálculos financeiros devem ter cobertura próxima de 100% e incluir casos de borda: venda parcial, venda total, ativo sem cotação, múltiplas compras com preços diferentes, ativo em moeda estrangeira, divisão por zero (sem posição).
- Mockar APIs externas nos testes — nunca depender de rede em teste automatizado.
- Usar dados decimais nos asserts para validar arredondamento monetário.

## 10. CI/CD

- **CI:** GitHub Actions rodando lint + testes a cada push/PR.
- **Deploy web:** Vercel (Next.js).
- **Deploy backend:** Railway, Render ou Fly.io (com Postgres gerenciado).
- **Mobile:** `flutter build` (iOS/Android); distribuição via Firebase App Distribution ou loja diretamente.
- Migrations versionadas (Prisma Migrate) aplicadas no deploy via `entrypoint.sh`.

## 10.1 Docker (SPEC-0003, atualizado em SPEC-0011)

| Arquivo | Propósito |
|---------|-----------|
| `docker-compose.yml` | Dev e produção: serviços `postgres` e `web` (NestJS/apps/api removido) |
| `docker-compose.override.yml` | Hot-reload em dev (monta `src/` como volume) |
| `apps/web/Dockerfile` | Multi-stage: `deps → dev → build → runner` (Next.js standalone) |
| `apps/web/.dockerignore` | Exclui `node_modules`, `.env`, docs e artefatos de build |
| `.dockerignore` (raiz) | Exclui `node_modules`, `.env`, docs e artefatos de build |

**Contexto de build:** sempre a raiz do monorepo (`docker build -f apps/web/Dockerfile .`), para que `packages/core` e `packages/types` sejam copiados corretamente.

**Uso rápido:**
```bash
# Subir ambiente de dev completo (postgres + web hot-reload)
docker compose up

# Build de produção do Web (inclui API)
docker build -f apps/web/Dockerfile -t databolsa-web .
```

> `docker-compose.override.yml` é carregado automaticamente pelo Compose em dev.
> Em CI/produção, usar `docker compose -f docker-compose.yml up`.

## 11. Roadmap técnico

### MVP — concluído

1. ✅ `/packages/core` com cálculos e testes unitários (SPEC-0001).
2. ✅ Scaffold do monorepo + design system base (SPEC-0002).
3. ✅ Infraestrutura Docker (SPEC-0003).
4. ✅ Design tokens + codegen (SPEC-0004).
5. ✅ Schema do banco + migrations Prisma (SPEC-0005).
6. ✅ Backend NestJS — auth + CRUD (SPEC-0006).
7. ✅ Integração de cotações com cache (SPEC-0007).
8. ✅ Web Next.js — fluxo completo + dashboard (SPEC-0008).
9. ✅ Mobile Flutter — consulta + edição (SPEC-0009).
10. ✅ E2E e CI (SPEC-0010).
11. ✅ Migração API NestJS → Next.js Route Handlers (SPEC-0011).

### Fase 2 (planejado)

- Integração Open Finance via Pluggy.
- Gráfico de histórico/série temporal do patrimônio.
- Relatórios de imposto de renda.
