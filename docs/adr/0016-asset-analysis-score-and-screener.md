# ADR-0016 - Score de analise de ativos e screener fundamentalista

**Data:** 2026-07-02
**Status:** Aceito
**Autores:** Arquiteto DataBolsa

---

## Contexto

A pagina publica `/ativos/[ticker]` ja consulta cotacao, fundamentos, historico, dividendos e setor. O screener publico atual (`ScreenerAvaliador`) usa apenas destaques de mercado por alta/baixa, sem filtros fundamentalistas. A carteira autenticada ja calcula posicoes, P/L, patrimonio e alocacao a partir das regras RN-01..RN-11 no core e nos endpoints de portfolio.

A melhoria pedida deve aproximar a experiencia de analise de ativos dos padroes de Investidor10/Status Invest, mas sem scraping, sem recomendacao de compra/venda e sem misturar dados publicos de mercado com dados privados de usuario. A base existente de `AssetFundamentalsCache` e `getFundamentals` (ADR-0005) deve continuar sendo a fonte canonica de indicadores fundamentalistas.

---

## Decisao

### Contrato canonico `AssetAnalysis`

Criar uma camada `apps/web/src/lib/analysis/*` acima de fundamentos, cotacao, setor e listas curadas. O contrato publico sera:

```ts
type AnalysisSignalLevel = 'positive' | 'neutral' | 'warning' | 'negative' | 'unknown';
type AnalysisCategory = 'valuation' | 'quality' | 'dividends' | 'risk' | 'liquidity' | 'momentum' | 'data';

interface AnalysisScoreBreakdown {
  category: AnalysisCategory;
  score: string; // decimal string 0..100
  level: AnalysisSignalLevel;
  weight: string; // decimal string 0..1
  reasons: string[];
  missing: string[];
}

interface AnalysisAlert {
  id: string;
  level: 'warning' | 'negative' | 'unknown';
  title: string;
  description: string;
  category: AnalysisCategory;
}

interface PeerComparisonItem {
  ticker: string;
  name?: string | null;
  sector?: string | null;
  industry?: string | null;
  indicators: Pick<NormalizedFundamentals, 'pe' | 'pb' | 'dy' | 'roe' | 'netMargin' | 'dailyLiquidity'>;
  totalScore: string;
  scoreLevel: AnalysisSignalLevel;
  stale: boolean;
  asOf: string;
}

interface AssetAnalysis {
  ticker: string;
  name: string;
  assetClass: AssetClass;
  sector?: string | null;
  industry?: string | null;
  asOf: string;
  stale: boolean;
  fundamentals: NormalizedFundamentals;
  totalScore: string; // decimal string 0..100
  scoreLevel: AnalysisSignalLevel;
  breakdown: AnalysisScoreBreakdown[];
  alerts: AnalysisAlert[];
  peers: PeerComparisonItem[];
}
```

Scores e pesos devem ser calculados com `Decimal.js`; o retorno para API/UI permanece como string decimal. Componentes podem converter para number apenas para desenho visual sem impacto financeiro.

### Pesos e heuristicas por classe

O score e interpretativo, nao prescritivo. Ele mede qualidade dos dados e sinais relativos, nao indica "comprar", "vender" ou "manter".

| Classe | Categorias e pesos | Heuristicas principais |
|---|---|---|
| STOCK_BR, STOCK_US, BDR | valuation 30%, quality 30%, dividends 20%, risk 20% | P/L entre 1 e 12, P/VP <= 2.5, ROE >= 12%, margem liquida >= 8%, DY entre 3% e 12%, divida/PL > 2 gera alerta |
| FII | valuation 25%, dividends 30%, liquidity 20%, risk 25% | P/VP entre 0.75 e 1.05, DY entre 6% e 14%, liquidez diaria > 1.000.000, vacancia > 15% gera alerta |
| ETF | cost 35%, liquidity 35%, risk 15%, data 15% | taxa de administracao <= 0.5%, liquidez diaria > 1.000.000, ausencia de patrimonio/liquidez reduz confianca |
| CRYPTO | liquidity 35%, momentum 30%, risk 25%, data 10% | volume 24h > 100.000.000, variacoes 7d e 30d positivas, market cap ou volume ausente gera alerta |

