# Asset Analysis Next Steps Plan

**Data:** 2026-07-02
**Status:** pronto para execucao
**Base:** SPEC-0044, ADR-0016 e primeiro incremento ja iniciado na main.

## Objetivo

Concluir a feature de analise de ativos com quatro frentes integradas:

1. Pagina publica `/ativos/[ticker]` enriquecida.
2. Comparacao de pares e painel de dividendos.
3. Screener fundamentalista no lugar do screener simples.
4. Diagnostico da carteira autenticada.

O trabalho deve continuar em TDD: teste falhando primeiro, implementacao minima, teste passando, depois refino.

## Estado Atual

Ja implementado:

- `apps/web/src/lib/analysis/asset-analysis.types.ts`
- `apps/web/src/lib/analysis/asset-analysis-score.ts`
- `apps/web/src/lib/analysis/asset-analysis.service.ts`
- `apps/web/src/app/api/market/[ticker]/analysis/route.ts`
- `apps/web/src/app/api/market/screener/route.ts`
- `apps/web/src/components/market/AnalysisSummary.tsx`
- `apps/web/src/components/market/IndicatorCategoryGrid.tsx`
- Testes focados para score, service, APIs e dois componentes.
- `docs/adr/0016-asset-analysis-score-and-screener.md`
- `docs/specs/pendentes/0044-asset-analysis-improvements.json`

Validado:

```bash
pnpm --filter web test -- asset-analysis-score.test.ts asset-analysis.service.test.ts market-analysis.test.ts market-screener.test.ts AnalysisSummary.test.tsx IndicatorCategoryGrid.test.tsx
```

Resultado observado: 6 arquivos de teste, 12 testes passando.

Pendencia conhecida fora do escopo deste incremento:

```text
pnpm --filter web exec tsc --noEmit
```

Falhou em testes antigos fora da feature:

- `apps/web/src/test/lib/market/highlights-data.test.ts`
- `apps/web/src/test/lib/market/market-cache.test.ts`

Motivo: assinaturas antigas usando `string` onde o codigo atual espera `AssetClass` ou `DataSource`.

## Regras de Execucao

- Nao fazer scraping de Investidor10, Status Invest ou outros sites.
- Nao usar textos como "comprar", "vender", "manter" ou recomendacao financeira.
- Usar `Decimal.js` em qualquer comparacao financeira.
- Rotas publicas `/api/market/*` nao podem consultar `User`, `Asset` ou `Transaction`.
- Diagnostico de carteira so pode consumir dados ja autorizados pelo endpoint de portfolio.
- UI nova deve usar tokens M3 atuais: `text-on-surface`, `text-on-surface-variant`, `border-border`, `bg-surface`, `bg-surface-container-low`.
- Nao usar tokens antigos: `text-content`, `text-content-muted`, `text-content-subtle`.
- Preservar alteracoes locais que nao fazem parte desta feature.

## Fase 1: Fechar Componentes da Pagina Publica

### 1.1 PeerComparisonTable

**Arquivos:**

- Criar: `apps/web/src/components/market/PeerComparisonTable.tsx`
- Criar teste: `apps/web/src/test/components/market/PeerComparisonTable.test.tsx`

**Comportamento:**

- Recebe `peers: PeerComparisonItem[]`.
- Renderiza tabela compacta com:
  - ticker
  - score
  - P/L
  - P/VP
  - DY
  - ROE
  - liquidez diaria
  - indicador stale/asOf
- Se `peers=[]`, renderiza estado vazio: "Sem pares comparaveis disponiveis."
- Cada ticker deve linkar para `/ativos/{ticker}`.
- Nao renderizar `NaN`; valor ausente vira `-`.

**Teste minimo:**

- Renderiza estado vazio.
- Renderiza dois pares ordenados como recebidos.
- Exibe `-` para indicadores nulos.
- Link do ticker aponta para `/ativos/PETR3`.

**Verificacao:**

```bash
pnpm --filter web test -- PeerComparisonTable.test.tsx
```

### 1.2 DividendAnalysisPanel

**Arquivos:**

- Criar: `apps/web/src/components/market/DividendAnalysisPanel.tsx`
- Criar teste: `apps/web/src/test/components/market/DividendAnalysisPanel.test.tsx`

**Comportamento:**

- Recebe:

```ts
type DividendItem = {
  paymentDate: string;
  value: string;
  type: string;
};
```

- Calcula com `Decimal.js`:
  - total recebido/pago por cota no periodo carregado
  - media por evento
  - quantidade de eventos
  - ultimo pagamento
- Renderiza estado vazio quando nao houver dividendos.
- Nao aparece para `CRYPTO`.
- Evitar estimativas agressivas; usar texto "historico carregado".

**Teste minimo:**

- Soma dois dividendos corretamente como string decimal.
- Exibe ultimo pagamento.
- Estado vazio nao quebra.
- `CRYPTO` retorna `null` ou estado oculto.

**Verificacao:**

```bash
pnpm --filter web test -- DividendAnalysisPanel.test.tsx
```

