import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/money/money.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../data/assets_repository.dart';
import '../domain/asset_models.dart';

class AssetDetailScreen extends ConsumerWidget {
  final String assetId;

  const AssetDetailScreen({super.key, required this.assetId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheme = context.appScheme;
    final assetAsync = ref.watch(assetDetailProvider(assetId));
    final txAsync = ref.watch(assetTransactionsProvider(assetId));

    return Scaffold(
      appBar: AppBar(
        title: assetAsync.maybeWhen(
          data: (a) => Text(a.ticker),
          orElse: () => const Text('Ativo'),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: 'Nova transação',
            onPressed: () => context.go('/assets/$assetId/new-transaction'),
          ),
        ],
      ),
      body: AsyncValueView(
        value: txAsync,
        builder: (transactions) {
          if (transactions.isEmpty) {
            return Center(
              child: Text(
                'Nenhuma transação registrada.',
                style: TextStyle(color: scheme.textMuted),
              ),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(AppSpacing.s4),
            itemCount: transactions.length,
            itemBuilder: (context, index) =>
                _TransactionTile(tx: transactions[index]),
          );
        },
      ),
    );
  }
}

class _TransactionTile extends StatelessWidget {
  final AssetTransaction tx;

  const _TransactionTile({required this.tx});

  @override
  Widget build(BuildContext context) {
    final scheme = context.appScheme;
    final isBuy = tx.isBuy;
    final typeColor = isBuy ? scheme.profit : scheme.loss;

    return Card(
      margin: const EdgeInsets.symmetric(vertical: AppSpacing.s2),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.s4),
        child: Row(
          children: [
            // Tipo
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.s2,
                vertical: 2,
              ),
              decoration: BoxDecoration(
                color: typeColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
              child: Text(
                tx.type,
                style: TextStyle(
                  color: typeColor,
                  fontSize: AppFontSize.xs,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(width: AppSpacing.s3),
            // Data + qtd
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    tx.date,
                    style: TextStyle(
                      fontSize: AppFontSize.sm,
                      color: scheme.textMuted,
                    ),
                  ),
                  Text(
                    '${tx.quantity} × ${formatBrl(tx.unitPrice)}',
                    style: GoogleFonts.ibmPlexMono(
                      fontSize: AppFontSize.sm,
                      color: scheme.text,
                    ),
                  ),
                ],
              ),
            ),
            // Subtotal
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  'Total',
                  style: TextStyle(
                    fontSize: AppFontSize.xs,
                    color: scheme.textSubtle,
                  ),
                ),
                Text(
                  formatBrl(tx.unitPrice * tx.quantity),
                  style: GoogleFonts.ibmPlexMono(
                    fontSize: AppFontSize.sm,
                    fontWeight: FontWeight.w600,
                    color: scheme.text,
                  ),
                ),
                if (tx.fees != null)
                  Text(
                    'taxa: ${formatBrl(tx.fees)}',
                    style: TextStyle(
                      fontSize: AppFontSize.xs - 1,
                      color: scheme.textSubtle,
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
