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

Entidades principais (Prisma schema):

**User**
- `id` (uuid, PK)
- `email` (string, unique)
- `password_hash` (string)
- `refresh_token_hash` (string, optional)
- `monthly_income_goal` (decimal, optional)
- `role` (enum: `USER`, `ADMIN`)
- `created_at` (datetime)

**Group** — Grupo de investimento
- `id` (uuid, PK)
- `name` (string)
- `description` (string, optional)
- `created_by` (FK -> User)
- `created_at` (datetime)

**GroupMembership** — Relação membro-grupo
- `id` (uuid, PK)
- `group_id` (FK -> Group, Cascade)
- `user_id` (FK -> User, Cascade)
- `role` (enum: `LEADER`, `MEMBER`)
- `joined_at` (datetime)
- *Chave única combinada [group_id, user_id]*

**GroupInvite** — Convites para grupos
- `id` (uuid, PK)
- `group_id` (FK -> Group, Cascade)
- `code` (string, unique)
- `role` (enum: `LEADER`, `MEMBER`)
- `created_by` (FK -> User)
- `expires_at` (datetime, optional)
- `max_uses` (int, optional)
- `uses` (int)
- `revoked` (boolean)
- `created_at` (datetime)

**Asset** — Ativo na carteira do usuário
- `id` (uuid, PK)
- `user_id` (FK -> User, Cascade)
- `ticker` (string)
- `name` (string)
- `asset_class` (enum: `STOCK_BR`, `FII`, `ETF`, `BDR`, `CRYPTO`, `STOCK_US`)
- `currency` (enum: `BRL`, `USD`)
- `data_source` (enum: `BRAPI`, `COINGECKO`, `FINNHUB`)
- `sector` (string, optional)
- `created_at` (datetime)
- *Index por [user_id, ticker]*

**Transaction** — Compra, venda ou provento
- `id` (uuid, PK)
- `asset_id` (FK -> Asset, Cascade)
- `type` (enum: `BUY`, `SELL`, `DIVIDEND`)
- `date` (date)
- `unit_price` (decimal)
- `quantity` (decimal)
- `fees` (decimal)
- `created_at` (datetime)

**PriceAlert** — Alertas de preço in-app
- `id` (uuid, PK)
- `user_id` (FK -> User, Cascade)
- `asset_ticker` (string)
- `condition` (enum: `ABOVE`, `BELOW`)
- `target_price` (decimal)
- `is_active` (boolean)
- `triggered_at` (datetime, optional)
- `created_at` (datetime)

**QuoteCache** — Cache de cotações
- `id` (uuid, PK)
- `symbol` (string)
- `source` (DataSource)
- `price` (decimal)
- `currency` (string)
- `changePercent` (decimal, optional)
- `changeValue` (decimal, optional)
- `name` (string, optional)
- `fetched_at` (datetime)
- *Chave única combinada [symbol, source]*

**BenchmarkSeriesCache** — Cache de dados de índices de referência
- `id` (uuid, PK)
- `series_key` (string)
- `period` (string)
- `data` (json)
- `fetched_at` (datetime)
- *Chave única combinada [series_key, period]*

