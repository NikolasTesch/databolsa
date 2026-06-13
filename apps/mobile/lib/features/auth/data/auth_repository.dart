import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/api/generated/model/auth_response_dto.dart';

// ============================================================================
// AuthRepository — persistência de tokens JWT e chamadas de auth na API.
// Tokens armazenados em flutter_secure_storage (Keystore/Keychain).
// ============================================================================

const _kAccessTokenKey = 'access_token';
const _kRefreshTokenKey = 'refresh_token';

abstract class IAuthRepository {
  Future<AuthResponseDto> login(String email, String password);
  Future<AuthResponseDto> register(String email, String password);
  Future<AuthResponseDto> refresh(String refreshToken);
  Future<void> saveTokens(String accessToken, String refreshToken);
  Future<String?> getAccessToken();
  Future<String?> getRefreshToken();
  Future<void> clearTokens();
}

class AuthRepository implements IAuthRepository {
  final Dio _dio;
  final FlutterSecureStorage _storage;

  AuthRepository({required Dio dio, required FlutterSecureStorage storage})
      : _dio = dio,
        _storage = storage;

  @override
  Future<AuthResponseDto> login(String email, String password) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/login',
        data: {'email': email, 'password': password},
      );
      return AuthResponseDto.fromJson(response.data!);
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  @override
  Future<AuthResponseDto> register(String email, String password) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/register',
        data: {'email': email, 'password': password},
      );
      return AuthResponseDto.fromJson(response.data!);
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  @override
  Future<AuthResponseDto> refresh(String refreshToken) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {'refresh_token': refreshToken},
      );
      return AuthResponseDto.fromJson(response.data!);
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  @override
  Future<void> saveTokens(String accessToken, String refreshToken) async {
    await Future.wait([
      _storage.write(key: _kAccessTokenKey, value: accessToken),
      _storage.write(key: _kRefreshTokenKey, value: refreshToken),
    ]);
  }

  @override
  Future<String?> getAccessToken() => _storage.read(key: _kAccessTokenKey);

  @override
  Future<String?> getRefreshToken() => _storage.read(key: _kRefreshTokenKey);

  @override
  Future<void> clearTokens() async {
    await Future.wait([
      _storage.delete(key: _kAccessTokenKey),
      _storage.delete(key: _kRefreshTokenKey),
    ]);
  }

  ApiException _mapError(DioException e) {
    if (e.error is ApiException) return e.error as ApiException;
    return ApiException(
      statusCode: e.response?.statusCode,
      message: e.message ?? 'Erro de rede',
    );
  }
}
