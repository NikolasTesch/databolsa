# ADR-0005 — Fonte de dados e estratégia de cache para fundamentalistas

**Data:** 2026-06-14
**Status:** Aceito
**Autores:** Nikolas

---

## Contexto

A página `/ativos/[ticker]` (SPEC-0013) precisa exibir indicadores fundamentalistas (P/L, P/VP, DY, ROE, Market Cap, etc.) para ativos de três classes distintas: B3 (STOCK_BR, FII, ETF, BDR), cripto (CRYPTO) e ações americanas (STOCK_US).

Os dados fundamentalistas diferem dos dados de cotação em dois aspectos críticos:

1. **TTL muito mais longo** — indicadores como P/L e P/VP mudam apenas quando há divulgação de resultados (trimestral/anual); não faz sentido refetchar a cada 5 minutos como fazemos com cotações.
2. **Fontes distintas por classe** — as fontes de cotação (brapi, CoinGecko, Finnhub) também expõem fundamentalistas, mas via endpoints e parâmetros diferentes.

Reutilizar a `QuoteCache` existente seria problemático: o schema `price Decimal` não comporta um payload JSON heterogêneo com múltiplos indicadores.

---

## Decisão

### Fontes por classe de ativo

| Classe | Fonte | Endpoint |
|---|---|---|
| STOCK_BR, FII, ETF, BDR | brapi.dev | `GET /api/quote/{symbol}?fundamental=true` |
| STOCK_US | Finnhub | `GET /stock/profile2?symbol={symbol}` + `GET /stock/metric?symbol={symbol}&metric=all` |
| CRYPTO | CoinGecko | `GET /coins/{id}` com `market_data=true` |

Critérios de escolha:
- **brapi:** única fonte com fundamentalistas para ativos B3 no free tier; retorna P/L, P/VP, DY, ROE, EV/EBITDA e dados de FII (P/VP, DY, vacância) no mesmo endpoint.
- **Finnhub:** free tier expõe perfil da empresa (market cap, setor) via `/stock/profile2` e métricas anuais (P/E, P/B, ROE, EPS) via `/stock/metric`. Dois requests sequenciais por ativo.
- **CoinGecko:** `/coins/{id}` retorna market cap, volume 24h, supply circulante/máximo e variações de 7d/30d em BRL diretamente.

### Cache separado: `AssetFundamentalsCache`

Um novo modelo Prisma `AssetFundamentalsCache` armazena o payload completo normalizado como `Json`. Motivações:

- **TTL 6 horas** — adequado para dados que mudam no máximo diariamente.
- **Payload heterogêneo** — cada classe tem campos diferentes; `Json` acomoda sem migração adicional.
- **Isolamento** — não polui a `QuoteCache` (TTL 5 min, campo `price Decimal`).
- **Unicidade por `(symbol, source)`** — mesmo padrão da `QuoteCache`, garante upsert idempotente.

### Estratégia de degradação graciosa (RN-10)

1. Cache válido (age < 6h): retornar sem chamar a fonte.
2. Cache expirado ou ausente: chamar a fonte com timeout 5s.
   - Sucesso: salvar no cache e retornar.
   - Falha: se existe cache expirado, retornar com `stale: true`.
   - Falha sem cache: retornar todos os campos como `null` (nunca lançar exceção para o cliente).

### Normalização de valores monetários

Todos os valores monetários dentro do JSON de `data` são serializados como `string` decimal (via `Decimal.toString()`), nunca como `number` float — mantendo a convenção não-negociável do projeto.

### Heurística de classe por ticker

O `FundamentalsService` detecta a classe do ativo pelo ticker antes de escolher o adapter:

1. Tickers presentes nos sets `BDR_TICKERS`, `ETF_TICKERS`, `FII_TICKERS` (de `curated-lists.ts`) → classe correspondente.
2. Presente no `CRYPTO_TICKER_MAP` (de `ticker-map.ts`) → CRYPTO.
3. Ticker com apenas letras maiúsculas e comprimento ≤ 5, sem sufixo numérico B3 → STOCK_US.
4. Default → STOCK_BR.

Esta heurística pode errar para tickers ambíguos; a página `/ativos/[ticker]` também aceita o query param `?class=` passado pela busca (SPEC-0012) para sobrescrever a inferência.

---

## Consequências

**Positivas:**
- Cache de 6h reduz drasticamente chamadas às APIs externas (protege free tier do Finnhub: 60 req/min).
- Degradação graciosa garante que falhas externas nunca quebram a UI.
- Schema flexível (`Json`) não requer migração ao adicionar novos indicadores.

**Negativas/Riscos:**
- brapi free tier pode não retornar todos os indicadores para todos os ativos — UI trata campos ausentes como `null` (exibido como `—`).
- Dois requests ao Finnhub por ativo US aumentam latência; mitigado pelo cache de 6h.
- Heurística de classe pode errar — documentado como risco na SPEC-0013.
