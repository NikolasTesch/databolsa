# Asset Analysis Future Improvements Roadmap

**Data:** 2026-07-02
**Status:** roadmap futuro
**Base:** melhorias planejadas apos concluir SPEC-0044.

## Objetivo

Este documento lista proximas implementacoes para evoluir a analise de ativos depois da entrega atual de `AssetAnalysis`, screener fundamentalista e diagnostico de carteira.

O foco e transformar o Databolsa em uma plataforma de analise mais profunda, comparavel em utilidade a referencias como Investidor10 e Status Invest, mas mantendo as regras do projeto:

- sem scraping;
- sem recomendacao de compra/venda;
- sem calculos financeiros com float;
- sem misturar dados publicos com dados privados de carteira;
- com cache e degradacao graciosa para fontes externas.

## Roadmap Resumido

1. Historico de indicadores fundamentalistas.
2. Comparador avancado de ativos.
3. Watchlist analitica com alertas de fundamento.
4. Tese de investimento do usuario.
5. Eventos corporativos e calendario de resultados.
6. Analise setorial agregada.
7. Simulacoes de dividendos e reinvestimento.
8. Qualidade de dados e cobertura de fontes.
9. Relatorios exportaveis.
10. Experiencia mobile da analise.

## 1. Historico de Indicadores Fundamentalistas

### Problema

A analise atual trabalha com o snapshot mais recente dos fundamentos. Isso mostra a situacao atual, mas nao responde se o ativo esta melhorando, piorando ou oscilando ao longo do tempo.

### Implementacao Proposta

Criar uma serie historica de indicadores:

- P/L historico.
- P/VP historico.
- DY historico.
- ROE historico.
- margem liquida historica.
- divida/PL historica.
- patrimonio e vacancia para FIIs.

### Arquitetura

Criar novo cache:

```text
AssetFundamentalsSeriesCache
  symbol
  source
  period
  data Json
  fetched_at
```

Ou, se a fonte gratuita nao suportar historico completo, iniciar com snapshots periodicos diarios/semanais a partir do momento em que o usuario consulta o ativo.

### UI

Na pagina `/ativos/[ticker]`, adicionar secao "Evolucao dos indicadores":

- grafico de linha para P/L, P/VP, DY e ROE;
- seletor de periodo: 1A, 3A, 5A;
- mensagem clara quando houver pouca amostra.

### Testes

- normalizacao de serie historica;
- ausencia de dados nao gera `NaN`;
- cache stale continua renderizando;
- grafico recebe strings decimais convertidas apenas para visualizacao.

## 2. Comparador Avancado de Ativos

### Problema

O comparador atual da carteira foca nas posicoes do usuario. Falta um comparador publico para ativos pesquisados, com fundamentos, dividendos, risco e historico.

### Implementacao Proposta

Criar pagina:

```text
/ferramentas/comparador-avancado
```

Ou evoluir `/ferramentas/comparador`.

### Funcionalidades

- comparar ate 6 ativos;
- buscar tickers publicos;
- comparar por classe;
- destacar melhor/pior indicador sem recomendacao financeira;
- comparar historico de preco normalizado;
- comparar fundamentos lado a lado;
- comparar dividendos e yield;
- exportar tabela em CSV.

### API

Reutilizar:

```text
GET /api/market/[ticker]/analysis
GET /api/market/[ticker]/history
GET /api/market/[ticker]/dividends
```

Criar apenas se necessario:

```text
GET /api/market/compare?tickers=PETR4,VALE3,ITUB4
```

### Testes

- maximo de 6 ativos;
- tickers invalidos rejeitados;
- falha parcial em um ticker nao quebra a comparacao;
- ativos de classes diferentes exibem apenas indicadores comuns ou separam categorias.

## 3. Watchlist Analitica com Alertas de Fundamento

### Problema

A wishlist/lista de desejos acompanha ativos, mas pode evoluir para uma ferramenta ativa de monitoramento analitico.

### Implementacao Proposta

Adicionar alertas alem de preco:

