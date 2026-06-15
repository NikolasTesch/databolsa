import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/money/money.dart';
import '../../../../core/theme/app_tokens.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/stale_badge.dart';
import '../../../../shared/widgets/trend_badge.dart';
import '../../domain/asset_models.dart';

// ============================================================================
// AssetDetailHeader — exibe cotação atual, variação e badges de stale.
//
// Recebe um AsyncValue<AssetQuote> e trata:
//   loading → shimmer (skeleton retangular)
//   error   → mensagem amigável de erro de cotação
//   data    → preço, currency, TrendBadge, StaleBadge condicional
// ============================================================================

class AssetDetailHeader extends StatelessWidget {
  final AsyncValue<AssetQuote> quoteAsync;

  const AssetDetailHeader({super.key, required this.quoteAsync});

  @override
  Widget build(BuildContext context) {
    return quoteAsync.when(
      loading: () => const _QuoteShimmer(),
      error: (_, __) => const _QuoteError(),
      data: (quote) => _QuoteData(quote: quote),
    );
  }
}

// ---------------------------------------------------------------------------
// Shimmer de carregamento
// ---------------------------------------------------------------------------

class _QuoteShimmer extends StatelessWidget {
  const _QuoteShimmer();

  @override
  Widget build(BuildContext context) {
    final scheme = context.appScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.s4,
        vertical: AppSpacing.s4,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _ShimmerBox(width: 120, height: 32, scheme: scheme),
          const SizedBox(height: AppSpacing.s2),
          _ShimmerBox(width: 80, height: 20, scheme: scheme),
        ],
      ),
    );
  }
}

class _ShimmerBox extends StatelessWidget {
  final double width;
  final double height;
  final AppColorScheme scheme;

  const _ShimmerBox({
    required this.width,
    required this.height,
    required this.scheme,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: scheme.surfaceMuted,
        borderRadius: BorderRadius.circular(AppRadius.sm),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Estado de erro
// ---------------------------------------------------------------------------

class _QuoteError extends StatelessWidget {
  const _QuoteError();

  @override
  Widget build(BuildContext context) {
    final scheme = context.appScheme;
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.s4),
      child: Text(
        'Cotação indisponível',
        style: TextStyle(color: scheme.textMuted, fontSize: AppFontSize.sm),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Dados de cotação
// ---------------------------------------------------------------------------

class _QuoteData extends StatelessWidget {
  final AssetQuote quote;

  const _QuoteData({required this.quote});

  String _formatPrice(AssetQuote q) {
    if (q.currency == 'BRL') {
      return formatBrl(q.price);
    }
    return '${q.currency} ${q.price.toStringAsFixed(2)}';
  }

  @override
  Widget build(BuildContext context) {
    final scheme = context.appScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.s4,
        vertical: AppSpacing.s4,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Linha superior: preço + stale badge
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                _formatPrice(quote),
                style: GoogleFonts.ibmPlexMono(
                  fontSize: AppFontSize.s2xl,
                  fontWeight: FontWeight.w700,
                  color: scheme.text,
                ),
              ),
              if (quote.stale) ...[
                const SizedBox(width: AppSpacing.s2),
                const StaleBadge(),
              ],
            ],
          ),
          const SizedBox(height: AppSpacing.s1),
          // Linha inferior: variação percentual
          TrendBadge(changePercent: quote.changePercent),
        ],
      ),
    );
  }
}
