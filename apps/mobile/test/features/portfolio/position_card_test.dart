import 'package:databolsa_mobile/core/money/money.dart';
import 'package:databolsa_mobile/features/portfolio/domain/portfolio_models.dart';
import 'package:databolsa_mobile/features/portfolio/presentation/widgets/position_card.dart';
import 'package:databolsa_mobile/shared/widgets/stale_badge.dart';
import 'package:decimal/decimal.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

// TC-04: Widget tests — PositionCard + StaleBadge.
// Cobre: P/L cor/sinal, badge âmbar, '—' para nulos.

Widget buildCard(PositionSummary position) {
  final router = GoRouter(
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => Scaffold(
          body: PositionCard(position: position),
        ),
      ),
      GoRoute(
        path: '/assets/:id',
        builder: (context, state) => const Scaffold(body: Text('detail')),
      ),
    ],
  );

  return ProviderScope(
    child: MaterialApp.router(routerConfig: router),
  );
}

PositionSummary _makePosition({
  String ticker = 'PETR4',
  String? lucroPrejuizoBrl,
  String? lucroPrejuizoPct,
  String? valorAtualBrl,
  String? alocacaoPct,
  bool isStale = false,
}) =>
    PositionSummary(
      ticker: ticker,
      assetId: 'asset-1',
      currentQuantity: Decimal.parse('10'),
      averagePrice: Decimal.parse('30.00'),
      investedValue: Decimal.parse('300.00'),
      valorAtualBrl: parseDecimalOrNull(valorAtualBrl),
      lucroPrejuizoBrl: parseDecimalOrNull(lucroPrejuizoBrl),
      lucroPrejuizoPct: parseDecimalOrNull(lucroPrejuizoPct),
      alocacaoPct: parseDecimalOrNull(alocacaoPct),
      isStale: isStale,
    );

void main() {
  group('PositionCard', () {
    testWidgets('exibe ticker corretamente', (tester) async {
      final pos = _makePosition(ticker: 'VALE3');
      await tester.pumpWidget(buildCard(pos));
      await tester.pumpAndSettle();
      expect(find.text('VALE3'), findsOneWidget);
    });

    testWidgets('exibe "—" para valor_atual_brl nulo (AC-05)', (tester) async {
      final pos = _makePosition(valorAtualBrl: null);
      await tester.pumpWidget(buildCard(pos));
      await tester.pumpAndSettle();
      // MoneyText com null exibe '—'
      expect(find.text('—'), findsWidgets);
    });

    testWidgets('exibe StaleBadge quando is_stale=true (AC-03)', (tester) async {
      final pos = _makePosition(isStale: true);
      await tester.pumpWidget(buildCard(pos));
      await tester.pumpAndSettle();
      expect(find.byType(StaleBadge), findsOneWidget);
    });

    testWidgets('NÃO exibe StaleBadge quando is_stale=false', (tester) async {
      final pos = _makePosition(isStale: false);
      await tester.pumpWidget(buildCard(pos));
      await tester.pumpAndSettle();
      expect(find.byType(StaleBadge), findsNothing);
    });

    testWidgets('exibe P/L positivo com sinal + (REQ-05)', (tester) async {
      final pos = _makePosition(
        lucroPrejuizoBrl: '150.00',
        lucroPrejuizoPct: '50.00',
      );
      await tester.pumpWidget(buildCard(pos));
      await tester.pumpAndSettle();

      // Deve haver texto com '+' para P/L positivo
      final plusTexts = find.textContaining('+');
      expect(plusTexts, findsWidgets);
    });

    testWidgets('exibe P/L negativo com sinal − (REQ-05)', (tester) async {
      final pos = _makePosition(
        lucroPrejuizoBrl: '-50.00',
        lucroPrejuizoPct: '-16.67',
      );
      await tester.pumpWidget(buildCard(pos));
      await tester.pumpAndSettle();

      final minusTexts = find.textContaining('−');
      expect(minusTexts, findsWidgets);
    });
  });

  group('StaleBadge', () {
    testWidgets('exibe texto "stale"', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: Scaffold(body: StaleBadge()),
          ),
        ),
      );
      expect(find.text('stale'), findsOneWidget);
    });
  });
}