- DY acima/abaixo de limite;
- P/VP abaixo de limite;
- P/L abaixo/acima de limite;
- ROE acima de limite;
- score abaixo de limite;
- cotacao/fundamentos stale por muito tempo.

### Arquitetura

Extender `PriceAlert` ou criar novo modelo:

```text
AnalysisAlertRule
  user_id
  ticker
  metric
  condition
  target_value Decimal
  is_active
  triggered_at
```

Preferencia: criar novo modelo para nao misturar alerta de preco com alerta fundamentalista.

### UI

Na wishlist:

- coluna "score";
- coluna "ultimo fundamento";
- chips de alerta ativo;
- botao "Criar alerta de fundamento".

### Testes

- isolamento por `user_id`;
- trigger lazy sem worker;
- valores com Decimal;
- alerta de outro usuario retorna 404.

## 4. Tese de Investimento do Usuario

### Problema

Analise numerica ajuda, mas o usuario tambem precisa registrar por que acompanha ou possui um ativo.

### Implementacao Proposta

Adicionar notas estruturadas por ativo:

- tese;
- riscos percebidos;
- preco de referencia;
- horizonte;
- motivo de entrada;
- criterio de revisao;
- data da ultima revisao.

### Modelo

```text
AssetThesis
  id
  user_id
  ticker
  asset_id?
  thesis
  risks
  target_price Decimal?
  review_date DateTime?
  created_at
  updated_at
```

### UI

Na carteira e na pagina do ativo:

- painel "Minha tese";
- historico de revisoes;
- aviso quando a tese esta sem revisao ha mais de X meses.

### Testes

- CRUD isolado por usuario;
- ticker publico sem `asset_id` permitido;
- target price como Decimal;
- revisao de outro usuario retorna 404.

## 5. Eventos Corporativos e Calendario de Resultados

### Problema

A pagina de ativo ja tem bloco de eventos, mas ele ainda e principalmente placeholder. Eventos sao parte central de analise.

### Implementacao Proposta

Adicionar calendario para:

- data com;
- data ex;
- pagamento de dividendos/JCP;
- resultados trimestrais;
- assembleias;
- grupamentos/desdobramentos;
- comunicados relevantes.

### Fontes

Priorizar fontes oficiais ou APIs permitidas:

- B3 quando disponivel;
- CVM dados abertos;
- provedores ja usados se suportarem eventos;
- fallback manual/curado para assets principais.

### Modelo

```text
CorporateEventCache
  symbol
  source
  event_type
  event_date
  data Json
  fetched_at
```

### UI

- agenda geral publica;
- eventos na pagina do ativo;
- eventos dos ativos da carteira no dashboard;
- filtros por tipo.

### Testes

- cache TTL;
- eventos duplicados deduplicados;
- datas em timezone correto;
- fallback stale.

## 6. Analise Setorial Agregada

### Problema

Comparar um ativo com pares e util, mas o usuario tambem precisa entender o setor inteiro.

### Implementacao Proposta

Criar paginas:

```text
/setores
/setores/[slug]
```

### Funcionalidades

- mediana de P/L, P/VP, DY, ROE por setor;
- ranking de ativos do setor;
- dispersao de valuation;
- concentracao da carteira por setor;
- maiores altas/baixas do setor;
- eventos proximos do setor.

### API

```text
GET /api/market/sectors
GET /api/market/sectors/[slug]
```

### Testes

- medianas com Decimal;
- setor sem ativos tem estado vazio;
- falhas parciais em ativos nao quebram agregacao;
- carteira continua isolada por usuario.

## 7. Simulacoes de Dividendos e Reinvestimento

### Problema

Investidores de renda precisam visualizar cenarios de renda passiva, especialmente com aportes e reinvestimento.

### Implementacao Proposta

Criar simulador:

```text
/ferramentas/proventos-simulador
```

### Entradas

- ticker ou carteira inteira;
- aporte mensal;
- yield estimado;
- crescimento anual de dividendos;
- reinvestimento ligado/desligado;
- horizonte em anos.

### Saidas

- renda mensal estimada;
- patrimonio estimado;
- dividendos acumulados;
- grafico ano a ano.

### Regras

