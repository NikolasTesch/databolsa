#!/usr/bin/env node
/**
 * Gera packages/ui/src/app_tokens.dart a partir do design-tokens.json.
 *
 * Sem dependências: roda com node puro.
 *
 *   node packages/ui/scripts/generate-theme-dart.mjs           # escreve o arquivo
 *   node packages/ui/scripts/generate-theme-dart.mjs --check    # falha se divergente
 *
 * O arquivo gerado deve ser copiado para apps/mobile/lib/theme/app_tokens.dart
 * ao inicializar o projeto Flutter. No CI, rode --check para garantir que o
 * Dart está em dia com o JSON (mesma lógica do --check do theme.css).
 *
 * Formato das cores: Color(0xFFRRGGBB) — canônico para Flutter/Dart.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const tokensPath = join(here, '..', 'src', 'tokens', 'design-tokens.json');
const outPath = join(here, '..', 'src', 'app_tokens.dart');

const tokens = JSON.parse(readFileSync(tokensPath, 'utf8'));
const { color, typography, spacing, radius, motion } = tokens;

const REM = 16;

/** '#RRGGBB' → 'Color(0xFFRRGGBB)' */
function hex(h) {
  const clean = h.replace('#', '').toUpperCase();
  return `Color(0xFF${clean})`;
}

/** Converte escala de rem/px para double dp. */
function dp(value) {
  if (value.endsWith('rem')) return (parseFloat(value) * REM).toFixed(1);
  if (value.endsWith('px')) return parseFloat(value).toFixed(1);
  return '0.0';
}

/** ms → double (para Duration). */
function ms(value) {
  return parseFloat(value).toFixed(0);
}

/** camelCase → lowerCamelCase, ex: '50' → 's50', '2xl' → 's2xl' */
function varName(key) {
  if (/^\d/.test(key)) return `s${key}`;
  return key.replace(/[^a-zA-Z0-9]/g, '_');
}

// --------------------------------------------------------------------------
// Bloco: AppColors (constantes estáticas — não dependem de tema)
// --------------------------------------------------------------------------
function brandBlock() {
  const lines = [];
  lines.push('  // Paleta Navy');
  for (const [k, v] of Object.entries(color.brand.navy)) {
    lines.push(`  static const Color navy${k} = ${hex(v)};`);
  }
  lines.push('  // Primárias de marca');
  lines.push(`  static const Color primary = ${hex(color.brand.primary)};`);
  lines.push(`  static const Color accent  = ${hex(color.brand.accent)};`);
  lines.push('  // Paleta de gráficos (categorical — donut/barra)');
  color.chart.categorical.forEach((c, i) => {
    lines.push(`  static const Color chartCat${i + 1} = ${hex(c)};`);
  });
  lines.push('  // Séries de evolução do patrimônio');
  for (const [k, v] of Object.entries(color.chart.series)) {
    lines.push(`  static const Color chart${k[0].toUpperCase() + k.slice(1)} = ${hex(v)};`);
  }
  lines.push('  // Superfícies de finanças (constantes entre temas)');
  lines.push(`  static const Color profitSurface = ${hex(color.finance.profit.surface)};`);
  lines.push(`  static const Color lossSurface   = ${hex(color.finance.loss.surface)};`);
  lines.push(`  static const Color staleSurface  = ${hex(color.finance.stale.surface)};`);
  return lines.join('\n');
}

// --------------------------------------------------------------------------
// Bloco: AppColorScheme (tema claro e escuro como objetos const)
// --------------------------------------------------------------------------
function schemeFields() {
  return [
    'background', 'surface', 'surfaceMuted',
    'border',
    'text', 'textMuted', 'textSubtle',
    'primary', 'primaryHover', 'accent', 'focusRing',
    'success', 'danger', 'warning', 'info',
    // finanças theme-aware
    'profit', 'loss', 'neutralChange', 'stale',
  ];
}

function schemeFor(mode) {
  const s = color.semantic[mode];
  const f = color.finance;
  const fin = mode === 'dark' ? 'dark' : 'light';
  const map = {
    background: s.background, surface: s.surface, surfaceMuted: s.surfaceMuted,
    border: s.border,
    text: s.text, textMuted: s.textMuted, textSubtle: s.textSubtle,
    primary: s.primary, primaryHover: s.primaryHover,
    accent: s.accent, focusRing: s.focusRing,
    success: s.success, danger: s.danger, warning: s.warning, info: s.info,
    profit: f.profit[fin], loss: f.loss[fin],
    neutralChange: f.neutralChange[fin], stale: f.stale[fin],
  };
  return map;
}

function schemeBlock() {
  const fields = schemeFields();
  const fieldDecls = fields.map(f => `  final Color ${f};`).join('\n');
  const ctorParams = fields.map(f => `    required this.${f},`).join('\n');

  function constScheme(mode) {
    const m = schemeFor(mode);
    const args = fields.map(f => `      ${f}: ${hex(m[f])},`).join('\n');
    return `  static const AppColorScheme ${mode} = AppColorScheme(\n${args}\n  );`;
  }

  return `${fieldDecls}

  const AppColorScheme({
${ctorParams}
  });

${constScheme('light')}

${constScheme('dark')}`;
}

