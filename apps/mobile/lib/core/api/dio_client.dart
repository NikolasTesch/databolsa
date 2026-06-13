import 'dart:async';
import 'package:dio/dio.dart';
import 'api_exception.dart';

// ============================================================================
// dio_client.dart — configuração do Dio + AuthInterceptor com refresh automático.
//
// BASE_URL configurável via --dart-define=BASE_URL=http://...
//   • Emulador Android: http://10.0.2.2:3001
//   • iOS Simulator / macOS: http://localhost:3001
//   • Dispositivo físico: IP da máquina na rede local
// ============================================================================

const String _kDefaultBaseUrl = String.fromEnvironment(
  'BASE_URL',
  defaultValue: 'http://10.0.2.2:3001',
);

/// Callback chamado pelo [AuthInterceptor] para obter um novo access token.
typedef RefreshTokenCallback = Future<String> Function(String refreshToken);

/// Callback chamado quando o refresh falha — deve fazer logout.
typedef LogoutCallback = Future<void> Function();

/// Cria uma instância de [Dio] com interceptors configurados.
Dio createDio({
  String? baseUrl,
  RefreshTokenCallback? onRefreshToken,
  LogoutCallback? onLogout,
  Future<String?> Function()? getAccessToken,
  Future<String?> Function()? getRefreshToken,
}) {
  final dio = Dio(BaseOptions(
    baseUrl: baseUrl ?? _kDefaultBaseUrl,
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 15),
    headers: {'Content-Type': 'application/json'},
  ));

  if (onRefreshToken != null &&
      onLogout != null &&
      getAccessToken != null &&
      getRefreshToken != null) {
    dio.interceptors.add(
      AuthInterceptor(
        dio: dio,
        onRefreshToken: onRefreshToken,
        onLogout: onLogout,
        getAccessToken: getAccessToken,
        getRefreshToken: getRefreshToken,
      ),
    );
  }

  // Error mapping interceptor
  dio.interceptors.add(
    InterceptorsWrapper(
      onError: (DioException e, ErrorInterceptorHandler handler) {
        final response = e.response;
        if (response != null) {
          final data = response.data;
          String message = 'Erro desconhecido';
          if (data is Map<String, dynamic>) {
            message = (data['message'] as String?) ??
                (data['error'] as String?) ??
                message;
          }
          handler.reject(
            DioException(
              requestOptions: e.requestOptions,
              response: response,
              error: ApiException(
                statusCode: response.statusCode,
                message: message,
                raw: data,
              ),
              type: e.type,
            ),
          );
          return;
        }
        handler.next(e);
      },
    ),
  );

  return dio;
}

/// Interceptor que adiciona o Bearer token e faz refresh automático em 401.
///
/// Usa [Completer] + lock para garantir que apenas um refresh aconteça
/// por vez mesmo em requisições concorrentes (evita race condition).
class AuthInterceptor extends Interceptor {
  final Dio _dio;
  final RefreshTokenCallback _onRefreshToken;
  final LogoutCallback _onLogout;
  final Future<String?> Function() _getAccessToken;
  final Future<String?> Function() _getRefreshToken;

  bool _isRefreshing = false;
  Completer<String?>? _refreshCompleter;

  AuthInterceptor({
    required Dio dio,
    required RefreshTokenCallback onRefreshToken,
    required LogoutCallback onLogout,
    required Future<String?> Function() getAccessToken,
    required Future<String?> Function() getRefreshToken,
  })  : _dio = dio,
        _onRefreshToken = onRefreshToken,
        _onLogout = onLogout,
        _getAccessToken = getAccessToken,
        _getRefreshToken = getRefreshToken;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final response = err.response;
    // Se não for 401, ou se a rota for de auth, passa adiante sem tentar refresh
    if (response?.statusCode != 401) {
      handler.next(err);
      return;
    }
    final path = err.requestOptions.path;
    if (path.contains('/auth/')) {
      handler.next(err);
      return;
    }

    // Se já está refreshing, aguarda o resultado do refresh em curso
    if (_isRefreshing) {
      final newToken = await _refreshCompleter!.future;
      if (newToken == null) {
        handler.next(err);
        return;
      }
      final retried = await _retry(err.requestOptions, newToken);
      handler.resolve(retried);
      return;
    }

    // Inicia refresh
    _isRefreshing = true;
    _refreshCompleter = Completer<String?>();

    try {
      final refreshToken = await _getRefreshToken();
      if (refreshToken == null) {
        _refreshCompleter!.complete(null);
        await _onLogout();
        handler.next(err);
        return;
      }

      final newAccessToken = await _onRefreshToken(refreshToken);
      _refreshCompleter!.complete(newAccessToken);

      final retried = await _retry(err.requestOptions, newAccessToken);
      handler.resolve(retried);
    } catch (_) {
      _refreshCompleter!.complete(null);
      await _onLogout();
      handler.next(err);
    } finally {
      _isRefreshing = false;
      _refreshCompleter = null;
    }
  }

  Future<Response<dynamic>> _retry(
    RequestOptions requestOptions,
    String newToken,
  ) async {
    final options = Options(
      method: requestOptions.method,
      headers: {
        ...requestOptions.headers,
        'Authorization': 'Bearer $newToken',
      },
    );
    return _dio.request<dynamic>(
      requestOptions.path,
      data: requestOptions.data,
      queryParameters: requestOptions.queryParameters,
      options: options,
    );
  }
}
