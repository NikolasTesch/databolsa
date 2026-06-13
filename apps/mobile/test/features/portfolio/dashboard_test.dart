import 'dart:async';
import 'package:databolsa_mobile/features/auth/domain/auth_controller.dart';
import 'package:databolsa_mobile/features/auth/domain/auth_state.dart';
import 'package:databolsa_mobile/features/portfolio/data/portfolio_repository.dart';
import 'package:databolsa_mobile/features/portfolio/domain/dashboard_controller.dart';
import 'package:databolsa_mobile/features/portfolio/domain/portfolio_models.dart';
import 'package:databolsa_mobile/features/portfolio/presentation/dashboard_screen.dart';
import 'package:databolsa_mobile/features/portfolio/presentation/widgets/patrimonio_header.dart';
import 'package:databolsa_mobile/features/portfolio/presentation/widgets/position_card.dart';
import 'package:decimal/decimal.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

// TC-07: Widget tests — Dashboard com PortfolioRepository mockado.
// Cobre: loading/error/data (AC-02).

class MockPortfolioRepository extends Mock implements IPortfolioRepository {}
class MockAuthController extends StateNotifier<AuthState>
    implements AuthController {
  MockAuthController() : super(const AuthState.authenticated());

  @override
  Future<void> checkStoredToken() async {}
  @override
  Future<void> login(String email, String password) async {}
  @override
  Future<void> logout() async {}
  @override
  Future<void> register(String email, String password) async {}
}

PortfolioSummary _mockPortfolio() => PortfolioSummary(
      patrimonioTotalBrl: Decimal.parse('12345.67'),
      positions: [
        PositionSummary(
          ticker: 'PETR4',
          assetId: 'asset-petr4',
          currentQuantity: Decimal.parse('100'),
          averagePrice: Decimal.parse('30.00'),
          investedValue: Decimal.parse('3000.00'),
          valorAtualBrl: Decimal.parse('3500.00'),
          lucroPrejuizoBrl: Decimal.parse('500.00'),
          lucroPrejuizoPct: Decimal.parse('16.67'),
          alocacaoPct: Decimal.parse('28.34'),
          isStale: false,
        ),
      ],
    );

Widget buildDashboard(MockPortfolioRepository mockRepo) {
  return ProviderScope(
    overrides: [
      authControllerProvider.overrideWith((_) => MockAuthController()),
      portfolioRepositoryProvider.overrideWithValue(mockRepo),
    ],
    child: const MaterialApp(
      home: DashboardScreen(),
    ),
  );
}

void main() {
  late MockPortfolioRepository mockRepo;

  setUp(() => mockRepo = MockPortfolioRepository());

  group('DashboardScreen', () {
    testWidgets('exibe loading indicator enquanto carrega (REQ-02)', (tester) async {
      // Simula carregamento lento
      final completer = Completer<PortfolioSummary>();
      when(() => mockRepo.getSummary())
          .thenAnswer((_) => completer.future);

      await tester.pumpWidget(buildDashboard(mockRepo));
      // Só pump, não pumpAndSettle — para capturar o estado de loading
      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      completer.complete(_mockPortfolio());
      // Limpa o timer pendente
      await tester.pumpAndSettle();
    });

    testWidgets('exibe patrimônio e posições após carregamento (AC-02)',
        (tester) async {
      when(() => mockRepo.getSummary())
          .thenAnswer((_) async => _mockPortfolio());

      await tester.pumpWidget(buildDashboard(mockRepo));
      await tester.pumpAndSettle();

      expect(find.byType(PatrimonioHeader), findsOneWidget);
      expect(find.byType(PositionCard), findsOneWidget);
      // PETR4 pode aparecer no card e na legenda do gráfico
      expect(find.text('PETR4'), findsWidgets);
    });

    testWidgets('exibe mensagem de erro quando repository falha', (tester) async {
      when(() => mockRepo.getSummary())
          .thenThrow(Exception('Erro de conexão'));

      await tester.pumpWidget(buildDashboard(mockRepo));
      await tester.pumpAndSettle();

      expect(find.textContaining('Erro de conexão'), findsOneWidget);
    });

    testWidgets('"Nenhuma posição" quando lista está vazia', (tester) async {
      when(() => mockRepo.getSummary()).thenAnswer((_) async => PortfolioSummary(
            patrimonioTotalBrl: Decimal.zero,
            positions: [],
          ));

      await tester.pumpWidget(buildDashboard(mockRepo));
      await tester.pumpAndSettle();

      expect(find.text('Nenhuma posição encontrada.'), findsOneWidget);
    });
  });
}
