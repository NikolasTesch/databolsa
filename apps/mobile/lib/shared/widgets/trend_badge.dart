import 'package:decimal/decimal.dart';
import 'package:flutter/material.dart';
import '../../core/money/money.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/theme/app_theme.dart';

// ============================================================================
// TrendBadge — exibe variação percentual com cor e ícone de seta.
//
// Regras visuais:
//   • changePercent > 0  → cor scheme.profit, ícone arrow_upward
//   • changePercent < 0  → cor scheme.loss,   ícone arrow_downward
//   • changePercent == 0 → cor scheme.neutralChange, sem ícone direcional
//   • changePercent null → cor scheme.neutralChange, texto '—'
// ============================================================================

class TrendBadge extends StatelessWidget {
  /// Variação percentual. Null exibe '—' com cor neutra.
  final Decimal? changePercent;

  const TrendBadge({super.key, required this.changePercent});

  @override
  Widget build(BuildContext context) {
    final scheme = context.appScheme;
    final value = changePercent;

    final Color color;
    final IconData? icon;
    final String label;

    if (value == null) {
      color = scheme.neutralChange;
      icon = null;
      label = kEmDash;
    } else if (value > Decimal.zero) {
      color = scheme.profit;
      icon = Icons.arrow_upward;
      label = '+${formatPercent(value)}';
    } else if (value < Decimal.zero) {
      color = scheme.loss;
      icon = Icons.arrow_downward;
      // Exibe o valor absoluto — a seta já indica direção negativa
      label = formatPercent(value.abs());
    } else {
      color = scheme.neutralChange;
      icon = null;
      label = formatPercent(value);
    }

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.s2,
        vertical: 2,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AppRadius.full),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 2),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: AppFontSize.xs,
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
