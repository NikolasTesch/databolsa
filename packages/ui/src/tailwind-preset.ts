/**
 * Preset do Tailwind para a databolsa, derivado do design-tokens.json.
 *
 * Consumo (apps/web/tailwind.config.ts):
 *
 *   import preset from '@databolsa/ui/tailwind-preset';
 *   export default {
 *     presets: [preset],
 *     content: ['./src/**\/*.{ts,tsx}'],
 *   };
 *
 * E importe `@databolsa/ui/theme.css` uma vez no app para registrar as
 * variáveis CSS de tema (claro/escuro). As cores semânticas e de finanças são
 * mapeadas para `var(--color-*)`, então alternam de tema só com a classe `.dark`
 * no elemento raiz — sem reconstruir o Tailwind.
 *
 * `import type` é apagado em runtime: este pacote não depende do tailwindcss.
 */
import type { Config } from 'tailwindcss';
import { tokens } from './tokens';

const { color, typography, spacing, radius, shadow, motion, zIndex, breakpoint } =
  tokens;

type TailwindTheme = NonNullable<Config['theme']>;

/** Tailwind espera strings em fontWeight/lineHeight/zIndex; os tokens são números. */
function stringifyValues<K extends string>(
  obj: Record<K, number | string>,
): Record<K, string> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, String(v)]),
  ) as Record<K, string>;
}

const colors: TailwindTheme['colors'] = {
  // --- Marca (estático: igual em claro/escuro) ---
  navy: color.brand.navy,
  brand: {
    DEFAULT: color.brand.primary,
    primary: color.brand.primary,
    accent: color.brand.accent,
  },
  neutral: color.neutral,

  // --- Semânticos (theme-aware via CSS vars; ver theme.css) ---
  background: 'var(--color-background)',
  surface: {
    DEFAULT: 'var(--color-surface)',
    muted: 'var(--color-surface-muted)',
  },
  border: 'var(--color-border)',
  content: {
    DEFAULT: 'var(--color-text)',
    muted: 'var(--color-text-muted)',
    subtle: 'var(--color-text-subtle)',
  },
  primary: {
    DEFAULT: 'var(--color-primary)',
    hover: 'var(--color-primary-hover)',
  },
  accent: 'var(--color-accent)',
  secondary: {
    DEFAULT: 'var(--color-secondary)',
    hover: 'var(--color-secondary-hover)',
  },
  success: 'var(--color-success)',
  danger: 'var(--color-danger)',
  warning: 'var(--color-warning)',
  info: 'var(--color-info)',

  // --- Finanças (theme-aware; superfícies são constantes) ---
  profit: {
    DEFAULT: 'var(--color-profit)',
    surface: color.finance.profit.surface,
    content: color.finance.profit.content,
  },
  loss: {
    DEFAULT: 'var(--color-loss)',
    surface: color.finance.loss.surface,
    content: color.finance.loss.content,
  },
  stale: {
    DEFAULT: 'var(--color-stale)',
    surface: color.finance.stale.surface,
    content: color.finance.stale.content,
  },
  neutralChange: 'var(--color-neutral-change)',

  // --- Stitch-specific extras (Material 3 inspired) ---
  'on-surface': 'var(--color-on-surface)',
  'on-surface-variant': 'var(--color-on-surface-variant)',
  'surface-container': {
    lowest: 'var(--color-surface-container-lowest)',
    low: 'var(--color-surface-container-low)',
    DEFAULT: 'var(--color-surface-container)',
    high: 'var(--color-surface-container-high)',
    highest: 'var(--color-surface-container-highest)',
  },
  'surface-dim': 'var(--color-surface-dim)',
  'surface-bright': 'var(--color-surface-bright)',
  outline: {
    DEFAULT: 'var(--color-outline)',
    variant: 'var(--color-outline-variant)',
  },
  tertiary: {
    DEFAULT: 'var(--color-tertiary)',
    container: 'var(--color-tertiary-container)',
  },
  'error-red': '#EF4444',
};

const preset: Config = {
  // Preset: o `content` é definido pelo app consumidor.
  content: [],
  darkMode: 'class',
  theme: {
    extend: {
      colors,
      fontFamily: {
        sans: typography.fontFamily.sans,
        mono: typography.fontFamily.mono,
      },
      fontSize: typography.fontSize,
      fontWeight: stringifyValues(typography.fontWeight),
      lineHeight: stringifyValues(typography.lineHeight),
      spacing: {
        ...spacing.scale,
        'margin-mobile': '1rem',
        'margin-desktop': '2rem',
      },
      maxWidth: {
        'max-width': '1280px',
      },
      borderRadius: radius,
      boxShadow: shadow,
      screens: breakpoint,
      zIndex: stringifyValues(zIndex),
      transitionDuration: motion.duration,
      transitionTimingFunction: motion.easing,
      // Cores de gráficos disponíveis como utilitárias (ex.: text-chart-patrimonio)
      // e via tokens importados diretamente nas libs (Recharts/Victory).
      ringColor: {
        DEFAULT: 'var(--color-focus-ring)',
      },
    },
  },
};

export const chartColors = color.chart;

export default preset;
