/**
 * Valores canônicos de tema derivados do design-tokens.json.
 *
 * Flutter não consome TypeScript diretamente — este arquivo resolve os tokens
 * em valores primitivos (cores em hex, escalas em dp com base 16px) que servem
 * de referência ao implementar o ThemeData em `apps/mobile/lib/theme/`.
 *
 * O artefato Flutter direto é gerado por `scripts/generate-theme-dart.mjs`
 * (saída: `src/app_tokens.dart`). Este arquivo TypeScript garante que o mesmo
 * JSON alimenta tanto o preset web quanto a referência mobile — fonte única.
 *
 * Regra de tipografia (design-system.md §2): use `fontFamily.mono` em todo
 * valor monetário, quantidade, ticker e percentual — figuras tabulares alinham
 * dígitos em colunas.
 */
import { tokens, type ThemeMode } from './tokens';

const { color, typography, spacing, radius, motion, breakpoint } = tokens;

const REM = 16;

/** Converte '1rem' | '4px' | '0' em número (dp, base 16 px). */
function toNumber(value: string): number {
  if (value.endsWith('rem')) return parseFloat(value) * REM;
  if (value.endsWith('px')) return parseFloat(value);
  return parseFloat(value) || 0;
}

function mapNumbers<K extends string>(obj: Record<K, string>): Record<K, number> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, toNumber(v as string)]),
  ) as Record<K, number>;
}

/** Cores resolvidas em hex para um tema. */
function colorsFor(mode: ThemeMode) {
  const s = color.semantic[mode];
  const f = color.finance;
  return {
    // Semânticos
    background: s.background,
    surface: s.surface,
    surfaceMuted: s.surfaceMuted,
    border: s.border,
    text: s.text,
    textMuted: s.textMuted,
    textSubtle: s.textSubtle,
    primary: s.primary,
    primaryHover: s.primaryHover,
    accent: s.accent,
    focusRing: s.focusRing,
    success: s.success,
    danger: s.danger,
    warning: s.warning,
    info: s.info,
    // Finanças (theme-aware) — RN-10: 'stale' = cotação reusada do cache.
    profit: f.profit[mode],
    profitSurface: f.profit.surface,
    loss: f.loss[mode],
    lossSurface: f.loss.surface,
    neutralChange: f.neutralChange[mode],
    stale: f.stale[mode],
    staleSurface: f.stale.surface,
    // Marca (constante entre temas)
    brandPrimary: color.brand.primary,
    brandAccent: color.brand.accent,
    navy: color.brand.navy,
    neutral: color.neutral,
  };
}

/** Escalas independentes de tema (compartilhadas por claro e escuro). */
const shared = {
  spacing: mapNumbers(spacing.scale),
  radius: mapNumbers(radius),
  fontSize: mapNumbers(typography.fontSize),
  fontWeight: typography.fontWeight,
  lineHeight: typography.lineHeight,
  fontFamily: typography.fontFamily,
  breakpoint: mapNumbers(breakpoint),
  motion: {
    duration: mapNumbers(motion.duration),
    easing: motion.easing,
  },
  chart: color.chart,
};

export const lightTheme = {
  mode: 'light' as ThemeMode,
  colors: colorsFor('light'),
  ...shared,
};

export const darkTheme = {
  mode: 'dark' as ThemeMode,
  colors: colorsFor('dark'),
  ...shared,
};

export type Theme = typeof lightTheme;
export type ThemeColors = Theme['colors'];

export const themes = { light: lightTheme, dark: darkTheme };
