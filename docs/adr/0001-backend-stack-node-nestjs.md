# ADR 0001 — Stack do backend: Node.js + NestJS

- **Status:** Accepted
- **Data:** 2026-06-10
- **Decisores:** nikolasdtesch@gmail.com

## Contexto

O `SPEC.md §2` deixou em aberto a linguagem do backend: **Node.js + NestJS**
ou **Python + FastAPI**. A decisão precisa ser tomada agora porque o backend
(`/apps/api`) é a próxima grande entrega depois de `/packages/core`, e ela
condiciona ORM, tooling de teste, estrutura de pastas e CI.

Forças em jogo:

- O monorepo já usa TypeScript no web (Next.js); o mobile usa Flutter/Dart (ADR-0002).
- `/packages/core` e `/packages/types` são pensados para serem reusados pelos
  três apps — reuso direto exige a mesma linguagem no backend.
- Validação de entrada, JWT, cache de cotações e isolamento por `user_id`
  (RN-11) são todos requisitos padrão, bem suportados nos dois ecossistemas.
- Objetivo do projeto inclui aderência a vagas full-stack JS.

## Opções consideradas

- **Node.js + NestJS** — prós: unifica a linguagem (TS de ponta a ponta),
  reaproveita `packages/core`/`packages/types` sem reescrever, arquitetura
  modular opinativa (módulos, DI, guards, pipes) que combina com a divisão por
  domínio (auth, assets, transactions, portfolio, quotes), ORM Prisma com
  tipagem forte e migrations. Contras: cálculo numérico depende de lib decimal
  (não nativo) — mitigado já em `packages/core`.
- **Python + FastAPI** — prós: brilha em análise de dados/numérico, Pydantic
  para validação, ótimo para destacar a camada de dados. Contras: quebra a
  unificação de linguagem, impede reuso direto de `packages/core`/`types`
  (exigiria reescrever as regras RN-01..RN-11 em Python), duplica contratos.

## Decisão

Adotar **Node.js + NestJS** com **Prisma** (ORM) e **PostgreSQL**. Validação de
entrada com **Zod**, autenticação **JWT + refresh token**, testes com
**Jest** (alinhado ao tooling do monorepo). O motivo principal é a unificação
da linguagem: TypeScript de ponta a ponta permite reusar `packages/core`
(cálculos RN-01..RN-11) e `packages/types` (contratos da API) sem reescrita,
reduzindo divergência entre clientes e servidor.

## Consequências

- **Positivas:** uma só linguagem no monorepo; `packages/core` consumido
  diretamente pelo backend; contratos compartilhados em `packages/types`;
  estrutura modular do NestJS mapeia 1:1 nos domínios do produto.
- **Negativas / trade-offs aceitos:** cálculo monetário não é nativo em JS —
  obrigatório usar `decimal`/`numeric` (lib decimal) e nunca `float`, já
  previsto em `packages/core`; o diferencial de "análise de dados em Python"
  é abrido mão em favor de coesão da stack.
- **Impacto em docs:** `SPEC.md §2` deixa de ter decisão pendente; `CLAUDE.md`
  passa a referenciar Node+NestJS como definido. ORM = Prisma (descarta
  SQLAlchemy). CI roda lint + Jest.
