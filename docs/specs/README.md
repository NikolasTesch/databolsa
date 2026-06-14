# Specs — Spec-Driven Development (SDD)

Este projeto é orientado a **specs**: nenhuma unidade de trabalho (feature,
bugfix, refactor, infra) começa a ser codada sem uma **spec JSON** aprovada
aqui em `docs/specs/`. A spec é a fonte da verdade do *o quê* e do *porquê*
antes de existir código; o código serve a spec, não o contrário.

## Por que JSON (e não só prosa)

- **Estruturado e validável** — todo arquivo segue [`spec.schema.json`](./spec.schema.json),
  então campos obrigatórios (escopo, requisitos, critérios de aceite, plano de
  teste) nunca são esquecidos.
- **Rastreável** — cada spec amarra requisitos às regras de negócio do produto
  (`RN-01..RN-11`), às seções do [`../PRD.md`](../PRD.md) / [`../SPEC.md`](../SPEC.md)
  e aos ADRs em [`../adr/`](../adr).
- **Legível por máquina** — agentes (Claude Code) e ferramentas podem ler,
  validar e acompanhar o progresso (`status`, `tasks[].done`).

## Ciclo de vida de uma spec

```
draft → approved → in_progress → implemented → verified
                                              ↘ superseded (quando trocada por outra)
```

| status        | significado                                                        |
| ------------- | ------------------------------------------------------------------ |
| `draft`       | escrita, em discussão                                              |
| `approved`    | revisada e liberada para implementar                              |
| `in_progress` | implementação em andamento                                        |
| `implemented` | código escrito; falta validar/testar de ponta a ponta            |
| `verified`    | testes passando e critérios de aceite confirmados                 |
| `superseded`  | substituída por outra spec (preencher `supersedes` na nova)       |

## Fluxo por task (obrigatório)

1. **Crie a spec.** Copie [`0000-template.json`](./0000-template.json) para
   `NNNN-titulo-curto.json`, com `NNNN` sequencial. Preencha pelo menos os
   campos obrigatórios do schema.
2. **Amarre à documentação.** Em `related`, aponte PRD/SPEC/RN/ADR relevantes.
   Liste sempre `out_of_scope` para conter scope creep.
3. **Aprove.** Mude `status` para `approved` antes de codar (em trabalho solo,
   é a etapa de revisar a própria spec).
4. **Implemente seguindo a spec.** Marque `status: in_progress` e vá fechando
   `tasks[].done`. Se a realidade divergir da spec, **atualize a spec primeiro**.
5. **Teste.** Cubra todo o `test_plan`, incluindo os edge cases obrigatórios do
   domínio. APIs externas sempre mockadas — nunca rede em teste automatizado.
6. **Verifique e feche.** Confirme os `acceptance_criteria`, mude `status` para
   `implemented` → `verified` e atualize `updated`.

## Organização das pastas

As specs ficam em subpastas de acordo com o estágio atual:

| Pasta | Status cobertos | Quando mover |
| ----- | --------------- | ------------ |
| `pendentes/` | `draft`, `approved` | Ao criar ou aprovar uma spec |
| `em-andamento/` | `in_progress`, `implemented` | Ao iniciar a implementação |
| `finalizadas/` | `verified`, `superseded` | Ao confirmar os critérios de aceite |

O template e o schema ficam sempre na raiz (`0000-template.json`, `spec.schema.json`).

## Convenções de nomenclatura

- Arquivo: `NNNN-titulo-curto.json` (kebab-case). Ex.: `pendentes/0005-novo-recurso.json`.
- `id`: `SPEC-NNNN`, casando com o prefixo do arquivo.
- IDs internos: requisitos `REQ-NN`, critérios `AC-NN`, testes `TC-NN`, tarefas `T-NN`.
- Regras de negócio do produto: `RN-NN` (definidas no PRD, não renumere).

## Validação

A spec deve validar contra o schema. Com [`ajv`](https://ajv.js.org/) instalado:

```bash
npx ajv validate -s docs/specs/spec.schema.json -d "docs/specs/finalizadas/*.json" --spec=draft2020
```

Quando o tooling do monorepo existir, isto vira um script (`pnpm spec:validate`)
e idealmente um check de CI.

## Índice de specs

### Finalizadas (`finalizadas/`)

| ID        | Título                                              | Status   |
| --------- | --------------------------------------------------- | -------- |
| SPEC-0001 | Cálculo de posição e P/L no `packages/core`         | verified |
| SPEC-0002 | Scaffold do monorepo e design system base           | verified |
| SPEC-0003 | Infraestrutura Docker (dev + produção)               | verified |
| SPEC-0004 | Camada de consumo dos design tokens (Tailwind/CSS/Flutter) | verified |
| SPEC-0005 | Schema do banco de dados e migrations Prisma                      | verified |
| SPEC-0006 | Backend NestJS — autenticação JWT e CRUD de ativos/transações     | verified |
| SPEC-0007 | Integração de cotações com cache (brapi, CoinGecko, Finnhub, AwesomeAPI) | verified |
| SPEC-0008 | Web Next.js — fluxo completo e dashboard do portfólio             | verified |
| SPEC-0009 | Mobile Flutter — consulta e edição do portfólio                   | verified |
| SPEC-0010 | Testes E2E e pipeline de CI/CD                                    | verified |
| SPEC-0011 | Migração da API para Next.js Route Handlers                       | verified |
| SPEC-0012 | Home pública com busca de ativos e destaques de mercado           | verified |
| SPEC-0013 | Página de análise individual de ativo (/ativos/[ticker])          | verified |
| SPEC-0014 | Adicionar ativo pesquisado à carteira a partir da análise         | verified |

### Em andamento (`em-andamento/`)

_Nenhuma spec em andamento no momento._

### Pendentes (`pendentes/`)

_Nenhuma spec pendente no momento._

> Mantenha esta tabela ao adicionar specs.