## Fase 2: Integrar Analise na Pagina `/ativos/[ticker]`

### 2.1 Atualizar pagina publica

**Arquivos:**

- Modificar: `apps/web/src/app/(public)/ativos/[ticker]/page.tsx`
- Possivelmente modificar: `apps/web/src/components/market/IndicatorGrid.tsx`

**Mudancas:**

- Importar `getAssetAnalysis`.
- Importar:
  - `AnalysisSummary`
  - `IndicatorCategoryGrid`
  - `PeerComparisonTable`
  - `DividendAnalysisPanel`
- Buscar `analysis` junto com quote/fundamentals/cambio quando possivel.
- Renderizar `AnalysisSummary` logo abaixo de `AssetHeader`.
- Renderizar `IndicatorCategoryGrid` na secao de indicadores.
- Renderizar `PeerComparisonTable` depois de setor/ativos relacionados.
- Renderizar `DividendAnalysisPanel` antes de `DividendsTable`.
- Manter historico, noticias, setor, ativos relacionados e eventos.

**Cuidados:**

- A pagina ja tem logica de quote/fundamentals; evitar chamadas duplicadas demais se possivel.
- Se a pagina ja estiver modificada por outro trabalho, preservar essas alteracoes.
- Se `getAssetAnalysis` falhar, a pagina nao deve cair se quote/fundamentals basicos estiverem disponiveis.

**Teste recomendado:**

- Criar ou atualizar teste de componente/page somente se houver padrao existente viavel.
- No minimo, validar por teste dos componentes e build.

**Verificacao:**

```bash
pnpm --filter web test -- AnalysisSummary.test.tsx IndicatorCategoryGrid.test.tsx PeerComparisonTable.test.tsx DividendAnalysisPanel.test.tsx
pnpm --filter web build
```

## Fase 3: Screener Fundamentalista UI

### 3.1 Criar cliente de API opcional

**Arquivos:**

- Modificar: `apps/web/src/lib/query-keys.ts`
- Opcional criar: `apps/web/src/lib/api/market.ts`

**Mudancas:**

- Adicionar query key:

```ts
market: {
  screener: (params: string) => ['market', 'screener', params] as const,
  analysis: (ticker: string, assetClass?: string) => ['market', 'analysis', ticker, assetClass] as const,
}
```

- Se criar API client, expor:

```ts
export async function getMarketScreener(params: URLSearchParams): Promise<ScreenerResponse>
```

### 3.2 FundamentalScreener

**Arquivos:**

- Criar: `apps/web/src/components/tools/FundamentalScreener.tsx`
- Modificar: `apps/web/src/components/tools/ScreenerAvaliador.tsx`
- Criar teste: `apps/web/src/test/components/tools/FundamentalScreener.test.tsx`

**UI esperada:**

- Controle segmentado de classe:
  - Acoes
  - FIIs
  - ETFs
  - BDRs
  - Stocks
  - Cripto
- Presets:
  - Dividendos
  - Graham
  - Qualidade
  - Baixa divida
  - Liquidez
- Filtros numericos compactos:
  - DY minimo
  - P/L maximo
  - P/VP maximo
  - ROE minimo
  - Liquidez minima
- Ordenacao:
  - score
  - DY
  - ROE
  - liquidez
- Tabela:
  - ticker
  - score
  - DY
  - P/L
  - P/VP
  - ROE
  - liquidez
  - status stale/asOf
  - acao "Abrir analise"

**Comportamento:**

- `ScreenerAvaliador` deve virar wrapper para `FundamentalScreener`.
- Mudanca de preset atualiza query da API.
- Loading com skeleton ou linhas reservadas.
- Estado vazio claro.
- Erro parcial mostra aviso discreto, sem bloquear resultados.

**Teste minimo:**

- Renderiza classes e presets.
- Clicar em "Dividendos" chama `/api/market/screener?...preset=dividends`.
- Renderiza resultado mockado com score e indicadores.
- Link "Abrir analise" aponta para `/ativos/MXRF11?class=FII`.

**Verificacao:**

```bash
pnpm --filter web test -- FundamentalScreener.test.tsx market-screener.test.ts
```

## Fase 4: Diagnostico da Carteira

### 4.1 PortfolioDiagnostics

**Arquivos:**

- Criar: `apps/web/src/components/portfolio/PortfolioDiagnostics.tsx`
- Criar teste: `apps/web/src/test/components/portfolio/PortfolioDiagnostics.test.tsx`

**Entrada:**

```ts
interface Props {
  summary: PortfolioSummaryDto;
  assets: Asset[];
}
```

**Secoes:**

- Resumo:
  - total de pontos de atencao
  - posicoes analisadas
  - posicoes com cotacao stale
  - maior concentracao
- Alertas por ativo:
  - alocacao acima de 25%
  - cotacao stale
  - P/L negativo relevante
  - posicao sem preco atual
  - yield on cost extremo apenas como ponto de atencao
