# Design System — databolsa

> Versão 0.1 · Spec: [SPEC-0002](specs/0002-scaffold-monorepo-design-system.json)
> Fonte única de tokens: [`packages/ui/src/tokens/design-tokens.json`](../packages/ui/src/tokens/design-tokens.json)

Este é o guia visual da **databolsa** — rastreador de patrimônio de
investimentos (B3, cripto e ações dos EUA). O documento é a referência humana;
o arquivo `design-tokens.json` é a fonte legível por máquina que alimenta o
**Tailwind** (web) e o **tema Flutter/Dart** (mobile). Sempre que um valor
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
- Bibliotecas: **Recharts** (web) / **fl_chart** (mobile).

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

`packages/ui/src/tokens/design-tokens.json` é a fonte da verdade. A camada de consumo já existe em código, toda derivada do JSON:

- **Web (Tailwind):** O `packages/ui/src/tailwind-preset.ts` mapeia `color`, `spacing`, `radius`, `fontFamily` e outras escalas para o `theme.extend`; os tokens `semantic.{light,dark}` e de finanças viram variáveis CSS em `packages/ui/src/theme.css` (`:root` claro / `.dark` escuro). Use `presets: [preset]` no `tailwind.config` e importe o `theme.css` uma vez.
- **Mobile (Flutter/Dart):** O arquivo gerado `packages/ui/src/app_tokens.dart` contém as classes `AppColors`, `AppColorScheme`, `AppSpacing`, `AppRadius`, `AppFonts`, `AppFontSize` e `AppMotion`. Copie-o para `apps/mobile/lib/core/theme/app_tokens.dart` para manter sincronizado.

`theme.css` e `app_tokens.dart` são **gerados** — se alterar os tokens no JSON, execute os geradores na pasta `packages/ui`:
```bash
node scripts/generate-theme-css.mjs
node scripts/generate-theme-dart.mjs
```

---

## 6. Biblioteca de Componentes (`@databolsa/ui`)

O pacote `@databolsa/ui` fornece componentes de design testados e prontos para uso em interfaces Web (React/Tailwind) e tokens para Flutter.

### 6.1 Componentes React (Web)

Os componentes exportados em `packages/ui/src/components` devem ser utilizados para construir toda nova interface:

- **`Button`**: Suporta variantes `primary`, `secondary`, `ghost` e `danger`, tamanhos `sm`, `md`, `lg` e estado de `loading` nativo com spinner embutido.
- **`Input` & `Select`**: Componentes estilizados com suporte a estados de erro, foco visível (`focusRing`) e disabled.
- **`Card`**: Invólucro com bordas arredondadas e sombra suave em tom slate (`shadow-sm`), aceitando paddings `none`, `sm`, `md` e `lg`.
- **`Badge`**: Exibe status com as variantes `default`, `success` (lucro), `danger` (prejuízo), `warning` (stale/atrasado), `info` e `neutral`.
- **`TrendBadge`**: Componente especializado para finanças. Formata percentuais, renderiza setas direcionais (`TrendingUp`, `TrendingDown`, `Minus`) e aplica as cores semânticas (`text-profit`, `text-loss`) de forma automática.
- **`Tooltip`**: Para descrições e explicações de termos financeiros (ex.: Yield on Cost, TWR).

#### Exemplo de Uso (React)
```tsx
import { Card, Button, TrendBadge, Badge } from '@databolsa/ui';

export function AssetCard() {
  return (
    <Card padding="md" className="hover:border-navy-300 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-lg">VALE3</h4>
          <span className="text-xs text-content-muted">Vale S.A.</span>
        </div>
        <Badge variant="success">Ações BR</Badge>
      </div>
      <div className="mt-4 flex justify-between items-baseline">
        <span className="font-mono text-2xl font-semibold">R$ 62,50</span>
        <TrendBadge value="+1,42" />
      </div>
      <Button variant="secondary" size="sm" className="mt-4 w-full">
        Ver Detalhes
      </Button>
    </Card>
  );
}
```

### 6.2 Componentes Flutter (Mobile)

No Flutter, replique os componentes utilizando o arquivo `app_tokens.dart` copiado para o projeto local:

