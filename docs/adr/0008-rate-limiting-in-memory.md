# ADR-0008 — Rate Limiting In-Memory para Endpoints Públicos de Market

**Status:** Aceito
**Data:** 2026-06-16
**Autores:** arquiteto

## Contexto

Os endpoints `/api/market/indices`, `/api/market/highlights` e `/api/market/news` são públicos (sem JWT). Qualquer cliente pode fazer requisições em volume ilimitado, o que pode esgotar os limites das APIs externas gratuitas (brapi, CoinGecko, Finnhub, AwesomeAPI) e sobrecarregar o servidor.

## Decisão

Implementar rate limiting in-memory usando um `Map<string, { count, resetAt }>` como singleton de módulo. Parâmetros:

- **Janela:** 60 segundos
- **Limite:** 30 requisições por IP por janela
- **Chave:** `endpoint:IP` (ex: `market:highlights:1.2.3.4`)
- **Bypass:** `NODE_ENV === 'test'` sempre retorna `allowed: true`
- **Resposta ao exceder:** HTTP 429 com header `Retry-After: <segundos>`
- **Extração de IP:** header `x-forwarded-for` (primeiro valor); fallback `127.0.0.1`

## Alternativas consideradas

| Alternativa | Motivo para rejeitar |
|---|---|
| Redis + rate-limit library | Adiciona dependência de infra (Redis) e complexidade de configuração. Desnecessário para MVP single-instance. |
| Sem rate limiting | Risco real de esgotar cota das APIs externas gratuitas em caso de uso indevido. |
| Middleware Next.js global | Mais complexo de configurar por rota; dificulta bypass em testes. |

## Consequências

**Positivas:**
- Implementação simples, zero dependências novas.
- Fácil de testar (bypass por `NODE_ENV`).
- Protege as APIs externas e o servidor contra abuso.

**Negativas / Limitações:**
- O estado não persiste entre reinicializações do processo.
- Em um deploy multi-instância (horizontal scaling), cada instância tem seu próprio contador — o limite efetivo seria `30 × N instâncias` por IP. Aceitável para MVP single-instance Docker.
- Sem persistência de blacklist (IPs maliciosos são liberados na próxima janela).

## Migração futura (Fase 2)

Se o projeto escalar para múltiplas instâncias, substituir o `Map` por um cliente Redis com `INCR` + `EXPIRE`. A interface `checkRateLimit(key, options)` permanece idêntica — apenas a implementação interna muda.
