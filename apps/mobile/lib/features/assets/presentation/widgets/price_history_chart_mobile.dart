import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_tokens.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/asset_models.dart';

// ============================================================================
// PriceHistoryChartMobile — gráfico de linha do histórico de preços usando fl_chart.
//
// Aplica subsampling antes de montar FlSpot para ranges longos:
//   5y → 1 ponto a cada 7 dias  (~260 pontos)
//   1y → 1 ponto a cada 3 dias  (~120 pontos)
//   6m, 1m → sem subsampling
//
// Série vazia → placeholder informativo sem lançar exceção (AC-04).
// ============================================================================

class PriceHistoryChartMobile extends StatelessWidget {
  final AssetHistorySeries? series;
  final String range;

  const PriceHistoryChartMobile({
    super.key,
    required this.series,
    required this.range,
  });

  /// Subsampling: retorna stride baseado no range.
  static List<PricePoint> subsample(List<PricePoint> pts, String range) {
    final stride = range == '5y'
        ? 7
        : range == '1y'
            ? 3
            : 1;
    if (stride <= 1) return pts;
    final result = <PricePoint>[];
    for (int i = 0; i < pts.length; i += stride) {
      result.add(pts[i]);
    }
    // Garante que o último ponto real sempre está na série
    if (result.isEmpty || result.last != pts.last) {
      result.add(pts.last);
    }
    return result;
  }

  @override
  Widget build(BuildContext context) {
    final scheme = context.appScheme;
    final pts = series?.series ?? [];

    if (pts.isEmpty) {
      return SizedBox(
        height: 220,
        child: Center(
          child: Text(
            'Histórico indisponível',
            style: TextStyle(color: scheme.textMuted, fontSize: AppFontSize.sm),
          ),
        ),
      );
    }

    final sampled = subsample(pts, range);

    // Converter Decimal → double APENAS na borda de exibição do fl_chart
    final spots = sampled
        .asMap()
        .entries
        .map((e) => FlSpot(e.key.toDouble(), e.value.close.toDouble()))
        .toList();

    final minY =
        sampled.map((p) => p.close.toDouble()).reduce((a, b) => a < b ? a : b);
    final maxY =
        sampled.map((p) => p.close.toDouble()).reduce((a, b) => a > b ? a : b);
    final padding = (maxY - minY) * 0.05;

    final lineColor = scheme.primary;
    final dateFormat = DateFormat('dd/MM/yy', 'pt_BR');
    final priceFormat = NumberFormat('#,##0.00', 'pt_BR');

    return SizedBox(
      height: 220,
      child: LineChart(
        duration: AppMotion.slow,
        LineChartData(
          minY: minY - padding,
          maxY: maxY + padding,
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            getDrawingHorizontalLine: (_) => FlLine(
              color: scheme.border,
              strokeWidth: 1,
            ),
          ),
          borderData: FlBorderData(show: false),
          titlesData: const FlTitlesData(show: false),
          lineTouchData: LineTouchData(
            touchTooltipData: LineTouchTooltipData(
              getTooltipColor: (_) => scheme.surface,
              tooltipBorder: BorderSide(color: scheme.border),
              getTooltipItems: (touchedSpots) {
                return touchedSpots.map((spot) {
                  final idx = spot.x.toInt();
                  final point = sampled[idx];
                  return LineTooltipItem(
                    '${dateFormat.format(point.date)}\nR\$ ${priceFormat.format(spot.y)}',
                    TextStyle(
                      color: scheme.text,
                      fontSize: AppFontSize.xs,
                    ),
                  );
                }).toList();
              },
            ),
          ),
          lineBarsData: [
            LineChartBarData(
              spots: spots,
              isCurved: true,
              color: lineColor,
              barWidth: 2,
              dotData: const FlDotData(show: false),
              belowBarData: BarAreaData(
                show: true,
                color: lineColor.withValues(alpha: 0.08),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