- Ranking interno:
  - maior retorno total
  - maior perda
  - maior peso
  - maior yield on cost
- Link por ativo:
  - `/ativos/{ticker}`

**Regras:**

- Nao recalcular preco medio.
- Nao alterar semantica de venda.
- Nao buscar usuario dentro do componente.
- Usar apenas `summary.positions` e `assets` ja recebidos da pagina.
- Se patrimonio total zero, mostrar estado vazio sem divisao por zero.

**Teste minimo:**

- Sinaliza concentracao acima de 25%.
- Sinaliza `is_stale`.
- Sinaliza P/L negativo relevante.
- Estado vazio para carteira sem posicoes.
- Link de ativo aponta para `/ativos/PETR4`.

**Verificacao:**

```bash
pnpm --filter web test -- PortfolioDiagnostics.test.tsx
```

### 4.2 Integrar aba na carteira

**Arquivos:**

- Modificar: `apps/web/src/app/(app)/portfolio/page.tsx`

**Mudancas:**

- Adicionar tab:

```ts
{ id: 'diagnostico', label: 'Diagnostico' }
```

- Renderizar:

```tsx
{activeTab === 'diagnostico' && (
  <PortfolioDiagnostics summary={summary} assets={assets} />
)}
```

**Verificacao:**

```bash
pnpm --filter web test -- PortfolioDiagnostics.test.tsx
```

## Fase 5: Revisar Spec e Cobertura

### 5.1 Atualizar SPEC-0044

**Arquivo:**

- `docs/specs/pendentes/0044-asset-analysis-improvements.json`

**Mudancas:**

- Marcar `T-06` como `done` quando:
  - `AnalysisSummary`
  - `IndicatorCategoryGrid`
  - `PeerComparisonTable`
  - `DividendAnalysisPanel`
  estiverem prontos e testados.
- Marcar `T-07` quando `/ativos/[ticker]` estiver integrado.
- Marcar `T-08` quando screener UI estiver pronto.
- Marcar `T-09` quando diagnostico de carteira estiver pronto.
- Marcar `T-10` quando todos os testes da SPEC-0044 tiverem cobertura minima.

**Verificacao:**

```bash
pnpm exec ajv validate -s docs/specs/spec.schema.json -d docs/specs/pendentes/0044-asset-analysis-improvements.json --spec=draft2020 -c ajv-formats
```

## Fase 6: Verificacao Final

### 6.1 Testes focados da feature

Rodar:

```bash
pnpm --filter web test -- asset-analysis-score.test.ts asset-analysis.service.test.ts market-analysis.test.ts market-screener.test.ts AnalysisSummary.test.tsx IndicatorCategoryGrid.test.tsx PeerComparisonTable.test.tsx DividendAnalysisPanel.test.tsx FundamentalScreener.test.tsx PortfolioDiagnostics.test.tsx
```

Esperado:

```text
Todos os testes focados passam.
```

### 6.2 Typecheck

Rodar:

```bash
pnpm --filter web exec tsc --noEmit
```

Se continuar falhando nos testes antigos de market, corrigir em tarefa separada curta:

- `apps/web/src/test/lib/market/highlights-data.test.ts`
- `apps/web/src/test/lib/market/market-cache.test.ts`

Correcao esperada:

- Tipar mocks com `AssetClass` em vez de `string`.
- Tipar source como `DataSource` em vez de `string`.

### 6.3 Build

Rodar:

```bash
pnpm --filter web build
```

Esperado:

```text
Build passa, incluindo prisma generate e next build.
```

### 6.4 Smoke manual

Subir:

```bash
pnpm --filter web dev
```

Verificar:

```text
http://localhost:3000/ativos/PETR4
http://localhost:3000/ferramentas/screener
http://localhost:3000/portfolio?tab=diagnostico
```

Critico observar:

- Sem `NaN`.
- Sem texto de recomendacao financeira.
- Sem quebra em dados stale ou ausentes.
- Sem horizontal scroll indevido no mobile.
- Sem regressao nas secoes antigas da pagina de ativo.

## Ordem Recomendada de Execucao

1. `PeerComparisonTable`
2. `DividendAnalysisPanel`
3. Integracao em `/ativos/[ticker]`
4. `FundamentalScreener`
5. Wrapper `ScreenerAvaliador`
6. `PortfolioDiagnostics`
7. Aba `diagnostico` no portfolio
8. Atualizacao final da SPEC-0044
9. Correcao do typecheck antigo, se ainda bloquear build
10. Testes focados, typecheck, build e smoke manual

## Criterio de Conclusao

A feature pode ser considerada implementada quando:

- A pagina publica do ativo usa `AssetAnalysis`.
- O screener publico usa filtros fundamentalistas reais.
- A carteira tem aba de diagnostico sem vazar dados de usuario.
- Todos os textos evitam recomendacao financeira.
- Testes focados passam.
- `pnpm --filter web build` passa.
- SPEC-0044 esta atualizada para `implemented` ou `verified`, conforme o nivel de validacao realizado.

