import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/money/money.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_theme.dart';
import '../data/assets_repository.dart';
import '../data/market_repository.dart';
import '../domain/asset_models.dart';
import 'widgets/asset_detail_header.dart';
import 'widgets/price_history_chart_mobile.dart';

// ============================================================================
// AssetDetailScreen — tela de detalhe de ativo.
//
// Layout com CustomScrollView / Slivers:
//   1. AssetDetailHeader  — cotação atual (assetQuoteProvider)
//   2. Seletor de período — StateProvider<String> local ('1m'|'6m'|'1y'|'5y')
//   3. PriceHistoryChartMobile — gráfico histórico (assetHistoryProvider)
//   4. Cabeçalho "Transações"
//   5. Lista de transações (assetTransactionsProvider)
// ============================================================================

/// Provider local para o range selecionado na tela de detalhe.
/// Criado com autoDispose.family para ser isolado por ativo.
final _selectedRangeProvider =
    StateProvider.autoDispose.family<String, String>(
  (ref, assetId) => '1y',
);

const _ranges = ['1m', '6m', '1y', '5y'];

class AssetDetailScreen extends ConsumerWidget {
  final String assetId;

  const AssetDetailScreen({super.key, required this.assetId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheme = context.appScheme;
    final assetAsync = ref.watch(assetDetailProvider(assetId));
    final txAsync = ref.watch(assetTransactionsProvider(assetId));
    final selectedRange = ref.watch(_selectedRangeProvider(assetId));

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
      body: assetAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Text(
            e.toString(),
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.red),
          ),
        ),
        data: (asset) => _AssetDetailBody(
          asset: asset,
          txAsync: txAsync,
          selectedRange: selectedRange,
          scheme: scheme,
          onRangeChanged: (r) =>
              ref.read(_selectedRangeProvider(assetId).notifier).state = r,
        ),
      ),
    );
  }
}

class _AssetDetailBody extends ConsumerWidget {
  final Asset asset;
  final AsyncValue<List<AssetTransaction>> txAsync;
  final String selectedRange;
  final AppColorScheme scheme;
  final ValueChanged<String> onRangeChanged;

  const _AssetDetailBody({
    required this.asset,
    required this.txAsync,
    required this.selectedRange,
    required this.scheme,
    required this.onRangeChanged,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final quoteAsync = ref.watch(assetQuoteProvider(asset.ticker));
    final historyAsync = ref.watch(
      assetHistoryProvider((ticker: asset.ticker, range: selectedRange)),
    );

    final transactions = txAsync.valueOrNull ?? [];

    return CustomScrollView(
      slivers: [
        // --- 1. Cotação atual ---
        SliverToBoxAdapter(
          child: AssetDetailHeader(quoteAsync: quoteAsync),
        ),

        // --- 2. Seletor de período ---
        SliverToBoxAdapter(
          child: _RangeSelector(
            selected: selectedRange,
            onChanged: onRangeChanged,
            scheme: scheme,
          ),
        ),

        // --- 3. Gráfico histórico ---
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s4),
            child: historyAsync.when(
              loading: () => const SizedBox(
                height: 220,
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (error, stack) => const SizedBox(
                height: 220,
                child: Center(child: Text('Histórico indisponível')),
              ),
              data: (series) => PriceHistoryChartMobile(
                series: series,
                range: selectedRange,
              ),
            ),
          ),
        ),

        const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.s4)),

        // --- 4. Cabeçalho de transações ---
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.s4,
              vertical: AppSpacing.s2,
            ),
            child: Text(
              'Transações',
              style: TextStyle(
                fontSize: AppFontSize.base,
                fontWeight: FontWeight.w600,
                color: scheme.text,
              ),
            ),
          ),
        ),

        // --- 5. Lista de transações ---
        txAsync.when(
          loading: () => const SliverToBoxAdapter(
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (e, _) => SliverToBoxAdapter(
            child: Center(
              child: Text(
                e.toString(),
                style: const TextStyle(color: Colors.red),
              ),
            ),
          ),
          data: (txList) {
            if (txList.isEmpty) {
              return SliverToBoxAdapter(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.s4),
                    child: Text(
                      'Nenhuma transação registrada.',
                      style: TextStyle(color: scheme.textMuted),
                    ),
                  ),
                ),
              );
            }
            return SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s4),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => _TransactionTile(tx: transactions[index]),
                  childCount: transactions.length,
                ),
              ),
            );
          },
        ),

        const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.s8)),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Seletor de período
// ---------------------------------------------------------------------------

class _RangeSelector extends StatelessWidget {
  final String selected;
  final ValueChanged<String> onChanged;
  final AppColorScheme scheme;

  const _RangeSelector({
    required this.selected,
    required this.onChanged,
    required this.scheme,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.s4,
        vertical: AppSpacing.s2,
      ),
      child: Row(
        children: _ranges.map((range) {
          final isSelected = range == selected;
          return Padding(
            padding: const EdgeInsets.only(right: AppSpacing.s2),
            child: GestureDetector(
              onTap: () => onChanged(range),
              child: AnimatedContainer(
                duration: AppMotion.fast,
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.s3,
                  vertical: AppSpacing.s1,
                ),
                decoration: BoxDecoration(
                  color: isSelected ? scheme.primary : scheme.surfaceMuted,
                  borderRadius: BorderRadius.circular(AppRadius.full),
                ),
                child: Text(
                  range,
                  style: TextStyle(
                    fontSize: AppFontSize.xs,
                    fontWeight: FontWeight.w600,
                    color: isSelected ? Colors.white : scheme.textMuted,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Tile de transação (reutilizado do código original)
// ---------------------------------------------------------------------------

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
