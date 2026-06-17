# ADR-0014 — Série temporal do portfólio: TWR aproximado com câmbio atual

**Status:** aceito  
**Data:** 2026-06-17  
**Autores:** Nikolas  
**Relacionado:** SPEC-0035, ADR-0009

---

## Contexto

A rota `GET /api/portfolio/benchmark` compara o desempenho do portfólio do usuário com benchmarks (IBOV, CDI, IPCA, S&P500) em uma série temporal normalizada em base 100.

Até SPEC-0021, a série do portfólio era construída com apenas **2 pontos**:
- Ponto inicial: `{ date: primeiro_dia_do_período, value: '100' }`
- Ponto final: `{ date: hoje, value: '100 + retorno_total_pct' }`

Essa linha reta é **visualmente enganosa** quando plotada junto com a curva diária real de índices como o IBOV ou o CDI, que registram volatilidade, drawdowns e recuperações ao longo do período. O usuário não consegue identificar:
- Em quais períodos o portfólio superou ou ficou abaixo do benchmark
- Momentos de drawdown significativo
- O impacto de compras e vendas no desempenho relativo

---

## Decisão

Substituir a série de 2 pontos por uma **série temporal diária real**, calculada a partir de:
1. As transações do usuário (armazenadas no banco).
2. O histórico de preços diários de cada ativo, obtido das mesmas APIs usadas para cotações spot:
   - **brapi** `historicalDataPrice` para B3 (STOCK_BR, FII, ETF, BDR) e CRYPTO
   - **Finnhub** `/stock/candle` (resolução diária) para STOCK_US

A série é calculada pela função pura `buildPortfolioSeriesWithCurrencies` em `packages/core/src/timeseries.ts`, garantindo:
- Isolamento de efeitos colaterais (função pura, testável)
- Normalização base 100 no primeiro dia com posição diferente de zero
- Forward-fill para ativos sem preço em determinada data (feriados, não-pregão)

### Câmbio: corrente, não histórico

Para ativos em USD (STOCK_US), o valor em BRL é calculado usando o **câmbio atual** (`quoteService.getFxRate()`), **não** o câmbio histórico ponto a ponto.

**Razão:** Buscar o câmbio histórico diário exigiria uma chamada adicional à AwesomeAPI ou ao Banco Central para cada data da série, multiplicando o número de requisições. Para o MVP, o custo de complexidade e latência não justifica a precisão adicional.

**Limitação conhecida:** Para portfólios com parcela relevante em ativos USD e períodos longos (1Y, ALL), a valorização/desvalorização cambial ao longo do período não é refletida corretamente. A série mostrará o desempenho do preço do ativo em USD amplificado ou atenuado pelo câmbio atual — sem capturar o efeito de variação cambial no tempo.

Esta limitação é **documentada na resposta da API** (`note`) e aceita para o MVP.

---

## Alternativas consideradas

| Alternativa | Prós | Contras | Decisão |
|---|---|---|---|
| Série de 2 pontos (atual) | Zero chamadas extras, simples | Visualmente enganosa, sem utilidade real | Substituída |
| TWR diário com câmbio atual | Série real, custo de API controlado | Imprecisão cambial para USD longo prazo | **Adotada** |
| TWR diário com câmbio histórico | Máxima precisão | N×M chamadas extras, alta latência, cache complexo | Fase 2 |
| Modified Dietz puro | Padrão CFA para portfólios com aportes | Complexo, exige sub-período por fluxo de caixa | Fase 2 |

---

## Consequências

**Positivas:**
- Comparação visual justa e informativa entre portfólio e benchmarks.
- Lógica pura em `packages/core` — isolada, testável, reutilizável (mobile, análises futuras).
- Cache obrigatório por ativo (TTL 1h via `BenchmarkSeriesCache`) protege as cotas das APIs.
- Degradação graciosamente (RN-10): se o histórico de um ativo não estiver disponível, o ativo é ignorado na série sem quebrar o cálculo total.

**Negativas / Riscos:**
- Custo de API aumenta: para cada ativo no portfólio, uma chamada adicional ao histórico (mitigada pelo cache de 1h).
- Imprecisão para ativos USD em períodos longos com grande variação cambial.
- A série pode ter lacunas (dias sem preço para nenhum ativo) — filtrados automaticamente.

**Trabalho futuro (Fase 2):**
- Câmbio histórico ponto a ponto via AwesomeAPI ou BCB (série 1 — USD/BRL diário).
- TWR com sub-períodos por data de aporte (Modified Dietz completo).
