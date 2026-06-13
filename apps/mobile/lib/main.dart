import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'app.dart';
import 'core/api/dio_client.dart';
import 'features/auth/data/auth_repository.dart';
import 'features/auth/domain/auth_controller.dart';
import 'features/assets/data/assets_repository.dart';
import 'features/portfolio/data/portfolio_repository.dart';
import 'features/portfolio/domain/dashboard_controller.dart';
import 'features/transactions/presentation/transaction_repository.dart';

// ============================================================================
// main.dart — bootstrap do app DataBolsa Mobile.
//
// BASE_URL configurável via --dart-define:
//   flutter run --dart-define=BASE_URL=http://10.0.2.2:3001   (emulador Android)
//   flutter run --dart-define=BASE_URL=http://localhost:3001   (iOS Simulator)
//   flutter run --dart-define=BASE_URL=http://192.168.x.x:3001 (dispositivo físico)
// ============================================================================

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  const storage = FlutterSecureStorage();
  final authRepo = AuthRepository(
    dio: createDio(), // Dio sem interceptor de auth — para login/register/refresh
    storage: storage,
  );

  // Dio autenticado com AuthInterceptor que delega ao authRepo
  final authedDio = createDio(
    onRefreshToken: (refreshToken) async {
      final response = await authRepo.refresh(refreshToken);
      await authRepo.saveTokens(response.accessToken, response.refreshToken);
      return response.accessToken;
    },
    onLogout: () async {
      await authRepo.clearTokens();
    },
    getAccessToken: authRepo.getAccessToken,
    getRefreshToken: authRepo.getRefreshToken,
  );

  runApp(
    ProviderScope(
      overrides: [
        authControllerProvider.overrideWith(
          (ref) => AuthController(authRepo),
        ),
        portfolioRepositoryProvider.overrideWithValue(
          PortfolioRepository(dio: authedDio),
        ),
        assetsRepositoryProvider.overrideWithValue(
          AssetsRepository(dio: authedDio),
        ),
        transactionRepositoryProvider.overrideWithValue(
          TransactionRepository(dio: authedDio),
        ),
      ],
      child: const _Bootstrap(),
    ),
  );
}

/// Widget intermediário que dispara [checkStoredToken] antes de renderizar o app.
/// Garante que AC-04: se tokens válidos existem, vai direto ao dashboard.
class _Bootstrap extends ConsumerWidget {
  const _Bootstrap();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(_bootstrapProvider);
    return const DataBolsaApp();
  }
}

final _bootstrapProvider = FutureProvider<void>((ref) async {
  await ref.read(authControllerProvider.notifier).checkStoredToken();
});
