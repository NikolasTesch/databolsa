# ADR-0013 — Envelope de resposta de erro da API

**Status:** Aceito  
**Data:** 2026-06-17  
**Autor:** Nikolas

---

## Contexto

As rotas da API retornam erros de forma heterogênea. Algumas devolvem apenas `{ "message": "..." }`, outras incluem campos adicionais ad-hoc. Não existe um código de máquina (string enum) nos erros, dificultando o tratamento programático por clientes (web, mobile).

Ao mesmo tempo, o campo `message` já está em uso por todos os clientes existentes — alterar sua posição ou removê-lo causaria quebras durante a transição.

## Decisão

Adotamos o seguinte envelope padronizado para **novas rotas e rotas que recebem PATCH novo**:

```json
{
  "message": "Texto legível em pt-BR",
  "error": {
    "code": "UPPER_SNAKE_CODE"
  }
}
```

Regras:

1. `message` permanece **no topo do objeto** para compatibilidade com clientes que já lêem `response.message`.
2. `error.code` é uma string em `UPPER_SNAKE_CASE` estável, adequada para `switch/case` e mapeamento de i18n no cliente.
3. Rotas existentes que retornam apenas `{ "message": "..." }` **não são migradas obrigatoriamente agora** — serão ajustadas progressivamente (refactor futuro, SPEC-0034 ou posterior).
4. O helper `jsonError(code, message, status)` em `lib/http/errors.ts` é a única forma de criar respostas de erro em código novo.

## Alternativas consideradas

| Alternativa | Descartada por |
|---|---|
| `{ "error": { "code": "...", "message": "..." } }` (message dentro de error) | Quebraria clientes web/mobile que lêem `response.message` diretamente |
| RFC 7807 Problem Details | Overhead de campo `type` (URI) desnecessário no MVP; pode ser adotado futuramente |
| Apenas `message` sem `code` | Não resolve tratamento programático — clientes precisam comparar strings |

## Consequências

- Novas rotas têm erros com código de máquina, facilitando testes e i18n.
- Clientes antigos continuam funcionando sem alteração (campo `message` preservado).
- Haverá período de inconsistência entre rotas antigas (só `message`) e novas (com `error.code`) — documentado e aceito.
- Migração completa fica registrada como dívida técnica a ser endereçada numa spec futura.

## Códigos de erro definidos até agora

| Código | HTTP | Significado |
|---|---|---|
| `UNAUTHORIZED` | 401 | JWT ausente ou inválido |
| `NOT_FOUND` | 404 | Recurso não encontrado ou não pertence ao usuário |
| `INVALID_PAYLOAD` | 400 | JSON malformado no body |
| `INVALID_TARGET_PRICE` | 400 | target_price inválido ou <= 0 em alerta |
| `INVALID_CONDITION` | 400 | condition não é ABOVE nem BELOW |
| `IMMUTABLE_FIELD` | 422 | Tentativa de alterar campo imutável (ticker, currency) |
| `INVALID_NAME` | 422 | name vazio ou ausente |
| `INVALID_DATA_SOURCE` | 400 | data_source fora do enum DataSource |
