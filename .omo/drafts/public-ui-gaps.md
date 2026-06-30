---
slug: public-ui-gaps
status: awaiting-approval
intent: clear
pending-action: write .omo/plans/public-ui-gaps.md
approach: Fix navigation, add clickable cards, wire real data to dividends/crypto sections, create listing pages, polish states — in 5 phases respecting dependency order.
---

# Draft: public-ui-gaps

## Findings (cited - path:lines)

### 🧭 Navegação — links quebrados (Fase 1)
- `PublicHeader.tsx:13-20` — NAV_ITEMS aponta para `/#mercados`, `/#dividendos`, `/#cripto`, `/#cursos`. Nenhuma section na `page.tsx` tem esses ids (exceto `#cursos` em `B3CoursesSection.tsx:39`)
- `PublicFooter.tsx:4-25` — FOOTER_LINKS.Mercado usa `/?type=STOCK_BR`, `/?type=CRYPTO` etc. A home (`page.tsx`) não lê `searchParams.type` — esses links não alteram nada
- `PublicFooter.tsx:20-23` — Links `/termos`, `/privacidade`, `/compliance`, `/ajuda` — nenhuma rota corresponde → retornam 404

### 📇 Highlights — Altas/Baixas (Fase 1, 2, 3)
- `HighlightsSection.tsx:39-65` — AssetCard é `<div>`, não `<Link>` ou `<a>` — não clica no ativo
- `HighlightsSection.tsx:146,172` — "Ver todos" → `/ativos?sort=change` e `/ativos?sort=change_asc` — rota `/ativos` não existe (a única rota pública é `/ativos/[ticker]`)
- API retorna `changePercent` como string numérica (`"0.43"` ou `"-1.23"`) — o frontend em `HighlightsSection.tsx:36` checa `startsWith('+')`, mas a API nunca prefixa com `+`. Para valores positivos, `startsWith('+')` é `false`, então a cor fica `text-loss` (vermelho) para ganhos — **bug de sinal**

### 💰 Dividendos (Fase 1, 2, 3, 4)
- `DividendsSection.tsx:14-39` — DIVIDEND_DATA é **hardcoded** (3 linhas fixas: BBAS3, ITUB4, EGIE3)
- Existe API real por ativo: `/api/market/[ticker]/dividends/route.ts` que chama Brapi
- Existe `fetchBrapiDividends` em `market-fetchers.ts:127`
- Linhas da tabela (`DividendsSection.tsx:92-131`) são `<tr>` sem link — não clicam no ativo
- `DividendsSection.tsx:72` — "Ver agenda completa" → `/proventos/agenda` — rota não existe (404)
- Não existe endpoint agregado de agenda de dividendos (apenas por ativo individual)

### ₿ Cripto (Fase 1, 2, 3, 4)
- `CryptoSections.tsx:21-26` — CRYPTO_ASSETS é **hardcoded** (4 moedas: BTC, ETH, USDT, SOL)
- `CryptoSections.tsx:28-33` — TRENDING também hardcoded
- Existe dado real via `/api/market/highlights?type=CRYPTO` (rota `highlights/route.ts:183-184`)
- Cards (`CryptoSections.tsx:81`) são `<div>` — não clicam no ativo
- `CryptoSections.tsx:73` — "Painel completo" → `/mercado/cripto` — rota não existe (404)

### 📊 Índices / Ticker Bar (Fase 2)
- `MarketTickerBar.tsx:62-88` — Cards de índice são `<div>` — não clicam. Pode ser aceitável (índices não têm página de detalhe), mas inconsistente com o resto

### 🎓 Cursos (Fase 2)
- `B3CoursesSection.tsx` — Já tem `id="cursos"` ✅. Dados via B3_COURSES (curadoria manual). Links externos para site da B3. Aceitável como está.
- Rota `/cursos` existe ✅

### 📄 Páginas inexistentes (Fase 4)
- `/ativos` — para listagem geral com sort (referenciado por Ver todos)
- `/proventos/agenda` — agenda completa de dividendos
- `/mercado/cripto` — painel completo de cripto
- `/termos`, `/privacidade`, `/compliance`, `/ajuda` — páginas institucionais

