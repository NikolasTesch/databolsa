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

ADRs registrados:

- [`adr/0001-backend-stack-node-nestjs.md`](./adr/0001-backend-stack-node-nestjs.md) — Backend original em Node.js + NestJS (Superseded pelo ADR-0004).
- [`adr/0002-mobile-flutter.md`](./adr/0002-mobile-flutter.md) — Definição do app mobile em Flutter + Dart.
- [`adr/0003-web-auth-session-bff.md`](./adr/0003-web-auth-session-bff.md) — Autenticação de sessão via cookies HttpOnly (BFF).
- [`adr/0004-migrate-api-to-nextjs.md`](./adr/0004-migrate-api-to-nextjs.md) — Migração da API NestJS para Next.js Route Handlers (eliminação do apps/api).
- [`adr/0005-fundamentals-data-source-and-cache.md`](./adr/0005-fundamentals-data-source-and-cache.md) — Definição das fontes de dados para cotações e caching.
- [`adr/0006-mobile-public-dio.md`](./adr/0006-mobile-public-dio.md) — Arquitetura de cliente HTTP no mobile (Dio).
- [`adr/0007-expandir-moedas-conversor.md`](./adr/0007-expandir-moedas-conversor.md) — Expansão de moedas fiduciárias e cripto no conversor de moedas.
- [`adr/0008-rate-limiting-in-memory.md`](./adr/0008-rate-limiting-in-memory.md) — Rate limiting in-memory para proteção de endpoints da API.
- [`adr/0009-benchmark-sources-and-cache.md`](./adr/0009-benchmark-sources-and-cache.md) — Armazenamento de dados históricos e fontes de benchmark (IBOV, CDI, etc.).
- [`adr/0010-price-alerts-lazy-evaluation.md`](./adr/0010-price-alerts-lazy-evaluation.md) — Avaliação preguiçosa de gatilhos de alertas de preços.
- [`adr/0011-csv-import-preview-commit.md`](./adr/0011-csv-import-preview-commit.md) — Fluxo em duas etapas (preview e commit) para importação de CSV.
- [`adr/0012-csv-date-format-disambiguation.md`](./adr/0012-csv-date-format-disambiguation.md) — Heurísticas para desambiguação de formatos de data em importações CSV.
- [`adr/0013-api-error-envelope.md`](./adr/0013-api-error-envelope.md) — Envelope de erro unificado da API.
- [`adr/0014-portfolio-twr-time-series.md`](./adr/0014-portfolio-twr-time-series.md) — Implementação de série temporal real ponderada pelo tempo (TWR) para o dashboard do portfólio.
- [`adr/0015-grupos-acesso-de-lider-ao-portfolio-de-membro.md`](./adr/0015-grupos-acesso-de-lider-ao-portfolio-de-membro.md) — Permissões de acesso de líder a portfólio de membros em grupos.
