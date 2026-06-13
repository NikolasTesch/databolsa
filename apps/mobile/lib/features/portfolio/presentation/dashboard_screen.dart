import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_theme.dart';
import '../../../features/auth/domain/auth_controller.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../domain/dashboard_controller.dart';
import 'widgets/allocation_chart.dart';
import 'widgets/patrimonio_header.dart';
import 'widgets/position_card.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheme = context.appScheme;
    final portfolioAsync = ref.watch(dashboardControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('DataBolsa'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Sair',
            onPressed: () => ref.read(authControllerProvider.notifier).logout(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () =>
            ref.read(dashboardControllerProvider.notifier).refresh(),
        child: AsyncValueView(
          value: portfolioAsync,
          errorBuilder: (error, _) => ListView(
            children: [
              Padding(
                padding: const EdgeInsets.all(AppSpacing.s6),
                child: Column(
                  children: [
                    Icon(Icons.error_outline, color: scheme.danger, size: 48),
                    const SizedBox(height: AppSpacing.s4),
                    Text(
                      error.toString(),
                      textAlign: TextAlign.center,
                      style: TextStyle(color: scheme.danger),
                    ),
                  ],
                ),
              ),
            ],
          ),
          builder: (portfolio) => ListView(
            padding: const EdgeInsets.all(AppSpacing.s4),
            children: [
              PatrimonioHeader(patrimonio: portfolio.patrimonioTotalBrl),
              const SizedBox(height: AppSpacing.s6),

              if (portfolio.positions.isNotEmpty) ...[
                Text(
                  'Alocação',
                  style: TextStyle(
                    fontSize: AppFontSize.lg,
                    fontWeight: FontWeight.w600,
                    color: scheme.text,
                  ),
                ),
                const SizedBox(height: AppSpacing.s4),
                AllocationChart(positions: portfolio.positions),
                const SizedBox(height: AppSpacing.s6),
              ],

              Text(
                'Posições',
                style: TextStyle(
                  fontSize: AppFontSize.lg,
                  fontWeight: FontWeight.w600,
                  color: scheme.text,
                ),
              ),
              const SizedBox(height: AppSpacing.s2),

              if (portfolio.positions.isEmpty)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.s8),
                    child: Text(
                      'Nenhuma posição encontrada.',
                      style: TextStyle(color: scheme.textMuted),
                    ),
                  ),
                )
              else
                ...portfolio.positions
                    .map((p) => PositionCard(position: p))
                    .toList(),
            ],
          ),
        ),
      ),
    );
  }
}
