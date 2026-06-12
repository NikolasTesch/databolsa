/**
 * Suíte de testes automatizados para packages/ui — SPEC-0004 test_plan.
 *
 * TC-01  tailwind-preset expõe grupos de cores e escalas derivados dos tokens.
 * TC-02  theme.css define blocos :root e .dark com vars financeiras distintas.
 * TC-03  theme-ref exporta lightTheme/darkTheme com valores corretos (hex, dp).
 * TC-04  generate-theme-css.mjs --check retorna exit code 0 (reprodutível).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

import preset from '../tailwind-preset.js';
import { lightTheme, darkTheme } from '../theme-ref.js';
import tokens from '../tokens.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UI_ROOT = resolve(__dirname, '..', '..');
const THEME_CSS_PATH = join(UI_ROOT, 'src', 'theme.css');

// ---------------------------------------------------------------------------
// TC-01 — tailwind-preset
// ---------------------------------------------------------------------------
describe('TC-01: tailwind-preset expõe theme.extend derivado dos tokens', () => {
  const extend = preset.theme?.extend as Record<string, unknown>;
  const colors = extend?.colors as Record<string, unknown>;

  it('theme.extend existe e colors é um objeto', () => {
    expect(extend).toBeDefined();
    expect(typeof colors).toBe('object');
    expect(colors).not.toBeNull();
  });

  it('grupo brand expõe primary e accent a partir dos tokens', () => {
    const brand = colors.brand as Record<string, unknown>;
    expect(brand).toBeDefined();
    expect(brand.primary).toBe(tokens.color.brand.primary);
    expect(brand.accent).toBe(tokens.color.brand.accent);
  });

  it('grupo navy está presente (paleta estática)', () => {
    // navy é mapeado diretamente como color.brand.navy no preset
    const navy = colors.navy as Record<string, unknown>;
    expect(navy).toBeDefined();
    expect(Object.keys(navy).length).toBeGreaterThan(0);
  });

  it('grupo neutral expõe escala de cores', () => {
    const neutral = colors.neutral as Record<string, unknown>;
    expect(neutral).toBeDefined();
    expect(neutral['50']).toBe(tokens.color.neutral['50']);
    expect(neutral['900']).toBe(tokens.color.neutral['900']);
  });

  it('grupo profit está presente com surface e content dos tokens', () => {
    const profit = colors.profit as Record<string, unknown>;
    expect(profit).toBeDefined();
    expect(profit.surface).toBe(tokens.color.finance.profit.surface);
    expect(profit.content).toBe(tokens.color.finance.profit.content);
    expect(profit.DEFAULT).toBe('var(--color-profit)');
  });

  it('grupo loss está presente com surface e content dos tokens', () => {
    const loss = colors.loss as Record<string, unknown>;
    expect(loss).toBeDefined();
    expect(loss.surface).toBe(tokens.color.finance.loss.surface);
    expect(loss.content).toBe(tokens.color.finance.loss.content);
    expect(loss.DEFAULT).toBe('var(--color-loss)');
  });

  it('grupo stale está presente com surface e content dos tokens', () => {
    const stale = colors.stale as Record<string, unknown>;
    expect(stale).toBeDefined();
    expect(stale.surface).toBe(tokens.color.finance.stale.surface);
    expect(stale.content).toBe(tokens.color.finance.stale.content);
    expect(stale.DEFAULT).toBe('var(--color-stale)');
  });

  it('spacing expõe escala de espaçamento dos tokens', () => {
    const spacing = extend.spacing as Record<string, unknown>;
    expect(spacing).toBeDefined();
    expect(spacing['0']).toBe(tokens.spacing.scale['0']);
    expect(spacing['4']).toBe(tokens.spacing.scale['4']);
    expect(spacing['16']).toBe(tokens.spacing.scale['16']);
  });

  it('borderRadius expõe escala dos tokens', () => {
    const borderRadius = extend.borderRadius as Record<string, unknown>;
    expect(borderRadius).toBeDefined();
    expect(borderRadius['none']).toBe(tokens.radius.none);
    expect(borderRadius['md']).toBe(tokens.radius.md);
    expect(borderRadius['full']).toBe(tokens.radius.full);
  });

  it('fontSize expõe escala tipográfica dos tokens', () => {
    const fontSize = extend.fontSize as Record<string, unknown>;
    expect(fontSize).toBeDefined();
    expect(fontSize['xs']).toBe(tokens.typography.fontSize.xs);
    expect(fontSize['base']).toBe(tokens.typography.fontSize.base);
  });

  it('screens expõe breakpoints dos tokens', () => {
    const screens = extend.screens as Record<string, unknown>;
    expect(screens).toBeDefined();
    expect(screens['sm']).toBe(tokens.breakpoint.sm);
    expect(screens['lg']).toBe(tokens.breakpoint.lg);
  });

  it('zIndex expõe valores stringificados dos tokens', () => {
    const zIndex = extend.zIndex as Record<string, string>;
    expect(zIndex).toBeDefined();
    expect(zIndex['base']).toBe(String(tokens.zIndex.base));
    expect(zIndex['modal']).toBe(String(tokens.zIndex.modal));
    expect(zIndex['toast']).toBe(String(tokens.zIndex.toast));
  });
});

// ---------------------------------------------------------------------------
// TC-02 — theme.css
// ---------------------------------------------------------------------------
describe('TC-02: theme.css define :root e .dark com vars financeiras distintas', () => {
  const css = readFileSync(THEME_CSS_PATH, 'utf8');

  it('o arquivo começa com um cabeçalho de gerador', () => {
    expect(css).toContain('GERADO automaticamente por scripts/generate-theme-css.mjs');
  });

  it('contém o bloco :root', () => {
    expect(css).toContain(':root {');
  });

  it('contém o bloco .dark', () => {
    expect(css).toContain('.dark {');
  });

  it('--color-profit está definida em ambos os blocos', () => {
    const matches = css.match(/--color-profit\s*:/g) ?? [];
    // profit aparece em :root e .dark, e também profit-surface em :root
    const profitBase = css.match(/^\s+--color-profit:/gm) ?? [];
    expect(profitBase.length).toBeGreaterThanOrEqual(2);
  });

  it('--color-loss está definida em ambos os blocos', () => {
    const profitLoss = css.match(/^\s+--color-loss:/gm) ?? [];
    expect(profitLoss.length).toBeGreaterThanOrEqual(2);
  });

  it('--color-stale está definida em ambos os blocos', () => {
    const stale = css.match(/^\s+--color-stale:/gm) ?? [];
    expect(stale.length).toBeGreaterThanOrEqual(2);
  });

  it('--color-profit tem valor diferente entre :root e .dark', () => {
    // Extrai bloco :root
    const rootBlock = css.match(/:root\s*\{([^}]+)\}/s)?.[1] ?? '';
    const darkBlock = css.match(/\.dark\s*\{([^}]+)\}/s)?.[1] ?? '';

    const rootProfit = rootBlock.match(/--color-profit\s*:\s*([^;]+);/)?.[1]?.trim();
    const darkProfit = darkBlock.match(/--color-profit\s*:\s*([^;]+);/)?.[1]?.trim();

    expect(rootProfit).toBeDefined();
    expect(darkProfit).toBeDefined();
    expect(rootProfit).not.toBe(darkProfit);
  });

  it('--color-loss tem valor diferente entre :root e .dark', () => {
    const rootBlock = css.match(/:root\s*\{([^}]+)\}/s)?.[1] ?? '';
    const darkBlock = css.match(/\.dark\s*\{([^}]+)\}/s)?.[1] ?? '';

    const rootLoss = rootBlock.match(/--color-loss\s*:\s*([^;]+);/)?.[1]?.trim();
    const darkLoss = darkBlock.match(/--color-loss\s*:\s*([^;]+);/)?.[1]?.trim();

    expect(rootLoss).toBeDefined();
    expect(darkLoss).toBeDefined();
    expect(rootLoss).not.toBe(darkLoss);
  });

  it('--color-stale tem valor diferente entre :root e .dark', () => {
    const rootBlock = css.match(/:root\s*\{([^}]+)\}/s)?.[1] ?? '';
    const darkBlock = css.match(/\.dark\s*\{([^}]+)\}/s)?.[1] ?? '';

    const rootStale = rootBlock.match(/--color-stale\s*:\s*([^;]+);/)?.[1]?.trim();
    const darkStale = darkBlock.match(/--color-stale\s*:\s*([^;]+);/)?.[1]?.trim();

    expect(rootStale).toBeDefined();
    expect(darkStale).toBeDefined();
    expect(rootStale).not.toBe(darkStale);
  });

  it('valores do :root batem com os tokens de finance.light', () => {
    const rootBlock = css.match(/:root\s*\{([^}]+)\}/s)?.[1] ?? '';
    const rootProfit = rootBlock.match(/--color-profit\s*:\s*([^;]+);/)?.[1]?.trim();
    expect(rootProfit).toBe(tokens.color.finance.profit.light);
  });

  it('valores do .dark batem com os tokens de finance.dark', () => {
    const darkBlock = css.match(/\.dark\s*\{([^}]+)\}/s)?.[1] ?? '';
    const darkProfit = darkBlock.match(/--color-profit\s*:\s*([^;]+);/)?.[1]?.trim();
    expect(darkProfit).toBe(tokens.color.finance.profit.dark);
  });
});

// ---------------------------------------------------------------------------
// TC-03 — theme-ref
// ---------------------------------------------------------------------------
describe('TC-03: theme-ref exporta lightTheme e darkTheme com valores corretos', () => {
  it('lightTheme.mode é "light"', () => {
    expect(lightTheme.mode).toBe('light');
  });

  it('darkTheme.mode é "dark"', () => {
    expect(darkTheme.mode).toBe('dark');
  });

  it('lightTheme.colors.profit é #16A34A (hex do token finance.profit.light)', () => {
    expect(lightTheme.colors.profit).toBe('#16A34A');
    expect(lightTheme.colors.profit).toBe(tokens.color.finance.profit.light);
  });

  it('darkTheme.colors.profit é #22C55E (hex do token finance.profit.dark)', () => {
    expect(darkTheme.colors.profit).toBe('#22C55E');
    expect(darkTheme.colors.profit).toBe(tokens.color.finance.profit.dark);
  });

  it('lightTheme.colors.loss é #DC2626 (finance.loss.light)', () => {
    expect(lightTheme.colors.loss).toBe('#DC2626');
    expect(lightTheme.colors.loss).toBe(tokens.color.finance.loss.light);
  });

  it('darkTheme.colors.loss é #F87171 (finance.loss.dark)', () => {
    expect(darkTheme.colors.loss).toBe('#F87171');
    expect(darkTheme.colors.loss).toBe(tokens.color.finance.loss.dark);
  });

  it('lightTheme.colors.stale é #D97706 (finance.stale.light)', () => {
    expect(lightTheme.colors.stale).toBe('#D97706');
    expect(lightTheme.colors.stale).toBe(tokens.color.finance.stale.light);
  });

  it('darkTheme.colors.stale é #F59E0B (finance.stale.dark)', () => {
    expect(darkTheme.colors.stale).toBe('#F59E0B');
    expect(darkTheme.colors.stale).toBe(tokens.color.finance.stale.dark);
  });

  it('spacing é um objeto de valores numéricos (dp)', () => {
    const { spacing } = lightTheme;
    expect(typeof spacing).toBe('object');
    // Todos os valores devem ser números
    for (const [key, value] of Object.entries(spacing)) {
      expect(typeof value, `spacing.${key} deve ser number`).toBe('number');
    }
  });

  it('spacing.4 = 16 dp (1rem × 16px/rem)', () => {
    expect(lightTheme.spacing['4']).toBe(16);
  });

  it('spacing.0 = 0 dp', () => {
    expect(lightTheme.spacing['0']).toBe(0);
  });

  it('spacing.16 = 64 dp (4rem × 16px/rem)', () => {
    expect(lightTheme.spacing['16']).toBe(64);
  });

  it('fontSize é um objeto de valores numéricos (dp)', () => {
    const { fontSize } = lightTheme;
    expect(typeof fontSize).toBe('object');
    for (const [key, value] of Object.entries(fontSize)) {
      expect(typeof value, `fontSize.${key} deve ser number`).toBe('number');
    }
  });

  it('fontSize.base = 16 dp (1rem × 16px/rem)', () => {
    expect(lightTheme.fontSize['base']).toBe(16);
  });

  it('fontSize.xs = 12 dp (0.75rem × 16px/rem)', () => {
    expect(lightTheme.fontSize['xs']).toBe(12);
  });

  it('lightTheme e darkTheme compartilham os mesmos valores de spacing (independente de tema)', () => {
    expect(lightTheme.spacing).toEqual(darkTheme.spacing);
  });

  it('lightTheme e darkTheme compartilham os mesmos valores de fontSize', () => {
    expect(lightTheme.fontSize).toEqual(darkTheme.fontSize);
  });

  it('cores profit diferem entre light e dark', () => {
    expect(lightTheme.colors.profit).not.toBe(darkTheme.colors.profit);
  });

  it('cores loss diferem entre light e dark', () => {
    expect(lightTheme.colors.loss).not.toBe(darkTheme.colors.loss);
  });
});

// ---------------------------------------------------------------------------
// TC-04 — generate-theme-css.mjs --check é reprodutível
// ---------------------------------------------------------------------------
describe('TC-04: generate-theme-css.mjs --check retorna exit code 0', () => {
  it('o script --check confirma que theme.css está em dia com os tokens', () => {
    const result = spawnSync(
      'node',
      [join(UI_ROOT, 'scripts', 'generate-theme-css.mjs'), '--check'],
      {
        cwd: UI_ROOT,
        encoding: 'utf8',
        timeout: 10_000,
      },
    );

    if (result.error) {
      throw result.error;
    }

    expect(
      result.status,
      `Saída stderr: ${result.stderr}\nSaída stdout: ${result.stdout}`,
    ).toBe(0);

    expect(result.stdout).toContain('em dia');
  });
});
