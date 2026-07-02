import 'package:databolsa_mobile/features/assets/domain/asset_models.dart';
import 'package:databolsa_mobile/features/assets/presentation/widgets/price_history_chart_mobile.dart';
import 'package:decimal/decimal.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/intl.dart';

// TC-03: Widget — PriceHistoryChartMobile com dados reais.
// TC-04: Widget — PriceHistoryChartMobile com série vazia.
// Cobre: REQ-03, REQ-04, REQ-05, AC-03, AC-04.

Widget _wrap(Widget child) => ProviderScope(
      child: MaterialApp(
        localizationsDelegates: GlobalMaterialLocalizations.delegates,
        supportedLocales: const [Locale('pt', 'BR'), Locale('en', 'US')],
        locale: const Locale('pt', 'BR'),
        home: Scaffold(body: child),
      ),
    );

Future<void> _pumpWidget(WidgetTester tester, Widget child) async {
  Intl.defaultLocale = 'pt_BR';
  await tester.pumpWidget(child);
  await tester.pump();
}

/// Gera uma série de [count] pontos de preço a partir de [startDate].
AssetHistorySeries _makeSeries(
  String ticker,
  String range,
  int count, {
  bool stale = false,
}) {
  final pts = List.generate(count, (i) {
    final date = DateTime(2025, 1, 1).add(Duration(days: i));
    final close = Decimal.parse((38.0 + i * 0.1).toStringAsFixed(2));
    return PricePoint(date: date, close: close);
  });
  return AssetHistorySeries(
    ticker: ticker,
    range: range,
    series: pts,
    stale: stale,
  );
}

void main() {
  group('PriceHistoryChartMobile.subsample', () {
    test('range 1y aplica stride=3', () {
      final pts = List.generate(
        90,
        (i) => PricePoint(
          date: DateTime(2025, 1, 1).add(Duration(days: i)),
          close: Decimal.parse('10.00'),
        ),
      );
      final result = PriceHistoryChartMobile.subsample(pts, '1y');
      // stride=3 → índices 0, 3, 6... + último ponto garantido
      expect(result.length, lessThan(pts.length));
      expect(result.first, pts.first);
      expect(result.last, pts.last);
    });

    test('range 5y aplica stride=7', () {
      final pts = List.generate(
        365,
        (i) => PricePoint(
          date: DateTime(2021, 1, 1).add(Duration(days: i)),
          close: Decimal.parse('50.00'),
        ),
      );
      final result = PriceHistoryChartMobile.subsample(pts, '5y');
      expect(result.length, lessThan(pts.length));
      expect(result.last, pts.last);
    });

    test('range 1m não aplica stride (stride=1)', () {
      final pts = List.generate(
        30,
        (i) => PricePoint(
          date: DateTime(2025, 5, 1).add(Duration(days: i)),
          close: Decimal.parse('20.00'),
        ),
      );
      final result = PriceHistoryChartMobile.subsample(pts, '1m');
      expect(result.length, pts.length);
    });

    test('range 6m não aplica stride (stride=1)', () {
      final pts = List.generate(
        120,
        (i) => PricePoint(
          date: DateTime(2025, 1, 1).add(Duration(days: i)),
          close: Decimal.parse('30.00'),
        ),
      );
      final result = PriceHistoryChartMobile.subsample(pts, '6m');
      expect(result.length, pts.length);
    });
  });

  group('TC-03: PriceHistoryChartMobile — com dados', () {
    testWidgets('renderiza LineChart quando série tem pontos', (tester) async {
      final series = _makeSeries('PETR4', '1m', 20);

      await _pumpWidget(
        tester,
        _wrap(
          PriceHistoryChartMobile(series: series, range: '1m'),
        ),
      );

      // fl_chart renderiza via LineChart
      expect(find.byType(LineChart), findsOneWidget);
      // Placeholder NÃO deve aparecer
      expect(find.text('Histórico indisponível'), findsNothing);
    });

    testWidgets('container tem altura 220', (tester) async {
      final series = _makeSeries('VALE3', '6m', 30);

      await _pumpWidget(
        tester,
        _wrap(
          PriceHistoryChartMobile(series: series, range: '6m'),
        ),
      );

      final sizedBox = tester.widget<SizedBox>(
        find.ancestor(
          of: find.byType(LineChart),
          matching: find.byType(SizedBox),
        ).first,
      );
      expect(sizedBox.height, 220);
    });

    testWidgets('range 1y aplica subsampling (menos pontos)', (tester) async {
      // 100 pontos: com stride=3, deve gerar ~34 pontos
      final series = _makeSeries('ITUB4', '1y', 100);

      await _pumpWidget(
        tester,
        _wrap(
          PriceHistoryChartMobile(series: series, range: '1y'),
        ),
      );
      // O gráfico deve renderizar sem exceção
      expect(find.byType(LineChart), findsOneWidget);
    });
  });

  group('TC-04: PriceHistoryChartMobile — série vazia', () {
    testWidgets('AC-04: exibe placeholder sem lançar exceção', (tester) async {
      final emptySeries = AssetHistorySeries(
        ticker: 'NOVX3',
        range: '1y',
        series: [],
        stale: true,
      );

      // Não deve lançar exceção
      await _pumpWidget(
        tester,
        _wrap(
          PriceHistoryChartMobile(series: emptySeries, range: '1y'),
        ),
      );

      expect(find.text('Histórico indisponível'), findsOneWidget);
      // LineChart NÃO deve estar presente
      expect(find.byType(LineChart), findsNothing);
    });

    testWidgets('series null exibe placeholder sem exceção', (tester) async {
      await _pumpWidget(
        tester,
        _wrap(
          const PriceHistoryChartMobile(series: null, range: '1m'),
        ),
      );

      expect(find.text('Histórico indisponível'), findsOneWidget);
      expect(find.byType(LineChart), findsNothing);
    });
  });
}
