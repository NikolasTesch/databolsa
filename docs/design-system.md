# Design System — databolsa

> Versão 0.1 · Spec: [SPEC-0002](specs/0002-scaffold-monorepo-design-system.json)
> Fonte única de tokens: [`packages/ui/src/tokens/design-tokens.json`](../packages/ui/src/tokens/design-tokens.json)

Este é o guia visual da **databolsa** — rastreador de patrimônio de
investimentos (B3, cripto e ações dos EUA). O documento é a referência humana;
o arquivo `design-tokens.json` é a fonte legível por máquina que alimenta o
**Tailwind** (web) e o **tema do React Native** (mobile). Sempre que um valor
mudar, mude no JSON primeiro e reflita aqui.

**Direção de marca:** _Trust & Authority_ — confiável, profissional, "bancário".
Sóbrio por padrão, com o ciano da marca como acento. Nada de gradientes
roxo/rosa genéricos de "IA".

---

## 1. Cores

### 1.1 Marca

A paleta vem direto das logos (`apps/web/public/logo.svg`, `nome.svg`, `icone.svg`).

| Token | Hex | Uso |
|-------|-----|-----|
| `brand.navy.800` | `#1E3466` | Navy escuro — texto de marca, headers, base do símbolo |
| `brand.primary` (`navy.600`) | `#2756A4` | **Cor primária** — ações, links, séries principais |
| `brand.accent` (`navy.200`) | `#4EC3E4` | Ciano de acento — destaques, gráfico, badges |
| `brand.navy.300` | `#87C6E9` | Azul-claro — séries secundárias, hovers suaves |
| `brand.navy.100` | `#C0E4F0` | Ciano-claro — superfícies de destaque, fills |
| `brand.navy.50` | `#EAF6FB` | Tinta mais clara — fundos de seção |

A escala `navy.50 → navy.900` foi interpolada a partir desses cinco pontos de
marca para dar tonalidades completas a estados (hover, disabled, borders).

### 1.2 Cores semânticas de finanças (o ponto crítico)

Em um app de patrimônio, **cor comunica resultado**. Estes tokens têm variação
para tema claro e escuro e nunca devem ser o único indicador (sempre acompanhar
de sinal `+/−`, seta ou rótulo — acessibilidade).

| Significado | Claro | Escuro | Uso |
|-------------|-------|--------|-----|
| **Lucro / alta** | `#16A34A` | `#22C55E` | P/L positivo, variação positiva |
| **Prejuízo / baixa** | `#DC2626` | `#F87171` | P/L negativo, variação negativa |
| **Sem variação** | `#64748B` | `#94A3B8` | Variação zero / neutra |
| **Cotação `stale`** | `#D97706` | `#F59E0B` | Cotação reusada do cache em falha de fonte (RN-10) |

> O estado **`stale`** é regra de negócio (RN-10): quando uma fonte externa
> falha, reusamos o último valor em cache e marcamos a cotação como defasada.
> Visualmente isso é o token âmbar `finance.stale` (ex.: badge "desatualizado"
> no card do ativo) — degradar com clareza, nunca quebrar o total.

### 1.3 Superfícies e texto (semantic light/dark)

Tokens neutros para fundo, superfície, borda e texto em cada tema — ver
`color.semantic.light` / `color.semantic.dark` no JSON. Contraste de texto
mínimo **4.5:1**; texto "muted" no claro nunca abaixo de `#475569` (slate-600).

### 1.4 Paleta de gráficos

- **Alocação (donut / part-to-whole):** `color.chart.categorical` — máximo de
  5–6 fatias, derivadas da marca (`navy.800 → cyan → pale`), fatias grandes
  primeiro, sempre com rótulo/legenda. Acima de ~5 itens, preferir barra
  empilhada (melhor para acessibilidade).
- **Evolução do patrimônio (linha/área temporal):** série `patrimonio`
  (`#2756A4`) sólida; `aporte` (`#87C6E9`); ganho/perda usam `lucro`/`prejuizo`.
  Fill de área a 20% de opacidade (`chart.areaFillOpacity`).
- Bibliotecas: **Recharts** (web) / **Victory Native** (mobile).

---

## 2. Tipografia

| Papel | Fonte | Observação |
|-------|-------|------------|
| Títulos e corpo | **IBM Plex Sans** | Tom financeiro/confiável; pesos 300–700 |
| **Números e dados** | **IBM Plex Mono** | Figuras tabulares: dígitos alinham em colunas |

> **Regra:** todo valor monetário, quantidade, ticker e percentual em tabelas
> usa `font-mono`. Alinhamento de dígitos é essencial em dados financeiros.

- Corpo no mobile: mínimo **16px** (`typography.minBodyMobile`).
- `line-height` de corpo: 1.5–1.625. Comprimento de linha: 65–75 caracteres.
- Escala de tamanho e pesos: ver `typography` no JSON.

Import (web):

```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
```

---

## 3. Espaçamento, raio, sombra e movimento

- **Espaçamento:** escala base **4px** (`spacing.scale`) — 4, 8, 12, 16, 24, 32…
- **Raio:** `sm` 4px → `2xl` 24px, `full` para pílulas/avatares.
- **Sombra:** `sm/md/lg` suaves em tom slate (ver `shadow`).
- **Movimento:** micro-interações 150–300ms, `transform`/`opacity` apenas,
  respeitando `prefers-reduced-motion`.
- **z-index:** escala definida (10 dropdown, 20 sticky, 30 overlay, 40 modal,
  50 toast) — não usar valores arbitrários.

---

## 4. Acessibilidade e interação (não-negociável)

- Contraste de texto **≥ 4.5:1**; cor nunca é o único indicador de lucro/perda.
- Alvos de toque **≥ 44×44px** (`touch.minTargetSize`).
- Foco visível em todo elemento interativo (`focusRing`).
- `cursor-pointer` em tudo que é clicável; ícones em SVG (Heroicons/Lucide),
  nunca emojis.
- Responsivo nos breakpoints 375 / 768 / 1024 / 1440.

---

## 5. Como consumir os tokens

`packages/ui/src/tokens/design-tokens.json` é a fonte da verdade. O plano:

- **Web (Tailwind):** mapear `color`, `spacing`, `radius`, `fontFamily` para o
  `theme.extend` do `tailwind.config`, e os tokens `semantic.{light,dark}` para
  variáveis CSS trocadas por classe `.dark`.
- **Mobile (React Native):** importar o JSON num objeto de tema em
  `apps/mobile/src/theme` e consumir via contexto/`useTheme`.

A geração automática (ex.: Style Dictionary) fica para quando o tooling do
monorepo for inicializado — fora do escopo de SPEC-0002.
