/**
 * @databolsa/ui — camada de design tokens compartilhada (web + mobile).
 *
 * Fonte única: src/tokens/design-tokens.json (ver docs/design-system.md).
 * Esta camada expõe os tokens e seus consumidores; componentes de UI virão
 * depois (após packages/core, ver roadmap em docs/SPEC.md §11).
 */
export { tokens, default as designTokens } from './tokens';
export type {
  Tokens,
  ColorTokens,
  FinanceTokens,
  SemanticTokens,
  ThemeMode,
} from './tokens';

export { default as tailwindPreset, chartColors } from './tailwind-preset';

export {
  lightTheme,
  darkTheme,
  themes,
  type Theme,
  type ThemeColors,
} from './theme-ref';

// UI Components
export { cn } from './components/cn';
export { Button } from './components/Button';
export { Input } from './components/Input';
export { Select } from './components/Select';
export { Badge } from './components/Badge';
export { Spinner } from './components/Spinner';
export { Tooltip } from './components/Tooltip';
export { TrendBadge } from './components/TrendBadge';
export { Card } from './components/Card';