- Mostrar como simulacao hipotetica.
- Nao usar como promessa de retorno.
- Todos os calculos com Decimal.

### Testes

- aporte zero;
- yield zero;
- reinvestimento on/off;
- horizonte invalido;
- Decimal sem perda relevante.

## 8. Qualidade de Dados e Cobertura de Fontes

### Problema

A confianca da analise depende da cobertura das fontes. O usuario deve entender quando a leitura e forte ou incompleta.

### Implementacao Proposta

Criar camada de qualidade de dados:

```ts
interface DataQualityReport {
  coverageScore: string;
  missingFields: string[];
  staleFields: string[];
  sourceWarnings: string[];
  lastUpdatedAt: string;
}
```

### UI

- badge "dados completos", "dados parciais", "dados desatualizados";
- tooltip com campos ausentes;
- pagina interna de status das fontes.

### Testes

- campos ausentes reduzem coverageScore;
- stale reduz confianca;
- falha de fonte nao derruba pagina.

## 9. Relatorios Exportaveis

### Problema

Usuarios podem querer salvar analises, compartilhar com grupos ou revisar periodicamente.

### Implementacao Proposta

Gerar relatorios:

- PDF de ativo;
- PDF de carteira;
- CSV do screener;
- snapshot mensal da carteira.

### Conteudo

Relatorio de ativo:

- resumo;
- score;
- indicadores;
- pares;
- dividendos;
- historico;
- notas de qualidade de dados.

Relatorio de carteira:

- patrimonio;
- alocacao;
- rentabilidade;
- dividendos;
- diagnostico;
- pontos de atencao.

### Testes

- PDF renderiza sem conteudo sobreposto;
- CSV tem colunas estaveis;
- valores monetarios formatados corretamente;
- usuario nao exporta carteira de outro usuario.

## 10. Experiencia Mobile da Analise

### Problema

O app mobile ja existe, mas a nova camada de analise deve chegar ao mobile de forma enxuta e responsiva.

### Implementacao Proposta

Adicionar no Flutter:

- tela de analise de ativo;
- cards de score;
- indicadores por categoria;
- alertas de dados;
- diagnostico simplificado da carteira.

### API

Reutilizar:

```text
GET /api/market/[ticker]/analysis
GET /api/market/screener
```

### Testes

- widgets de score;
- estado de dados insuficientes;
- ativo sem cotacao;
- carteira vazia;
- snapshot/golden se houver padrao no projeto.

## Ordem Recomendada Depois da SPEC-0044

1. Qualidade de dados e cobertura de fontes.
2. Comparador avancado.
3. Watchlist analitica.
4. Eventos corporativos.
5. Historico de indicadores.
6. Tese de investimento.
7. Analise setorial.
8. Simulador de dividendos.
9. Relatorios exportaveis.
10. Mobile.

## Specs Futuras Sugeridas

- `SPEC-0045`: Qualidade de dados e cobertura de fontes.
- `SPEC-0046`: Comparador avancado de ativos.
- `SPEC-0047`: Watchlist analitica e alertas fundamentalistas.
- `SPEC-0048`: Eventos corporativos e calendario de resultados.
- `SPEC-0049`: Historico de indicadores fundamentalistas.
- `SPEC-0050`: Tese de investimento por ativo.
- `SPEC-0051`: Analise setorial agregada.
- `SPEC-0052`: Simulador de dividendos e reinvestimento.
- `SPEC-0053`: Relatorios exportaveis.
- `SPEC-0054`: Analise de ativos no mobile.

## Criterios de Priorizacao

Priorizar cada proxima spec usando estes criterios:

1. Impacto direto na decisao do usuario.
2. Baixo risco de fonte externa.
3. Reuso da camada `AssetAnalysis`.
4. Baixa chance de afetar regras financeiras existentes.
5. Facilidade de teste automatizado.

## Observacoes Finais

O proximo passo mais pragmatico depois da SPEC-0044 e implementar qualidade de dados. Sem isso, historico, comparador, screener e diagnostico podem parecer mais precisos do que realmente sao quando a cobertura das fontes gratuitas for parcial.

