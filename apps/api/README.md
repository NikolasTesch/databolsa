# apps/api

Backend único que serve web e mobile e intermedeia as APIs externas de cotação.
**Chaves de API e lógica de negócio ficam exclusivamente aqui** — clientes nunca
chamam fontes externas diretamente.

Stack pendente: Node.js + NestJS **ou** Python + FastAPI (ver `docs/SPEC.md §2`;
registrar a escolha em `docs/adr/`).

Responsabilidades: auth (JWT + refresh), CRUD de ativos/operações, cache de
cotações (`QuoteCache`, TTL ~5–15 min, fallback `stale` em falha), endpoints de
resumo/histórico do patrimônio. Toda rota exceto `/auth/*` exige JWT e filtra por
`user_id`.
