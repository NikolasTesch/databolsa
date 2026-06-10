# Documentação

Toda a documentação do projeto vive aqui. O desenvolvimento é **orientado a
specs (SDD)**: cada unidade de trabalho nasce de uma spec JSON em
[`specs/`](./specs) antes de qualquer código.

## Documentos de produto e arquitetura

- [`PRD.md`](./PRD.md) — requisitos de produto e regras de negócio (RN-01..RN-11).
- [`SPEC.md`](./SPEC.md) — especificação técnica (arquitetura, modelo de dados, API).

## Spec-Driven Development

- [`specs/`](./specs) — uma spec JSON por task, validada por
  [`specs/spec.schema.json`](./specs/spec.schema.json). O processo está em
  [`specs/README.md`](./specs/README.md). Comece copiando
  [`specs/0000-template.json`](./specs/0000-template.json).

## Decisões e diagramas

- [`adr/`](./adr) — Architecture Decision Records: decisões arquiteturais
  relevantes e seu contexto (ex.: escolha de Node/NestJS vs Python/FastAPI).
- [`diagrams/`](./diagrams) — diagramas de arquitetura, modelo de dados e fluxos.

## ADRs

Use o template em [`adr/0000-template.md`](./adr/0000-template.md). Numere os
arquivos sequencialmente (`0001-...`, `0002-...`) e nunca apague um ADR: para
reverter uma decisão, crie um novo ADR que marque o anterior como `Superseded`.

Decisões em aberto a registrar quando resolvidas:

- Linguagem do backend (NestJS vs FastAPI) — ver `SPEC.md §2`.
- Adoção (ou não) de monorepo com Turborepo.
