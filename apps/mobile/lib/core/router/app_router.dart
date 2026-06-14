import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/domain/auth_controller.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/portfolio/presentation/dashboard_screen.dart';
import '../../features/assets/presentation/asset_detail_screen.dart';
import '../../features/transactions/presentation/new_transaction_screen.dart';

// ============================================================================
// app_router.dart — GoRouter com redirect guard baseado no AuthState.
// AC-04: se há tokens válidos no storage, vai direto ao dashboard.
// ============================================================================

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/dashboard',
    refreshListenable: _AuthNotifierListenable(ref),
    redirect: (BuildContext context, GoRouterState state) {
      final authState = ref.read(authControllerProvider);
      final isAuth = authState.isAuthenticated;
      final isUnknown = authState.isUnknown;
      final goingToAuth = state.matchedLocation.startsWith('/login') ||
          state.matchedLocation.startsWith('/register');

      // Ainda verificando tokens — aguarda
      if (isUnknown) return null;

      // Não autenticado e tentando acessar rota protegida
      if (!isAuth && !goingToAuth) return '/login';

      // Autenticado mas tentando acessar telas de auth
      if (isAuth && goingToAuth) return '/dashboard';

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const DashboardScreen(),
      ),
      GoRoute(
        path: '/assets/:id',
        builder: (context, state) => AssetDetailScreen(
          assetId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: '/assets/:id/new-transaction',
        builder: (context, state) => NewTransactionScreen(
          assetId: state.pathParameters['id']!,
        ),
      ),
    ],
  );
});

/// Listenable que notifica o GoRouter quando o AuthState muda.
class _AuthNotifierListenable extends ChangeNotifier {
  _AuthNotifierListenable(Ref ref) {
    ref.listen(authControllerProvider, (_, _) => notifyListeners());
  }
}
