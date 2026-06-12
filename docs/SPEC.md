# SPEC.md — MeuPatrimônio (nome provisório)

> Especificação técnica · Versão 0.1 — MVP
> Documento companheiro do PRD.md

## 1. Arquitetura geral

Arquitetura cliente-servidor com um backend único servindo dois clientes (web e mobile) e intermediando as APIs externas de cotação. As chaves de API externas e a lógica de negócio ficam **exclusivamente no backend** — os clientes nunca falam direto com as fontes de dados.

```
┌─────────────┐     ┌─────────────┐
│  Web (Next) │     │Mobile (Flut)│
└──────┬──────┘     └──────┬──────┘
       │   HTTPS / REST    │
       └─────────┬─────────┘
                 ▼
        ┌──────────────────┐        ┌──────────────────┐
        │   Backend API    │──────► │  PostgreSQL      │
        │  (auth, regras,  │        └──────────────────┘
        │   cache, cálculo)│
        └────────┬─────────┘
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
| Backend | **Node.js + NestJS** (decidido — ADR-0001) | Unifica a linguagem (TS de ponta a ponta); reusa `packages/core` e `packages/types` sem reescrita |
| Banco de dados | PostgreSQL | Relacional, transacional, ideal para dados financeiros |
| ORM | **Prisma** (decidido — ADR-0001) | Migrations e tipagem do schema |
| Autenticação | JWT + refresh token | Padrão para clientes web + mobile |
| Monorepo (opcional) | Turborepo | Compartilhar tipos e lógica entre web e mobile |

> **Decisão tomada ([ADR-0001](adr/0001-backend-stack-node-nestjs.md)):** backend em **Node.js + NestJS** com **Prisma**, para unificar a stack em TypeScript e reusar `packages/core`/`packages/types` sem reescrita. A opção Python + FastAPI foi descartada.
>
> **Decisão tomada ([ADR-0002](adr/0002-mobile-flutter.md)):** mobile em **Flutter + Dart**, substituindo React Native + Expo. O app mobile é cliente puro da API REST, tornando a perda de reaproveitamento de código TS marginal frente ao ganho de performance nativa.

## 3. Estrutura de pastas (monorepo sugerido)

```
/apps
  /web        → Next.js
  /mobile     → Flutter + Dart (ADR-0002)
  /api        → backend Node.js + NestJS (ADR-0001)
/packages
  /core       → regras de negócio e cálculos (compartilhável)
  /types      → tipos/contratos da API
  /ui         → componentes compartilhados (se aplicável)
```

Manter os **cálculos financeiros em `/packages/core`** permite testá-los isoladamente e reusá-los, e é um ótimo ponto de demonstração técnica. `packages/ui` é exclusivo do web (Flutter não compartilha componentes React); tipos de contrato para o mobile são gerados em Dart via OpenAPI (`openapi-generator-cli dart-dio`) e ficam em `apps/mobile/lib/api/`.

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

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/register` | Cria conta |
| POST | `/auth/login` | Autentica, retorna tokens |
| POST | `/auth/refresh` | Renova token |
| GET | `/assets` | Lista ativos do usuário com métricas calculadas |
| POST | `/assets` | Adiciona ativo à carteira |
| GET | `/assets/:id` | Detalhe de um ativo + operações |
| POST | `/assets/:id/transactions` | Registra operação |
| PATCH | `/transactions/:id` | Edita operação |
| DELETE | `/transactions/:id` | Exclui operação |
| GET | `/portfolio/summary` | Patrimônio total, alocação, métricas consolidadas |
| GET | `/portfolio/history` | Série temporal para o gráfico de evolução |

Todas as rotas (exceto `/auth/*`) exigem JWT e filtram por `user_id`.

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

## 10.1 Docker (SPEC-0003)

| Arquivo | Propósito |
|---------|-----------|
| `docker-compose.yml` | Dev e produção: serviços `postgres`, `api`, `web` |
| `docker-compose.override.yml` | Hot-reload em dev (monta `src/` como volume) |
| `apps/api/Dockerfile` | Multi-stage: `deps → dev → build → runner` (NestJS) |
| `apps/web/Dockerfile` | Multi-stage: `deps → dev → build → runner` (Next.js standalone) |
| `apps/api/entrypoint.sh` | Executa `prisma migrate deploy` antes de subir a API |
| `.dockerignore` (raiz) | Exclui `node_modules`, `.env`, docs e artefatos de build |

**Contexto de build:** sempre a raiz do monorepo (`docker build -f apps/api/Dockerfile .`), para que `packages/core` e `packages/types` sejam copiados corretamente.

**Uso rápido:**
```bash
# Subir ambiente de dev completo (postgres + api hot-reload + web hot-reload)
docker compose up

# Build de produção da API
docker build -f apps/api/Dockerfile -t databolsa-api .

# Build de produção do Web
docker build -f apps/web/Dockerfile -t databolsa-web .
```

> `docker-compose.override.yml` é carregado automaticamente pelo Compose em dev.
> Em CI/produção, usar `docker compose -f docker-compose.yml up`.

## 11. Roadmap técnico

1. Schema do banco + migrations.
2. `/packages/core` com cálculos e testes unitários (antes da UI).
3. Backend: auth + CRUD de ativos/operações + endpoint de resumo.
4. Integração de cotações com cache.
5. Web (Next.js): fluxo completo + dashboard.
6. Mobile (Flutter): consulta + edição.
7. E2E e CI.
8. (Fase 2) Integração Open Finance via Pluggy.