## Decisions (with rationale)

1. **Prioridade por dependência:** Fase 1 (navegação) → Fase 2 (cards clicáveis) → Fase 3 (dados reais) → Fase 4 (páginas) → Fase 5 (qualidade)
2. **Fase 1 e 2 são independentes entre si** — podem ser paralelizadas dentro da fase
3. **Fase 3 depende da Fase 2** (cards clicáveis + dados reais)
4. **Fase 4 depende da Fase 3** (páginas consomem dados reais)
5. **Fase 5 é transversal** — pode começar após Fase 2
6. **Formatação de changePercent:** Padronizar no **backend** (API → prefixar com `+` para valores positivos, manter sinal para negativos). Frontend usa `startsWith('+')` e parseFloat para ordenação
7. **Agenda de dividendos agregada:** Criar endpoint `/api/market/dividends/agenda` que consome `fetchBrapiDividends` para os tickers do `CURATED_LISTS.STOCK_BR` e `CURATED_LISTS.FII`. Cache de 1h. Ordenar por `paymentDate` crescente
8. **Dados de cripto:** Opção rápida — consumir `/api/market/highlights?type=CRYPTO` no cliente. Mas melhor criar endpoint dedicado `/api/market/crypto/overview` com os 5 tickers curados + dados reais de preço/change/volume
9. **Páginas institucionais:** Criar páginas estáticas mínimas (termos, privacidade, compliance, ajuda) com conteúdo placeholder ou redirect para `/`. São 404 hoje
10. **Listagem `/ativos`:** Página dinâmica com `searchParams.type` e `searchParams.sort`. Reaproveitar `fetchCachedMarketValue` para buscar cotações. Ordenar por `changePercent`

## Scope IN

- Adicionar `id="mercados"`, `id="dividendos"`, `id="cripto"` nas sections correspondentes da page.tsx
- Transformar AssetCard (HighlightsSection) em Link → `/ativos/{ticker}?class={assetClass}`
- Transformar linhas de Dividendos em Link → `/ativos/{ticker}?class=STOCK_BR`
- Transformar cards de Cripto em Link → `/ativos/{symbol}?class=CRYPTO`
- Padronizar changePercent na API: prefixar com `+` para valores positivos
- Criar `/api/market/dividends/agenda` — agenda agregada de dividendos
- Criar `/api/market/crypto/overview` — dados reais de cripto
- Trocar CRYPTO_ASSETS hardcoded por fetch do overview
- Trocar DIVIDEND_DATA hardcoded por fetch da agenda
- Criar páginas: `/ativos`, `/proventos/agenda`, `/mercado/cripto`
- Criar páginas estáticas: `/termos`, `/privacidade`, `/compliance`, `/ajuda` (conteúdo mínimo)
- Corrigir footer: remover links `?type=...` e apontar para rotas reais
- Testes de componente para cards clicáveis
- Testes API para agenda e overview

## Scope OUT (Must NOT have)

- **Não** alterar lógica de autenticação ou dashboard
- **Não** alterar packages/core ou packages/ui tokens
- **Não** alterar a rota de ativo logado (`/assets/[id]` no dashboard)
- **Não** refatorar o sistema de busca (SearchBar)
- **Não** alterar o funcionamento do ticker bar (índices)
- **Não** adicionar wishlist, salvar favoritos ou funcionalidades de usuário
- **Não** alterar o conteúdo ou funcionamento dos cursos

## Correções pós-revisão Momus
1. **T9:** Fetch pattern corrigido — server components devem importar funções diretamente, NÃO usar `fetch('/api/...')`. Criar libs `src/lib/market/dividends-agenda.ts` e `src/lib/market/crypto-overview.ts`
2. **T7:** Adicionado batching (batches de 5 com delay 200ms) para evitar rate limit do Brapi free tier
3. **T10:** Detalhamento arquitetural — extrair `highlights-data.ts` como lib compartilhada, com Passo A (lib) antes do Passo B (página)
4. **T12:** Matriz de dependências atualizada — T12 depende também de T7, T8, T9

## Open questions
Nenhuma — todas as decisões foram resolvidas via exploração do código.

## Approval gate
status: awaiting-approval
