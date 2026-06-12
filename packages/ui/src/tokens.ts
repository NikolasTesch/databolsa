/**
 * Fonte única dos design tokens em TypeScript.
 *
 * Reexporta `tokens/design-tokens.json` (a fonte da verdade, ver
 * docs/design-system.md). Todo o restante desta camada — preset do Tailwind,
 * tema de referência Flutter/Dart e o gerador do theme.css — deriva daqui,
 * para que web e mobile nunca divirjam.
 *
 * Requer `resolveJsonModule: true` no tsconfig do consumidor.
 */
import tokensJson from './tokens/design-tokens.json';

export const tokens = tokensJson;

export type Tokens = typeof tokens;
export type ColorTokens = Tokens['color'];
export type FinanceTokens = ColorTokens['finance'];
export type SemanticTokens = ColorTokens['semantic']['light'];
export type ThemeMode = 'light' | 'dark';

export default tokens;
