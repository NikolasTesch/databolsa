# MeuPatrimônio (nome provisório)

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
  /mobile     → React Native + Expo (cliente complementar)
  /api        → backend (NestJS ou FastAPI — decisão pendente, ver SPEC §2)
/packages
  /core       → regras de negócio e cálculos financeiros (RN-01..RN-11)
  /types      → tipos/contratos compartilhados da API
  /ui         → componentes compartilhados (se aplicável)
/docs         → PRD, SPEC, specs (SDD), ADRs e diagramas
```

> **Status:** pré-código. As pastas existem como esqueleto do setup; nenhum app
> foi scaffoldado ainda. Ver roadmap técnico em `docs/SPEC.md §11`.
