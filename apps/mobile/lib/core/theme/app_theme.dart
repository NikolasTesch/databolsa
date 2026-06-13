import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_tokens.dart';

/// Builds the light and dark [ThemeData] for DataBolsa.
class AppTheme {
  AppTheme._();

  static ThemeData light() => _buildTheme(AppColorScheme.light, Brightness.light);
  static ThemeData dark() => _buildTheme(AppColorScheme.dark, Brightness.dark);

  static ThemeData _buildTheme(AppColorScheme scheme, Brightness brightness) {
    final base = brightness == Brightness.light
        ? ThemeData.light(useMaterial3: true)
        : ThemeData.dark(useMaterial3: true);

    final textTheme = GoogleFonts.ibmPlexSansTextTheme(base.textTheme).copyWith(
      // Monospaced for monetary values — applied per widget via AppFonts.mono
    );

    return base.copyWith(
      brightness: brightness,
      scaffoldBackgroundColor: scheme.background,
      colorScheme: ColorScheme(
        brightness: brightness,
        primary: scheme.primary,
        onPrimary: Colors.white,
        secondary: scheme.accent,
        onSecondary: Colors.white,
        error: scheme.danger,
        onError: Colors.white,
        surface: scheme.surface,
        onSurface: scheme.text,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: scheme.surface,
        foregroundColor: scheme.text,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      cardTheme: CardThemeData(
        color: scheme.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          side: BorderSide(color: scheme.border),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: scheme.surfaceMuted,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: BorderSide(color: scheme.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: BorderSide(color: scheme.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: BorderSide(color: scheme.focusRing, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: BorderSide(color: scheme.danger),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: BorderSide(color: scheme.danger, width: 2),
        ),
        labelStyle: TextStyle(color: scheme.textMuted),
        hintStyle: TextStyle(color: scheme.textSubtle),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: scheme.primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.s6,
            vertical: AppSpacing.s4,
          ),
        ),
      ),
      textTheme: textTheme,
    );
  }
}

/// Extension so widgets can call [context.appScheme] without Theme.of.
extension AppSchemeContext on BuildContext {
  AppColorScheme get appScheme {
    final brightness = Theme.of(this).brightness;
    return brightness == Brightness.dark ? AppColorScheme.dark : AppColorScheme.light;
  }
}
