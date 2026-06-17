# ADR-0011 — Import CSV em duas fases: preview + commit

**Status:** accepted  
**Data:** 2026-06-17

## Contexto

Gravar transações em lote sem revisão prévia cria risco de dados sujos (datas erradas, valores em formato errado, SELLs que violam RN-02). Usuários de planilha esperam um fluxo de "ver antes de confirmar".

## Decisão

Fluxo de duas fases via `?mode=preview` e `?mode=commit` no mesmo endpoint:

- **Preview** (sem persistir): parse do CSV + validação RN-02 sobre timeline combinada (existente + importado). Retorna linhas válidas e erros por linha.
- **Commit**: reenvia o mesmo CSV; o servidor re-parseia e re-valida (stateless entre fases), grava apenas as linhas válidas em `prisma.$transaction` (atômico).

Stateless: sem estado intermediário no servidor entre preview e commit. O payload é reenviado pelo cliente.

## Consequências

- UX segura — usuário vê o que será importado antes de confirmar.
- Custo de re-parsear no commit (aceitável — dados pequenos).
- Sem estado de sessão server-side entre as fases.
- Chave de deduplicação básica: `(asset_id, type, date, quantity, unit_price)` — não implementada no MVP; usuário deve evitar re-submissão.
