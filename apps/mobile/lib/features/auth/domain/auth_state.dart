/// Estado de autenticação do app.
enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState {
  final AuthStatus status;
  final String? error;

  const AuthState({required this.status, this.error});

  const AuthState.unknown() : status = AuthStatus.unknown, error = null;
  const AuthState.authenticated() : status = AuthStatus.authenticated, error = null;
  const AuthState.unauthenticated({String? error})
      : status = AuthStatus.unauthenticated,
        error = error;

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isUnknown => status == AuthStatus.unknown;
}
