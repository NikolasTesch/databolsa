import 'package:decimal/decimal.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/money/money.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/theme/app_theme.dart';

// ============================================================================
// Widgets de exibição de valores monetários.
// IBM Plex Mono é obrigatório para todos (AppFonts.mono).
// ============================================================================

/// Exibe um valor BRL formatado. Mostra '—' se null.
class MoneyText extends StatelessWidget {
  final Decimal? value;
  final double fontSize;
  final FontWeight fontWeight;
  final Color? color;

  const MoneyText(
    this.value, {
    super.key,
    this.fontSize = AppFontSize.base,
    this.fontWeight = FontWeight.normal,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Text(
      formatBrl(value),
      style: GoogleFonts.ibmPlexMono(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color ?? context.appScheme.text,
      ),
    );
  }
}

/// Exibe um valor BRL com sinal explícito (+/−) e cor profit/loss.
class SignedMoneyText extends StatelessWidget {
  final Decimal? value;
  final double fontSize;
  final FontWeight fontWeight;

  const SignedMoneyText(
    this.value, {
    super.key,
    this.fontSize = AppFontSize.sm,
    this.fontWeight = FontWeight.w500,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = context.appScheme;
    Color textColor;
    if (isProfit(value)) {
      textColor = scheme.profit;
    } else if (isLoss(value)) {
      textColor = scheme.loss;
    } else {
      textColor = scheme.neutralChange;
    }

    return Text(
      formatSignedBrl(value),
      style: GoogleFonts.ibmPlexMono(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: textColor,
      ),
    );
  }
}

/// Exibe um percentual com sinal explícito e cor profit/loss.
class PercentText extends StatelessWidget {
  final Decimal? value;
  final double fontSize;
  final FontWeight fontWeight;

  const PercentText(
    this.value, {
    super.key,
    this.fontSize = AppFontSize.sm,
    this.fontWeight = FontWeight.w500,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = context.appScheme;
    Color textColor;
    if (isProfit(value)) {
      textColor = scheme.profit;
    } else if (isLoss(value)) {
      textColor = scheme.loss;
    } else {
      textColor = scheme.neutralChange;
    }

    return Text(
      formatSignedPercent(value),
      style: GoogleFonts.ibmPlexMono(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: textColor,
      ),
    );
  }
}
