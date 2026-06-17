# ADR-0009 — Fontes e cache de séries de benchmark

**Status:** accepted  
**Data:** 2026-06-17

## Contexto

O endpoint de comparação com benchmarks precisa de séries históricas de quatro fontes heterogêneas (brapi.dev, BCB, Finnhub) com frequências de atualização diferentes (intraday vs. mensal). O retorno real do portfólio exigiria snapshots diários de valor de mercado, que não existem no sistema.

## Decisão

1. **Fontes:** IBOVESPA via brapi.dev (`^BVSP` histórico), CDI via BCB série 12, IPCA via BCB série 433, S&P500 via Finnhub (`SPY` candles semanais).

2. **Cache:** tabela `BenchmarkSeriesCache` com `(series_key, period)` como chave única. TTL diferenciado: 15min para IBOV/SPY (mudam intraday), 6h para CDI/IPCA (mudam diariamente/mensalmente). Séries são públicas — não violam RN-11 (compartilhadas entre usuários).

3. **Degradação stale:** na falha da fonte externa, retorna o último valor em cache com `is_stale=true` (RN-10). Sem propagação de erro 500 para o usuário.

4. **Retorno do portfólio:** aproximação por P&L% sobre custo médio (não TWR — time-weighted return). Limitação: não pondera o timing dos aportes. Aceito para MVP; fase 2 pode introduzir snapshots diários.

## Consequências

- Usuário recebe comparação significativa mesmo com arquitetura simples.
- Limitação do TWR deve ser comunicada na UI (campo `note` na resposta).
- Séries macro (CDI/IPCA) sofrem menos com o rate limit do free tier.
