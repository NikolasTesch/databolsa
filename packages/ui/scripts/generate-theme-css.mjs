#!/usr/bin/env node
/**
 * Gera packages/ui/src/theme.css a partir do design-tokens.json (fonte única).
 *
 * Sem dependências: roda com node puro.
 *
 *   node packages/ui/scripts/generate-theme-css.mjs          # escreve o arquivo
 *   node packages/ui/scripts/generate-theme-css.mjs --check   # falha se divergente
 *
 * As variáveis CSS cobrem os tokens semânticos e de finanças que mudam entre os
 * temas (:root = claro, .dark = escuro), além de expor a marca, neutros e
 * superfícies de finanças (constantes) em :root por conveniência.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const tokensPath = join(here, '..', 'src', 'tokens', 'design-tokens.json');
const outPath = join(here, '..', 'src', 'theme.css');

const tokens = JSON.parse(readFileSync(tokensPath, 'utf8'));
const { color } = tokens;

/** Mapeia os tokens semânticos de um tema para pares CSS var → valor. */
function semanticVars(mode) {
  const s = color.semantic[mode];
  const f = color.finance;
  const financeMode = mode === 'dark' ? 'dark' : 'light';
  return {
    '--color-background': s.background,
    '--color-surface': s.surface,
    '--color-surface-muted': s.surfaceMuted,
    '--color-border': s.border,
    '--color-text': s.text,
    '--color-text-muted': s.textMuted,
    '--color-text-subtle': s.textSubtle,
    '--color-primary': s.primary,
    '--color-primary-hover': s.primaryHover,
    '--color-accent': s.accent,
    '--color-secondary': s.secondary ?? s.accent,
    '--color-secondary-hover': s.secondaryHover ?? s.accent,
    '--color-focus-ring': s.focusRing,
    '--color-success': s.success,
    '--color-danger': s.danger,
    '--color-warning': s.warning,
    '--color-info': s.info,
    // Material 3 inspired extras
    '--color-on-surface': s.onSurface ?? s.text,
    '--color-on-surface-variant': s.onSurfaceVariant ?? s.textMuted,
    '--color-surface-dim': s.surfaceDim ?? s.background,
    '--color-surface-bright': s.surfaceBright ?? s.surface,
    '--color-surface-container-lowest': s.surfaceContainerLowest ?? s.background,
    '--color-surface-container-low': s.surfaceContainerLow ?? s.surface,
    '--color-surface-container': s.surfaceContainer ?? s.surfaceMuted,
    '--color-surface-container-high': s.surfaceContainerHigh ?? s.surfaceMuted,
    '--color-surface-container-highest': s.surfaceContainerHighest ?? s.surfaceMuted,
    '--color-outline': s.outline ?? s.textSubtle,
    '--color-outline-variant': s.outlineVariant ?? s.border,
    '--color-tertiary': s.tertiary ?? s.accent,
    '--color-tertiary-container': s.tertiaryContainer ?? s.accent,
    // Finanças (theme-aware) — RN-10: 'stale' sinaliza cotação reusada do cache.
    '--color-profit': f.profit[financeMode],
    '--color-loss': f.loss[financeMode],
    '--color-neutral-change': f.neutralChange[financeMode],
    '--color-stale': f.stale[financeMode],
  };
}

/** Tokens constantes (não mudam de tema): marca, neutros e superfícies de finanças. */
function constantVars() {
  const out = {};
  for (const [k, v] of Object.entries(color.brand.navy)) out[`--color-navy-${k}`] = v;
  out['--color-brand-primary'] = color.brand.primary;
  out['--color-brand-accent'] = color.brand.accent;
  for (const [k, v] of Object.entries(color.neutral)) out[`--color-neutral-${k}`] = v;
  out['--color-profit-surface'] = color.finance.profit.surface;
  out['--color-loss-surface'] = color.finance.loss.surface;
  out['--color-stale-surface'] = color.finance.stale.surface;
  return out;
}

function block(selector, vars, extraComment) {
  const lines = Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`);
  const comment = extraComment ? `  /* ${extraComment} */\n` : '';
  return `${selector} {\n${comment}${lines.join('\n')}\n}`;
}

const header = `/* ============================================================================
 * theme.css — variáveis CSS de tema da databolsa.
 *
 * GERADO automaticamente por scripts/generate-theme-css.mjs a partir de
 * src/tokens/design-tokens.json. NÃO edite à mão — rode o gerador.
 *
 * Importe uma vez no app (ex.: app/globals.css) e use os tokens via Tailwind
 * (preset) ou diretamente com var(--color-*). Alterne para o tema escuro
 * adicionando a classe .dark no elemento raiz.
 * ========================================================================== */`;

const css = [
  header,
  block(':root', { ...constantVars(), ...semanticVars('light') }, 'Tema claro (padrão)'),
  block('.dark', semanticVars('dark'), 'Tema escuro — sobrescreve só o que muda'),
  '',
].join('\n\n');

const isCheck = process.argv.includes('--check');
if (isCheck) {
  const current = readFileSync(outPath, 'utf8');
  if (current !== css) {
    console.error('theme.css está DESATUALIZADO em relação ao design-tokens.json. Rode: node packages/ui/scripts/generate-theme-css.mjs');
    process.exit(1);
  }
  console.log('theme.css está em dia com os tokens.');
} else {
  writeFileSync(outPath, css);
  console.log(`theme.css gerado (${Object.keys(semanticVars('light')).length} vars semânticas por tema).`);
}