Para indicadores ausentes:

- categorias sem nenhum indicador aplicavel recebem `score: "0"` e `level: "unknown"`;
- `totalScore` deve ser `"0"` e `scoreLevel: "unknown"` quando nao houver indicadores suficientes;
- alertas devem explicar falta de dados sem bloquear a pagina;
- nenhum calculo pode produzir `NaN`, `Infinity` ou divisao por zero visivel.

### Cache vs runtime

Permanecem em cache:

- `QuoteCache`: cotacoes e cambio, TTL curto de 5 a 15 minutos, com fallback stale conforme RN-10.
- `AssetFundamentalsCache`: payload normalizado de fundamentos, TTL de 6 horas, com fallback stale conforme ADR-0005.

Sao derivados em runtime:

- score total, breakdown, alertas e comparacao de pares;
- filtros e ordenacao do screener;
- diagnosticos personalizados de carteira, pois dependem de `summary.positions`, P/L, patrimonio e alocacao ja autorizados por usuario.

Nao sera criado cache persistente especifico para `AssetAnalysis` nesta unidade. Isso evita invalidacao dupla entre fundamentos, cotacao e carteira. Se houver problema de performance depois, a evolucao deve ser um cache curto por ticker/classe com invalidador explicito, em nova ADR.

### API publica

Criar endpoints publicos em Next.js Route Handlers:

- `GET /api/market/[ticker]/analysis?class=ASSET_CLASS`
- `GET /api/market/screener?class=...&preset=...&minDy=...&maxPe=...&maxPb=...&minRoe=...&minLiquidity=...&sort=...&limit=...`

Essas rotas nao consultam tabelas de usuario (`User`, `Asset`, `Transaction`) e nao exigem autenticacao. Elas usam apenas dados de mercado, cache de mercado/fundamentos e listas curadas. Falhas parciais em pares ou candidatos do screener devem retornar resultados parciais via `Promise.allSettled`.

### Integracao com carteira

A carteira autenticada pode exibir diagnosticos usando os dados ja retornados pelos endpoints autorizados de portfolio, sempre filtrados por `user_id` ou autorizacao de grupo conforme RN-11/RN-14. O componente de diagnostico recebe posicoes ja autorizadas e, quando precisar de analise publica por ticker, usa o contrato `AssetAnalysis` sem enviar dados privados para rotas publicas.

Os calculos de preco medio, quantidade, valor investido, valor atual, P/L, patrimonio e alocacao continuam vindo da camada existente, respeitando SPEC §7:

- `qtd_atual = soma compras - soma vendas`;
- venda maior que posicao segue rejeitada antes do diagnostico;
- venda nao altera preco medio das unidades remanescentes;
- `valor_atual = qtd_atual x cotacao_atual`;
- `patrimonio_total = soma valor_atual_BRL`;
- `alocacao_ativo_% = valor_atual_BRL_ativo / patrimonio_total x 100`.

---

## Consequencias

**Positivas**

- Um unico contrato atende pagina publica, screener e diagnostico de carteira.
- A logica de score fica testavel como funcao pura e isolada de React.
- O cache existente continua sendo a fronteira de resiliencia de RN-10.
- Dados privados de carteira nao entram em rotas publicas, preservando RN-11.

**Negativas/Riscos**

- O screener pode ser lento se buscar muitos tickers sem um universo curado pequeno; o endpoint deve limitar a 100 candidatos e retornar parcial em falha.
- Scores baseados em dados gratuitos podem variar muito por cobertura de fonte; o UI deve destacar "dados insuficientes".
- Heuristicas simples podem parecer recomendacao financeira se a linguagem da UI for mal escolhida; textos devem usar "sinais", "pontos de atencao" e "dados disponiveis", nunca "compre", "venda", "barato" como ordem de acao.

**Fora do escopo desta decisao**

- Scraping de Investidor10, Status Invest ou qualquer outro site.
- Provedor pago de dados fundamentalistas.
- Open Finance, imposto de renda, ordens de compra/venda, realtime intraday.
- Cache persistente de score/analise.