#### Exemplo de Card de Ativo no Flutter
```dart
import 'package:flutter/material.dart';
import '../../core/theme/app_tokens.dart';

class AssetCardWidget extends StatelessWidget {
  final String ticker;
  final String price;
  final String changePercent;

  const AssetCardWidget({
    super.key,
    required this.ticker,
    required this.price,
    required this.changePercent,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).brightness == Brightness.dark
        ? AppColorScheme.dark
        : AppColorScheme.light;

    final isPositive = !changePercent.startsWith('-');

    return Container(
      padding: EdgeInsets.all(AppSpacing.s4), // 16dp
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(AppRadius.lg), // 12dp
        border: Border.all(color: scheme.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A0F172A),
            blurRadius: 12,
            offset: Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(ticker, style: TextStyle(fontFamily: AppFonts.sans, fontWeight: AppFontWeight.bold, fontSize: AppFontSize.lg)),
          SizedBox(height: AppSpacing.s2),
          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              Text(price, style: TextStyle(fontFamily: AppFonts.mono, fontSize: AppFontSize.xl, fontWeight: AppFontWeight.semibold)),
              Row(
                children: [
                  Icon(
                    isPositive ? Icons.trending_up : Icons.trending_down,
                    color: isPositive ? scheme.success : scheme.danger,
                    size: 16,
                  ),
                  SizedBox(width: AppSpacing.s1),
                  Text('$changePercent%', style: TextStyle(fontFamily: AppFonts.mono, color: isPositive ? scheme.success : scheme.danger)),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
```

---

## 7. Diretrizes para Nova UI (Aesthetics & UX)

Para criar novas interfaces que encantem o usuário e mantenham a identidade **Premium / Professional / Banking** da marca, siga estas regras de ouro:

### 7.1 Estética Visual Rica e Moderna
- **Fidelidade da Marca**: Não utilize gradientes roxos/rosas genéricos. Use superfícies limpas com o Navy profundo (`brand.navy.900`) e detalhes em Ciano de acento (`brand.accent`).
- **Glassmorphism Sutil**: Para menus suspensos, modais e tooltips, use fundos com opacidade reduzida e desfoque (`backdrop-blur-md bg-surface/80 border-border/60`).
- **Dark Mode Premium**: O fundo escuro (`semantic.dark.background` — `#0B1220`) é um tom de azul escuro muito sofisticado, não preto puro. Os textos usam tons suaves de cinza/azul (`textMuted` e `textSubtle`) para diminuir a fadiga ocular.
- **Gráficos Elegantes**:
  - Séries temporais devem usar preenchimento suave sob a linha com 20% de opacidade (`chart.areaFillOpacity`).
  - Gráficos categorizados devem usar a paleta categórica de 6 fatias em ordem decrescente de relevância, sempre com rótulos e legendas legíveis.

### 7.2 Tipografia de Alta Precisão (Regra Financeira)
- **IBM Plex Sans**: Para títulos, textos de ajuda, labels de inputs e botões.
- **IBM Plex Mono**: **Obrigatório** para valores monetários (ex: `R$ 1.234,56`), quantidades (ex: `10.450`), tickers (ex: `PETR4`) e percentuais (ex: `+12,45%`). O alinhamento dos números com espaçamento tabular previne que os números "dancem" na tela em tabelas e cards.

### 7.3 Interações e Micro-Animações
- **Transições Suaves**: Toda alteração de estado (hover de botão, ativação de abas, exibição de cards) deve durar entre 150ms e 200ms (`motion.duration.fast` / `motion.duration.base`) utilizando curvas padrão (`motion.easing.standard` ou `cubic-bezier(0.4, 0, 0.2, 1)`).
- **Acessibilidade de Movimento**: Sempre utilize a classe `motion-reduce:transition-none` ou respeite a consulta `prefers-reduced-motion` no CSS/Flutter para usuários sensíveis.
- **Alvos de Toque e Cursor**: No desktop, elementos interativos devem ter `cursor-pointer`. No mobile, garanta uma área mínima de toque de 44x44px.
- **Acessibilidade Financeira**: Nunca use a cor vermelha ou verde de forma isolada para indicar prejuízo ou lucro. Sempre insira sinais (`+` / `-`), setas direcionais ou rótulos textuais de apoio para que usuários daltônicos possam compreender o resultado instantaneamente.

### 7.4 Tratamento do Estado Stale (RN-10)
Se uma cotação for lida do cache por falha de API externa, ela deve ser exibida com o tom âmbar (`finance.stale`). Exiba um pequeno ícone de aviso ou badge "Atrasado" próximo ao preço para sinalizar que o patrimônio total está degradado de forma graciosa. Never hide this state from the user.
