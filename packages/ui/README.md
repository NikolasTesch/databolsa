# @databolsa/ui

Camada de **design tokens** da databolsa. Fonte única da verdade visual da
marca — alimenta a web (Next.js + Tailwind) e serve de referência canônica para
o mobile (Flutter + Dart). Guia humano:
[`docs/design-system.md`](../../docs/design-system.md) · Spec:
[SPEC-0004](../../docs/specs/0004-design-tokens-codegen.json).

> Componentes de UI (`Button`, `Card`, `Badge`, `Input`, `Select`, `Spinner`, `Tooltip`, `TrendBadge`)
> agora vivem e são exportados diretamente deste pacote. Este pacote expõe os tokens,
> o preset Tailwind, o tema CSS gerado e a biblioteca de componentes compartilhados para Web.

## Fonte única

```
src/tokens/design-tokens.json   ← a fonte da verdade (edite aqui)
        │
        ├─ src/tokens.ts           import tipado do JSON (TypeScript)
        ├─ src/tailwind-preset.ts  preset Tailwind — consumo direto (web)
        ├─ src/theme.css           variáveis CSS de tema (web) — GERADO
        ├─ src/theme-ref.ts        valores canônicos resolvidos (referência)
        └─ src/app_tokens.dart     classes Dart prontas p/ Flutter — GERADO
```

Alterou um token? Mude no **JSON**, depois regenere os artefatos:

```bash
node packages/ui/scripts/generate-theme-css.mjs    # regenera theme.css (web)
node packages/ui/scripts/generate-theme-dart.mjs   # regenera app_tokens.dart (Flutter)

# CI — falha se o arquivo gerado divergir do JSON:
node packages/ui/scripts/generate-theme-css.mjs  --check
node packages/ui/scripts/generate-theme-dart.mjs --check
```

---

## Consumo na web (Next.js + Tailwind)

`tailwind.config.ts`:

```ts
import preset from '@databolsa/ui/tailwind-preset';

export default {
  presets: [preset],
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
};
```

Importe o tema **uma vez** (ex.: `app/globals.css`):

```css
@import '@databolsa/ui/theme.css';
```

Utilitárias disponíveis: `bg-surface`, `text-content-muted`, `text-profit`,
`bg-stale-surface`, `border-border`, `font-mono`, `rounded-lg` etc. Tema escuro
ativa com a classe `.dark` no elemento raiz — sem rebuild.

> **Regra de tipografia:** todo valor monetário, quantidade, ticker e percentual
> usa `font-mono` (figuras tabulares). Cor nunca é o único indicador de
> lucro/perda — acompanhe de sinal `+/−` ou seta (acessibilidade).

---

## Consumo no mobile (Flutter)

O artefato Flutter é `src/app_tokens.dart` — copie para
`apps/mobile/lib/theme/app_tokens.dart` ao inicializar o projeto:

```dart
import 'theme/app_tokens.dart';

// Obter o esquema de cores correto para o tema atual:
final scheme = Theme.of(context).brightness == Brightness.dark
    ? AppColorScheme.dark
    : AppColorScheme.light;

// Cor de lucro (tema-aware):
Container(color: scheme.profit)

// Superfície de stale (constante — RN-10):
Container(color: AppColors.staleSurface)

// Espaçamento e tipografia:
Padding(padding: EdgeInsets.all(AppSpacing.s4))  // 16 dp
Text('R$ 1.234,56', style: TextStyle(
  fontFamily: AppFonts.mono,   // figuras tabulares p/ números
  fontSize: AppFontSize.base,  // 16 sp
))
```

### Fontes no pubspec.yaml

As duas famílias requeridas são IBM Plex Sans e IBM Plex Mono. Adicione via
`google_fonts` ou inclua os assets diretamente:

```yaml
dependencies:
  google_fonts: ^6.0.0
```

```dart
import 'package:google_fonts/google_fonts.dart';
TextStyle(fontFamily: GoogleFonts.ibmPlexMono().fontFamily)
```

---

## Estado `stale` (RN-10)

`profit` / `loss` / `neutralChange` / `stale` têm variante clara/escura dentro
de `AppColorScheme`. O token `stale` (âmbar) sinaliza cotação reusada do cache
quando a fonte externa falha — degradar com clareza, nunca quebrar o total.

- **Web:** `text-stale`, `bg-stale-surface`
- **Flutter:** `scheme.stale`, `AppColors.staleSurface`

---

## Tokens crus (gráficos)

```ts
import { tokens, chartColors } from '@databolsa/ui';
chartColors.categorical;        // 6 cores para donut/barra (Recharts)
chartColors.series.patrimonio;  // série de evolução do patrimônio
```

No Flutter, as mesmas cores estão em `AppColors.chartCat1..6` e
`AppColors.chartPatrimonio` / `chartAporte` / `chartLucro` / `chartPrejuizo`
para uso com `fl_chart`.
