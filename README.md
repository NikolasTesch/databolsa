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
  /web        → Next.js (frontend + API Route Handlers + Prisma)
  /mobile     → Flutter + Dart (cliente complementar, ADR-0002)
/packages
  /core       → regras de negócio e cálculos financeiros (RN-01..RN-11)
  /types      → tipos/contratos compartilhados da API (TypeScript)
  /ui         → biblioteca de componentes + design tokens (Tailwind/Dart)
/docs         → PRD, SPEC, specs (SDD), ADRs e diagramas
```

> **Status:** MVP completo e verificado de ponta a ponta. Todas as specs de SPEC-0001 a SPEC-0039 foram implementadas e verificadas (incluindo autenticação, cotações com cache resiliente, conversão de moedas, importação de CSV, simulação, alertas de preço, benchmarks TWR e gestão de grupos de investimento).
> Consulte o roadmap detalhado em [SPEC.md](file:///c:/PASTA%20IMPORTANTE/TESCH_DEV/databolsa/docs/SPEC.md) e o índice de especificações em [docs/specs/README.md](file:///c:/PASTA%20IMPORTANTE/TESCH_DEV/databolsa/docs/specs/README.md).