**AssetFundamentalsCache** — Fundamentos corporativos/cripto
- `id` (uuid, PK)
- `symbol` (string)
- `source` (DataSource)
- `data` (json)
- `fetched_at` (datetime)
- *Chave única combinada [symbol, source]*

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
| POST | `/api/assets/:id/transactions` | JWT | Registra operação (BUY/SELL/DIVIDEND) |
| PATCH | `/api/transactions/:id` | JWT | Edita operação |
| DELETE | `/api/transactions/:id` | JWT | Exclui operação |
| GET | `/api/portfolio/summary` | JWT | Patrimônio total, alocação, métricas consolidadas |
| GET | `/api/portfolio/history` | JWT | Série temporal histórica de patrimônio e TWR |
| GET | `/api/portfolio/monthly-activity` | JWT | Atividades e proventos do mês |
| GET | `/api/groups` | JWT | Lista grupos de investimento do usuário |
| POST | `/api/groups` | JWT | Cria um grupo de investimento |
| GET | `/api/groups/:id` | JWT | Detalhes do grupo (membros, portfólios compartilhados) |
| DELETE | `/api/groups/:id` | JWT | Exclui/Sai do grupo |
| POST | `/api/groups/:id/invites` | JWT | Gera um código de convite para o grupo |
| GET | `/api/groups/invites/:code` | JWT | Detalha as informações de um convite antes de aceitar |
| POST | `/api/groups/invites/:code/accept` | JWT | Aceita convite e entra no grupo |
| DELETE | `/api/groups/:id/members/:userId` | JWT | Remove um membro do grupo (líder apenas) |
| GET | `/api/alerts` | JWT | Lista alertas de preços ativos e disparados |
| POST | `/api/alerts` | JWT | Cria um novo alerta de preço para ativo |
| DELETE | `/api/alerts/:id` | JWT | Exclui/desativa um alerta |
| GET | `/api/market/search?q=` | — | Busca de ativos pública |
| GET | `/api/market/indices` | — | Obtém índices (IBOV, CDI, etc.) |
| GET | `/api/market/highlights` | — | Ativos em destaque (altas/baixas/volumes) |
| GET | `/api/market/news` | — | Feed de notícias de mercado integrado |
| GET | `/api/market/courses` | — | Listagem de cursos educacionais gratuitos da B3 |
| GET | `/api/market/tools/convert` | — | Conversor de moedas fiduciárias e cripto |

Todas as rotas protegidas exigem JWT (cookie ou Bearer) e filtram por `user_id`.

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

### Cálculo de Rentabilidade Ponderada no Tempo (TWR)

Para a série histórica do portfólio, é utilizado o método TWR (Time-Weighted Return), dividindo o histórico em N subperíodos onde ocorrem fluxos de caixa externos (aportes ou retiradas), eliminando o viés do volume de caixa:

```
R_sub_i = (V_fim_i - Fluxo_i) / V_inicio_i
TWR     = [ Π_{i=1}^{N} (1 + R_sub_i) - 1 ] × 100
```
Onde:
- `V_inicio_i`: Valor da carteira no início do período i.
- `V_fim_i`: Valor da carteira no final do período i (antes do fluxo).
- `Fluxo_i`: Aporte (positivo) ou retirada (negativo) realizado no período i.
- Proventos (`DIVIDEND`) são tratados como retornos internos gerados pelos ativos, sem alterar o fluxo de caixa externo de aportes.

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

### Fase 1 — MVP & Funcionalidades Centrais (Concluída)

1. ✅ `/packages/core` com cálculos e testes unitários (SPEC-0001).
2. ✅ Scaffold do monorepo + design system base (SPEC-0002).
3. ✅ Infraestrutura Docker (SPEC-0003).
4. ✅ Design tokens + codegen (SPEC-0004).
5. ✅ Schema do banco + migrations Prisma (SPEC-0005).
6. ✅ Backend NestJS migrado para Next.js Route Handlers (SPEC-0006, SPEC-0011).
7. ✅ Integração de cotações com cache resiliente (SPEC-0007, SPEC-0020).
8. ✅ Web Next.js — dashboard de carteiras e análises (SPEC-0008, SPEC-0012..SPEC-0014).
9. ✅ Mobile Flutter — consulta e cotações (SPEC-0009, SPEC-0015).
10. ✅ Notícias, ferramentas de câmbio e cursos da B3 (SPEC-0016..SPEC-0019).
11. ✅ Dashboards de proventos e alocações detalhadas (SPEC-0022..SPEC-0024).
12. ✅ Alertas de preços, simuladores e importação CSV (SPEC-0025..SPEC-0027, SPEC-0032, SPEC-0034).
13. ✅ Séries temporais complexas TWR (SPEC-0035) e paginação (SPEC-0036).
14. ✅ Grupos de investimentos compartilhados de ponta a ponta (SPEC-0037..SPEC-0039).

### Fase 2 (Planejado)

- Sincronização automatizada via Open Finance (Pluggy / B3).
- Importação automática de extratos bancários de corretoras em PDF/OFX.
- Gráficos avançados de análise técnica (velas, médias móveis) integrados na página do ativo.

### Fase 3 (Planejado)

- Relatórios fiscais inteligentes para declaração anual de Imposto de Renda.
- Calculadora de ganho de capital mensal para apuração de DARF em ações e FIIs.
- Sugestão inteligente de rebalanceamento de carteira baseada em metas de alocação.
