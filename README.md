# DataBolsa

Acompanhamento de patrimônio em investimentos com lançamento manual de operações,
cotações via APIs externas e consolidação em BRL. Web (principal) + mobile.

Desenvolvimento **orientado a specs (SDD)**: cada task nasce de uma spec JSON em
[`docs/specs/`](./docs/specs) antes do código. Ver [`docs/specs/README.md`](./docs/specs/README.md).

Documentação:

- [`docs/PRD.md`](./docs/PRD.md) — requisitos de produto e regras de negócio (RN-01..RN-11)
- [`docs/SPEC.md`](./docs/SPEC.md) — especificação técnica (arquitetura, modelo de dados, API)
- [`docs/specs/`](./docs/specs) — specs JSON por task (SDD), validadas por schema
- [`docs/`](./docs) — ADRs, diagramas e documentação complementar
- [`CLAUDE.md`](./CLAUDE.md) — guia para o Claude Code operar neste repositório

## Estrutura do monorepo

```
/apps
  /web        → Next.js + TypeScript + Tailwind (cliente principal)
  /mobile     → Flutter + Dart (cliente complementar, ADR-0002)
  /api        → backend Node.js + NestJS (ADR-0001), ORM Prisma
/packages
  /core       → regras de negócio e cálculos financeiros (RN-01..RN-11)
  /types      → tipos/contratos compartilhados da API
  /ui         → componentes compartilhados + design tokens
/docs         → PRD, SPEC, specs (SDD), ADRs e diagramas
```

> **Status:** `packages/core` (cálculos financeiros, SPEC-0001) e `packages/ui` (design tokens, SPEC-0004) implementados e verificados. Infra Docker pronta. Próximo passo: schema Prisma + backend NestJS (SPEC-0005/0006).
> Ver roadmap técnico em `docs/SPEC.md §11` e specs em `docs/specs/pendentes/`.
