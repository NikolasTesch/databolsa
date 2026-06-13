import 'package:databolsa_mobile/core/api/api_exception.dart';
import 'package:databolsa_mobile/features/transactions/presentation/new_transaction_screen.dart';
import 'package:databolsa_mobile/features/transactions/presentation/transaction_repository.dart';
import 'package:decimal/decimal.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

// TC-06: Widget tests — TransactionForm.
// Cobre: validação local e exibição do erro 422 (RN-02: SELL maior que posição).

class MockTransactionRepository extends Mock implements ITransactionRepository {}

Widget buildScreen(ITransactionRepository repo) {
  return ProviderScope(
    overrides: [
      transactionRepositoryProvider.overrideWithValue(repo),
    ],
    child: const MaterialApp(
      home: NewTransactionScreen(assetId: 'asset-123'),
    ),
  );
}

void main() {
  late MockTransactionRepository mockRepo;

  setUp(() {
    mockRepo = MockTransactionRepository();
    registerFallbackValue(Decimal.zero);
  });

  group('TransactionForm — validação local', () {
    testWidgets('exibe erro quando preço unitário está vazio', (tester) async {
      await tester.pumpWidget(buildScreen(mockRepo));
      await tester.pumpAndSettle();

      // Toca no botão sem preencher nada
      await tester.tap(find.text('Registrar compra'));
      await tester.pumpAndSettle();

      expect(find.text('Informe o preço'), findsOneWidget);
    });

    testWidgets('exibe erro quando quantidade está vazia', (tester) async {
      await tester.pumpWidget(buildScreen(mockRepo));
      await tester.pumpAndSettle();

      await tester.enterText(
          find.widgetWithText(TextFormField, 'Preço unitário (R\$)'), '10.00');
      await tester.tap(find.text('Registrar compra'));
      await tester.pumpAndSettle();

      expect(find.text('Informe a quantidade'), findsOneWidget);
    });

    testWidgets('exibe erro quando preço é negativo ou zero', (tester) async {
      await tester.pumpWidget(buildScreen(mockRepo));
      await tester.pumpAndSettle();

      await tester.enterText(
          find.widgetWithText(TextFormField, 'Preço unitário (R\$)'), '-5');
      await tester.tap(find.text('Registrar compra'));
      await tester.pumpAndSettle();

      expect(find.text('O preço deve ser positivo'), findsOneWidget);
    });
  });

  group('TransactionForm — erro 422 da API (AC-06)', () {
    testWidgets('exibe mensagem de erro inline quando API retorna 422', (tester) async {
      when(() => mockRepo.create(
            assetId: any(named: 'assetId'),
            type: any(named: 'type'),
            date: any(named: 'date'),
            unitPrice: any(named: 'unitPrice'),
            quantity: any(named: 'quantity'),
            fees: any(named: 'fees'),
          )).thenThrow(const ApiException(
        statusCode: 422,
        message: 'Quantidade vendida (15) excede a posição atual (10)',
      ));

      await tester.pumpWidget(buildScreen(mockRepo));
      await tester.pumpAndSettle();

      // Seleciona VENDA
      await tester.tap(find.text('VENDA'));
      await tester.pumpAndSettle();

      // Preenche campos válidos
      await tester.enterText(
          find.widgetWithText(TextFormField, 'Preço unitário (R\$)'), '50.00');
      await tester.enterText(
          find.widgetWithText(TextFormField, 'Quantidade'), '15');

      await tester.tap(find.text('Registrar venda'));
      await tester.pumpAndSettle();

      expect(
        find.textContaining('Quantidade vendida'),
        findsOneWidget,
      );
    });
  });
}
