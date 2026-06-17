# ADR-0010 — Estratégia de avaliação de alertas de preço (lazy)

**Status:** accepted  
**Data:** 2026-06-17

## Contexto

Alertas de preço precisam ser verificados contra a cotação atual. No MVP a infra é single-instance sem worker/cron dedicado. Um polling periódico independente adicionaria complexidade operacional sem ganho proporcional.

## Decisão

Avaliação **lazy**: `evaluateAlerts()` é chamado no `GET /api/alerts`, aproveitando que o usuário acabará de acessar o app para ver seus alertas. A cotação vem do `QuoteService` (cache com TTL — RN-10), sem forçar fetch extra.

Ao cruzar o threshold: `is_active=false`, `triggered_at=now`. Não re-dispara.

## Consequências

- Zero infra nova; alinhado com ADR-0008 (rate limiting in-memory).
- **Limitação aceita:** alerta só dispara quando o usuário abre o app. Documentado na UI.
- Cotação stale ainda avalia o alerta (preço pode estar defasado — RN-10 aceito).
- Fase 2: migrar para cron/worker dedicado com push notification.
