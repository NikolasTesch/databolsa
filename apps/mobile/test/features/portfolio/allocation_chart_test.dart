import 'package:databolsa_mobile/features/portfolio/domain/portfolio_models.dart';
import 'package:databolsa_mobile/features/portfolio/presentation/widgets/allocation_chart.dart';
import 'package:decimal/decimal.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

// TC-05: Widget tests — AllocationChart.
// Cobre: fatias de alocacao_pct; patrimônio zero sem crash.

PositionSummary _pos(String ticker, String? alocacaoPct) => PositionSummary(
      ticker: ticker,
      assetId: 'id-$ticker',
      currentQuantity: Decimal.parse('10'),
      averagePrice: Decimal.parse('50'),
      investedValue: Decimal.parse('500'),
      alocacaoPct: alocacaoPct != null ? Decimal.parse(alocacaoPct) : null,
      isStale: false,
    );

Widget buildChart(List<PositionSummary> positions) => ProviderScope(
      child: MaterialApp(
        home: Scaffold(
          body: AllocationChart(positions: positions),
        ),
      ),
    );

void main() {
  group('AllocationChart', () {
    testWidgets('renderiza PieChart com posições com alocacao_pct', (tester) async {
      final positions = [
        _pos('PETR4', '60.00'),
        _pos('VALE3', '40.00'),
      ];
      await tester.pumpWidget(buildChart(positions));
      await tester.pumpAndSettle();

      expect(find.byType(PieChart), findsOneWidget);
      expect(find.text('PETR4'), findsOneWidget);
      expect(find.text('VALE3'), findsOneWidget);
    });

    testWidgets('patrimônio zero (sem alocacao_pct) não crasha (AC-05)', (tester) async {
      final positions = [
        _pos('PETR4', null),
        _pos('VALE3', '0'),
      ];
      await tester.pumpWidget(buildChart(positions));
      await tester.pumpAndSettle();

      // Sem posições com alocação, exibe mensagem
      expect(find.text('Sem posições para exibir'), findsOneWidget);
      expect(find.byType(PieChart), findsNothing);
    });

    testWidgets('lista vazia não crasha', (tester) async {
      await tester.pumpWidget(buildChart([]));
      await tester.pumpAndSettle();
      expect(find.text('Sem posições para exibir'), findsOneWidget);
    });
  });
}
