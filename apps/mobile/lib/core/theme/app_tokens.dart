// ============================================================================
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
import 'package:flutter/material.dart';

/// Cores estáticas da marca (independentes de tema).
class AppColors {
  AppColors._();
  // Paleta Navy
  static const Color navy50 = Color(0xFFEAF6FB);
  static const Color navy100 = Color(0xFFC0E4F0);
  static const Color navy200 = Color(0xFF4EC3E4);
  static const Color navy300 = Color(0xFF87C6E9);
  static const Color navy400 = Color(0xFF5E8AD0);
  static const Color navy500 = Color(0xFF3A6BBE);
  static const Color navy600 = Color(0xFF2756A4);
  static const Color navy700 = Color(0xFF234080);
  static const Color navy800 = Color(0xFF1E3466);
  static const Color navy900 = Color(0xFF15244A);
  // Primárias de marca
  static const Color primary = Color(0xFF2756A4);
  static const Color accent  = Color(0xFF4EC3E4);
  // Paleta de gráficos (categorical — donut/barra)
  static const Color chartCat1 = Color(0xFF1E3466);
  static const Color chartCat2 = Color(0xFF2756A4);
  static const Color chartCat3 = Color(0xFF4EC3E4);
  static const Color chartCat4 = Color(0xFF87C6E9);
  static const Color chartCat5 = Color(0xFFC0E4F0);
  static const Color chartCat6 = Color(0xFF0E7490);
  // Séries de evolução do patrimônio
  static const Color chartPatrimonio = Color(0xFF2756A4);
  static const Color chartAporte = Color(0xFF87C6E9);
  static const Color chartLucro = Color(0xFF16A34A);
  static const Color chartPrejuizo = Color(0xFFDC2626);
  // Superfícies de finanças (constantes entre temas)
  static const Color profitSurface = Color(0xFFDCFCE7);
  static const Color lossSurface   = Color(0xFFFEE2E2);
  static const Color staleSurface  = Color(0xFFFEF3C7);
}

/// Esquema de cores semânticas e de finanças por tema (claro/escuro).
///
/// Uso:
///   final scheme = Theme.of(context).brightness == Brightness.dark
///       ? AppColorScheme.dark : AppColorScheme.light;
///   Container(color: scheme.profit)
class AppColorScheme {
  final Color background;
  final Color surface;
  final Color surfaceMuted;
  final Color border;
  final Color text;
  final Color textMuted;
  final Color textSubtle;
  final Color primary;
  final Color primaryHover;
  final Color accent;
  final Color focusRing;
  final Color success;
  final Color danger;
  final Color warning;
  final Color info;
  final Color profit;
  final Color loss;
  final Color neutralChange;
  final Color stale;

  const AppColorScheme({
    required this.background,
    required this.surface,
    required this.surfaceMuted,
    required this.border,
    required this.text,
    required this.textMuted,
    required this.textSubtle,
    required this.primary,
    required this.primaryHover,
    required this.accent,
    required this.focusRing,
    required this.success,
    required this.danger,
    required this.warning,
    required this.info,
    required this.profit,
    required this.loss,
    required this.neutralChange,
    required this.stale,
  });

  static const AppColorScheme light = AppColorScheme(
      background: Color(0xFFECEFF5),
      surface: Color(0xFFFFFFFF),
      surfaceMuted: Color(0xFFDEE6F0),
      border: Color(0xFF7A90AC),
      text: Color(0xFF0F172A),
      textMuted: Color(0xFF475569),
      textSubtle: Color(0xFF64748B),
      primary: Color(0xFF2756A4),
      primaryHover: Color(0xFF234080),
      accent: Color(0xFF4EC3E4),
      focusRing: Color(0xFF2756A4),
      success: Color(0xFF16A34A),
      danger: Color(0xFFDC2626),
      warning: Color(0xFFD97706),
      info: Color(0xFF2756A4),
      profit: Color(0xFF16A34A),
      loss: Color(0xFFDC2626),
      neutralChange: Color(0xFF64748B),
      stale: Color(0xFFD97706),
  );

  static const AppColorScheme dark = AppColorScheme(
      background: Color(0xFF020817),
      surface: Color(0xFF071329),
      surfaceMuted: Color(0xFF0B1B36),
      border: Color(0xFF193253),
      text: Color(0xFFE1E2EC),
      textMuted: Color(0xFFA3A3A3),
      textSubtle: Color(0xFF8C909F),
      primary: Color(0xFFADC6FF),
      primaryHover: Color(0xFFD8E2FF),
      accent: Color(0xFF4EDEA3),
      focusRing: Color(0xFFADC6FF),
      success: Color(0xFF22C55E),
      danger: Color(0xFFF87171),
      warning: Color(0xFFF59E0B),
      info: Color(0xFFADC6FF),
      profit: Color(0xFF22C55E),
      loss: Color(0xFFF87171),
      neutralChange: Color(0xFF94A3B8),
      stale: Color(0xFFF59E0B),
  );
}

/// Espaçamentos em dp (base 4 px — escala 4 px × N).
class AppSpacing {
  AppSpacing._();
  // ex: s4 = 16 dp
  static const double s0 = 0.0;
  static const double s1 = 4.0;
  static const double s2 = 8.0;
  static const double s3 = 12.0;
  static const double s4 = 16.0;
  static const double s5 = 20.0;
  static const double s6 = 24.0;
  static const double s8 = 32.0;
  static const double s10 = 40.0;
  static const double s12 = 48.0;
  static const double s16 = 64.0;
  static const double s20 = 80.0;
  static const double s24 = 96.0;
}

/// Raios de borda em dp.
class AppRadius {
  AppRadius._();
  static const double none = 0.0;
  static const double sm = 4.0;
  static const double md = 8.0;
  static const double lg = 12.0;
  static const double xl = 16.0;
  static const double s2xl = 24.0;
  static const double full = 9999.0;
}

/// Famílias de fonte. Registre em pubspec.yaml (google_fonts ou assets).
class AppFonts {
  AppFonts._();
  static const String sans = 'IBM Plex Sans';
  static const String mono = 'IBM Plex Mono';
  // Regra: use 'mono' em todo valor monetário, quantidade, ticker e percentual.
}

/// Tamanhos de fonte em sp (equivalente a dp em densidade 1×).
class AppFontSize {
  AppFontSize._();
  static const double xs = 12.0;
  static const double sm = 14.0;
  static const double base = 16.0;
  static const double lg = 18.0;
  static const double xl = 20.0;
  static const double s2xl = 24.0;
  static const double s3xl = 30.0;
  static const double s4xl = 36.0;
  static const double s5xl = 48.0;
}

/// Pesos de fonte.
class AppFontWeight {
  AppFontWeight._();
  static const int light = 300;
  static const int regular = 400;
  static const int medium = 500;
  static const int semibold = 600;
  static const int bold = 700;
}

/// Durações de animação.
class AppMotion {
  AppMotion._();
  // Durações
  static const Duration fast = Duration(milliseconds: 150);
  static const Duration base = Duration(milliseconds: 200);
  static const Duration slow = Duration(milliseconds: 300);
  // Respeitar reduceMotion (MediaQuery.of(ctx).disableAnimations)
}

