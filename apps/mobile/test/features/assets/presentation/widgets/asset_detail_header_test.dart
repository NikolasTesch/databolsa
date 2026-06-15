import 'package:databolsa_mobile/features/assets/domain/asset_models.dart';
import 'package:databolsa_mobile/features/assets/presentation/widgets/asset_detail_header.dart';
import 'package:databolsa_mobile/shared/widgets/stale_badge.dart';
import 'package:databolsa_mobile/shared/widgets/trend_badge.dart';
import 'package:decimal/decimal.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

// TC-02: Widget — AssetDetailHeader.
// Cobre: REQ-01, REQ-02, AC-01, AC-02.
// Mockado: AsyncValue construído localmente, sem rede real.

AssetQuote _makeQuote({
  String ticker = 'PETR4',
  String price = '38.50',
  String currency = 'BRL',
  String? changePercent = '1.20',
  bool stale = false,
}) =>
    AssetQuote(
      ticker: ticker,
      name: 'Petrobras PN',
      price: Decimal.parse(price),
      currency: currency,
      changePercent:
          changePercent != null ? Decimal.parse(changePercent) : null,
      stale: stale,
    );

Widget _wrap(Widget child) => ProviderScope(
      child: MaterialApp(
        home: Scaffold(body: child),
      ),
    );

void main() {
  group('AssetDetailHeader', () {
    testWidgets('estado loading exibe shimmer (sem preço)', (tester) async {
      await tester.pumpWidget(
        _wrap(
          const AssetDetailHeader(quoteAsync: AsyncValue.loading()),
        ),
      );
      // Não deve conter o texto de preço
      expect(find.text('R\$'), findsNothing);
      // Deve ter o widget shimmer (Container como placeholder)
      expect(find.byType(Container), findsWidgets);
    });

    testWidgets('estado erro exibe mensagem amigável', (tester) async {
      await tester.pumpWidget(
        _wrap(
          AssetDetailHeader(
            quoteAsync: AsyncValue.error(Exception('timeout'), StackTrace.empty),
          ),
        ),
      );
      await tester.pump();
      expect(find.text('Cotação indisponível'), findsOneWidget);
    });

    testWidgets('AC-01: exibe preço BRL e TrendBadge positivo', (tester) async {
      final quote = _makeQuote(price: '38.50', changePercent: '1.20');
      await tester.pumpWidget(
        _wrap(
          AssetDetailHeader(quoteAsync: AsyncValue.data(quote)),
        ),
      );
      await tester.pump();

      // Preço BRL formatado
      expect(find.textContaining('38,50'), findsOneWidget);
      // TrendBadge presente
      expect(find.byType(TrendBadge), findsOneWidget);
      // Variação positiva: sinal +
      expect(find.textContaining('+'), findsOneWidget);
    });

    testWidgets('exibe variação negativa com seta para baixo (TrendBadge)',
        (tester) async {
      final quote = _makeQuote(price: '38.00', changePercent: '-0.50');
      await tester.pumpWidget(
        _wrap(
          AssetDetailHeader(quoteAsync: AsyncValue.data(quote)),
        ),
      );
      await tester.pump();
      // Variação negativa → ícone de seta para baixo, sem sinal de menos explícito
      expect(find.byIcon(Icons.arrow_downward), findsOneWidget);
    });

    testWidgets('AC-02: exibe StaleBadge quando stale=true', (tester) async {
      final quote = _makeQuote(stale: true);
      await tester.pumpWidget(
        _wrap(
          AssetDetailHeader(quoteAsync: AsyncValue.data(quote)),
        ),
      );
      await tester.pump();
      expect(find.byType(StaleBadge), findsOneWidget);
    });

    testWidgets('NÃO exibe StaleBadge quando stale=false', (tester) async {
      final quote = _makeQuote(stale: false);
      await tester.pumpWidget(
        _wrap(
          AssetDetailHeader(quoteAsync: AsyncValue.data(quote)),
        ),
      );
      await tester.pump();
      expect(find.byType(StaleBadge), findsNothing);
    });

    testWidgets('TrendBadge exibe "—" quando changePercent é null',
        (tester) async {
      final quote = _makeQuote(changePercent: null);
      await tester.pumpWidget(
        _wrap(
          AssetDetailHeader(quoteAsync: AsyncValue.data(quote)),
        ),
      );
      await tester.pump();
      expect(find.text('—'), findsOneWidget);
    });

    testWidgets('ativo USD exibe moeda sem formatação BRL', (tester) async {
      final quote = _makeQuote(
        price: '189.30',
        currency: 'USD',
        changePercent: '-0.35',
      );
      await tester.pumpWidget(
        _wrap(
          AssetDetailHeader(quoteAsync: AsyncValue.data(quote)),
        ),
      );
      await tester.pump();
      // Deve conter 'USD' antes do preço
      expect(find.textContaining('USD'), findsOneWidget);
    });
  });

  group('TrendBadge', () {
    testWidgets('variação positiva mostra ícone de seta para cima',
        (tester) async {
      await tester.pumpWidget(
        _wrap(
          TrendBadge(changePercent: Decimal.parse('1.50')),
        ),
      );
      await tester.pump();
      expect(find.byIcon(Icons.arrow_upward), findsOneWidget);
    });

    testWidgets('variação negativa mostra ícone de seta para baixo',
        (tester) async {
      await tester.pumpWidget(
        _wrap(
          TrendBadge(changePercent: Decimal.parse('-2.30')),
        ),
      );
      await tester.pump();
      expect(find.byIcon(Icons.arrow_downward), findsOneWidget);
    });

    testWidgets('changePercent null exibe "—" sem ícone', (tester) async {
      await tester.pumpWidget(
        _wrap(TrendBadge(changePercent: null)),
      );
      await tester.pump();
      expect(find.text('—'), findsOneWidget);
      expect(find.byIcon(Icons.arrow_upward), findsNothing);
      expect(find.byIcon(Icons.arrow_downward), findsNothing);
    });
  });
}
