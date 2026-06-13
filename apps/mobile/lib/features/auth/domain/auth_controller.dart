import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/auth_repository.dart';
import '../../../core/api/api_exception.dart';
import 'auth_state.dart';

// ============================================================================
// AuthController — Riverpod StateNotifier que orquestra o fluxo de auth.
// ============================================================================

class AuthController extends StateNotifier<AuthState> {
  final IAuthRepository _repository;

  AuthController(this._repository) : super(const AuthState.unknown());

  /// Verifica se já existe um token salvo (bootstrap no início do app).
  Future<void> checkStoredToken() async {
    final token = await _repository.getAccessToken();
    if (token != null) {
      state = const AuthState.authenticated();
    } else {
      state = const AuthState.unauthenticated();
    }
  }

  Future<void> login(String email, String password) async {
    try {
      final response = await _repository.login(email, password);
      await _repository.saveTokens(response.accessToken, response.refreshToken);
      state = const AuthState.authenticated();
    } on ApiException catch (e) {
      state = AuthState.unauthenticated(error: e.message);
    } catch (_) {
      state = const AuthState.unauthenticated(error: 'Erro inesperado. Tente novamente.');
    }
  }

  Future<void> register(String email, String password) async {
    try {
      final response = await _repository.register(email, password);
      await _repository.saveTokens(response.accessToken, response.refreshToken);
      state = const AuthState.authenticated();
    } on ApiException catch (e) {
      state = AuthState.unauthenticated(error: e.message);
    } catch (_) {
      state = const AuthState.unauthenticated(error: 'Erro inesperado. Tente novamente.');
    }
  }

  Future<void> logout() async {
    await _repository.clearTokens();
    state = const AuthState.unauthenticated();
  }
}

/// Provider do AuthController.
/// O [AuthRepository] concreto é injetado pelo [ProviderScope] via override.
final authControllerProvider =
    StateNotifierProvider<AuthController, AuthState>((ref) {
  throw UnimplementedError(
    'authControllerProvider must be overridden with a concrete AuthRepository.',
  );
});
