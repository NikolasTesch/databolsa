import 'package:decimal/decimal.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import '../../../../core/theme/app_tokens.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../features/portfolio/domain/portfolio_models.dart';

// ============================================================================
// AllocationChart — gráfico de rosca (doughnut) com fatias de alocação.
// Usa alocacao_pct de cada PositionSummary.
// Patrimônio zero: exibe mensagem em vez de crashar.
// ============================================================================

class AllocationChart extends StatefulWidget {
  final List<PositionSummary> positions;

  const AllocationChart({super.key, required this.positions});

  @override
  State<AllocationChart> createState() => _AllocationChartState();
}

class _AllocationChartState extends State<AllocationChart> {
  int? _touchedIndex;

  static const List<Color> _chartColors = [
    AppColors.chartCat1,
    AppColors.chartCat2,
    AppColors.chartCat3,
    AppColors.chartCat4,
    AppColors.chartCat5,
    AppColors.chartCat6,
  ];

  @override
  Widget build(BuildContext context) {
    final scheme = context.appScheme;
    final positionsWithAlloc = widget.positions
        .where((p) => p.alocacaoPct != null && p.alocacaoPct! > Decimal.zero)
        .toList();

    if (positionsWithAlloc.isEmpty) {
      return SizedBox(
        height: 200,
        child: Center(
          child: Text(
            'Sem posições para exibir',
            style: TextStyle(color: scheme.textMuted),
          ),
        ),
      );
    }

    final sections = positionsWithAlloc.asMap().entries.map((entry) {
      final i = entry.key;
      final pos = entry.value;
      final pct = pos.alocacaoPct!.toDouble();
      final isTouched = _touchedIndex == i;
      final color = _chartColors[i % _chartColors.length];

      return PieChartSectionData(
        value: pct,
        color: color,
        radius: isTouched ? 65 : 55,
        title: isTouched ? '${pct.toStringAsFixed(1)}%' : '',
        titleStyle: const TextStyle(
          color: Colors.white,
          fontSize: AppFontSize.xs,
          fontWeight: FontWeight.bold,
        ),
      );
    }).toList();

    return Column(
      children: [
        SizedBox(
          height: 200,
          child: PieChart(
            PieChartData(
              sections: sections,
              centerSpaceRadius: 50,
              sectionsSpace: 2,
              pieTouchData: PieTouchData(
                touchCallback: (FlTouchEvent event, PieTouchResponse? response) {
                  setState(() {
                    if (!event.isInterestedForInteractions ||
                        response == null ||
                        response.touchedSection == null) {
                      _touchedIndex = -1;
                      return;
                    }
                    _touchedIndex =
                        response.touchedSection!.touchedSectionIndex;
                  });
                },
              ),
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.s4),
        // Legenda
        Wrap(
          spacing: AppSpacing.s4,
          runSpacing: AppSpacing.s2,
          children: positionsWithAlloc.asMap().entries.map((entry) {
            final i = entry.key;
            final pos = entry.value;
            final color = _chartColors[i % _chartColors.length];
            return Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  pos.ticker,
                  style: TextStyle(
                    fontSize: AppFontSize.xs,
                    color: scheme.textMuted,
                  ),
                ),
              ],
            );
          }).toList(),
        ),
      ],
    );
  }
}
