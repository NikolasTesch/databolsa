import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/money/money.dart';
import '../../../../core/theme/app_tokens.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../features/portfolio/domain/portfolio_models.dart';
import '../../../../shared/widgets/money_text.dart';
import '../../../../shared/widgets/stale_badge.dart';

class PositionCard extends StatelessWidget {
  final PositionSummary position;

  const PositionCard({super.key, required this.position});

  @override
  Widget build(BuildContext context) {
    final scheme = context.appScheme;

    return Card(
      margin: const EdgeInsets.symmetric(vertical: AppSpacing.s2),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadius.lg),
        onTap: () => context.go('/assets/${position.assetId}'),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.s4),
          child: Column(
            children: [
              // Linha superior: ticker + stale badge + valor atual
              Row(
                children: [
                  Text(
                    position.ticker,
                    style: GoogleFonts.ibmPlexMono(
                      fontSize: AppFontSize.base,
                      fontWeight: FontWeight.bold,
                      color: scheme.text,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.s2),
                  if (position.isStale) const StaleBadge(),
                  const Spacer(),
                  MoneyText(
                    position.valorAtualBrl,
                    fontSize: AppFontSize.base,
                    fontWeight: FontWeight.w600,
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.s2),
              // Linha inferior: qtd + preço médio + P/L
              Row(
                children: [
                  Text(
                    '${formatPercent(position.alocacaoPct)} · ${position.currentQuantity.toString()} un.',
                    style: TextStyle(
                      fontSize: AppFontSize.xs,
                      color: scheme.textSubtle,
                    ),
                  ),
                  const Spacer(),
                  SignedMoneyText(position.lucroPrejuizoBrl),
                  const SizedBox(width: AppSpacing.s2),
                  PercentText(position.lucroPrejuizoPct),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