// --------------------------------------------------------------------------
// Bloco: AppSpacing, AppRadius
// --------------------------------------------------------------------------
function scaleBlock(className, obj, unit) {
  const lines = Object.entries(obj)
    .map(([k, v]) => `  static const double ${varName(k)} = ${dp(v)};`);
  return `  // ${unit}\n${lines.join('\n')}`;
}

function radiusBlock() {
  const entries = Object.entries(radius);
  const lines = entries.map(([k, v]) => {
    const val = k === 'full' ? '9999.0' : `${dp(v)}`;
    return `  static const double ${varName(k)} = ${val};`;
  });
  return lines.join('\n');
}

// --------------------------------------------------------------------------
// Bloco: AppFonts, AppFontSize, AppFontWeight, AppMotion
// --------------------------------------------------------------------------
function fontsBlock() {
  return [
    `  static const String sans = '${typography.fontFamily.sans[0]}';`,
    `  static const String mono = '${typography.fontFamily.mono[0]}';`,
    `  // Regra: use 'mono' em todo valor monetário, quantidade, ticker e percentual.`,
  ].join('\n');
}

function fontSizeBlock() {
  return Object.entries(typography.fontSize)
    .map(([k, v]) => `  static const double ${varName(k)} = ${dp(v)};`)
    .join('\n');
}

function fontWeightBlock() {
  return Object.entries(typography.fontWeight)
    .map(([k, v]) => `  static const int ${varName(k)} = ${v};`)
    .join('\n');
}

function motionBlock() {
  const dur = Object.entries(motion.duration)
    .map(([k, v]) => `  static const Duration ${varName(k)} = Duration(milliseconds: ${ms(v)});`)
    .join('\n');
  return `  // Durações\n${dur}\n  // Respeitar reduceMotion (MediaQuery.of(ctx).disableAnimations)`;
}

// --------------------------------------------------------------------------
// Monta o arquivo completo
// --------------------------------------------------------------------------
const header = `// ============================================================================
// app_tokens.dart — tokens de design da databolsa para Flutter.
//
// GERADO automaticamente por scripts/generate-theme-dart.mjs a partir de
// src/tokens/design-tokens.json. NÃO edite à mão — rode o gerador.
//
//   node packages/ui/scripts/generate-theme-dart.mjs          # regenera
//   node packages/ui/scripts/generate-theme-dart.mjs --check   # CI
//
// Copie este arquivo para apps/mobile/lib/theme/app_tokens.dart.
// ============================================================================

// ignore_for_file: prefer_const_constructors
import 'package:flutter/material.dart';`;

const dart = [
  header,

  `/// Cores estáticas da marca (independentes de tema).
class AppColors {
  AppColors._();
${brandBlock()}
}`,

  `/// Esquema de cores semânticas e de finanças por tema (claro/escuro).
///
/// Uso:
///   final scheme = Theme.of(context).brightness == Brightness.dark
///       ? AppColorScheme.dark : AppColorScheme.light;
///   Container(color: scheme.profit)
class AppColorScheme {
${schemeBlock()}
}`,

  `/// Espaçamentos em dp (base 4 px — escala 4 px × N).
class AppSpacing {
  AppSpacing._();
${scaleBlock('AppSpacing', spacing.scale, 'ex: s4 = 16 dp')}
}`,

  `/// Raios de borda em dp.
class AppRadius {
  AppRadius._();
${radiusBlock()}
}`,

  `/// Famílias de fonte. Registre em pubspec.yaml (google_fonts ou assets).
class AppFonts {
  AppFonts._();
${fontsBlock()}
}`,

  `/// Tamanhos de fonte em sp (equivalente a dp em densidade 1×).
class AppFontSize {
  AppFontSize._();
${fontSizeBlock()}
}`,

  `/// Pesos de fonte.
class AppFontWeight {
  AppFontWeight._();
${fontWeightBlock()}
}`,

  `/// Durações de animação.
class AppMotion {
  AppMotion._();
${motionBlock()}
}`,

  '', // newline final
].join('\n\n');

// --------------------------------------------------------------------------
const isCheck = process.argv.includes('--check');
if (isCheck) {
  const current = readFileSync(outPath, 'utf8');
  if (current !== dart) {
    console.error('app_tokens.dart está DESATUALIZADO. Rode: node packages/ui/scripts/generate-theme-dart.mjs');
    process.exit(1);
  }
  console.log('app_tokens.dart está em dia com os tokens.');
} else {
  writeFileSync(outPath, dart);
  const classes = ['AppColors','AppColorScheme','AppSpacing','AppRadius','AppFonts','AppFontSize','AppFontWeight','AppMotion'];
  console.log(`app_tokens.dart gerado — classes: ${classes.join(', ')}`);
}
