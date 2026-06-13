import 'package:flutter/material.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/theme/app_theme.dart';

/// Badge âmbar exibido quando is_stale=true (RN-10).
/// Ao tocar exibe tooltip 'Cotação desatualizada'.
class StaleBadge extends StatelessWidget {
  const StaleBadge({super.key});

  @override
  Widget build(BuildContext context) {
    final scheme = context.appScheme;
    return Tooltip(
      message: 'Cotação desatualizada',
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.s2,
          vertical: 2,
        ),
        decoration: BoxDecoration(
          color: scheme.stale.withOpacity(0.15),
          borderRadius: BorderRadius.circular(AppRadius.full),
          border: Border.all(color: scheme.stale, width: 1),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.schedule, size: 10, color: scheme.stale),
            const SizedBox(width: 3),
            Text(
              'stale',
              style: TextStyle(
                fontSize: AppFontSize.xs - 2,
                color: scheme.stale,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
