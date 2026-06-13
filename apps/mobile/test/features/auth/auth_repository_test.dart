import 'package:databolsa_mobile/features/auth/data/auth_repository.dart';
import 'package:databolsa_mobile/core/api/api_exception.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

// TC-02: Unit tests — AuthRepository (persistência/leitura/limpeza de tokens).

class MockDio extends Mock implements Dio {}
class MockFlutterSecureStorage extends Mock implements FlutterSecureStorage {}

void main() {
  late MockDio mockDio;
  late MockFlutterSecureStorage mockStorage;
  late AuthRepository repository;

  setUp(() {
    mockDio = MockDio();
    mockStorage = MockFlutterSecureStorage();
    repository = AuthRepository(dio: mockDio, storage: mockStorage);
  });

  group('saveTokens', () {
    test('salva access_token e refresh_token no storage (AC-01)', () async {
      when(() => mockStorage.write(key: 'access_token', value: 'abc'))
          .thenAnswer((_) async {});
      when(() => mockStorage.write(key: 'refresh_token', value: 'xyz'))
          .thenAnswer((_) async {});

      await repository.saveTokens('abc', 'xyz');

      verify(() => mockStorage.write(key: 'access_token', value: 'abc')).called(1);
      verify(() => mockStorage.write(key: 'refresh_token', value: 'xyz')).called(1);
    });
  });

  group('getAccessToken', () {
    test('lê access_token do storage (AC-04)', () async {
      when(() => mockStorage.read(key: 'access_token'))
          .thenAnswer((_) async => 'saved_token');

      final token = await repository.getAccessToken();
      expect(token, equals('saved_token'));
    });

    test('retorna null se token não existe', () async {
      when(() => mockStorage.read(key: 'access_token'))
          .thenAnswer((_) async => null);

      final token = await repository.getAccessToken();
      expect(token, isNull);
    });
  });

  group('getRefreshToken', () {
    test('lê refresh_token do storage', () async {
      when(() => mockStorage.read(key: 'refresh_token'))
          .thenAnswer((_) async => 'refresh_xyz');

      final token = await repository.getRefreshToken();
      expect(token, equals('refresh_xyz'));
    });
  });

  group('clearTokens', () {
    test('deleta ambos os tokens do storage', () async {
      when(() => mockStorage.delete(key: 'access_token'))
          .thenAnswer((_) async {});
      when(() => mockStorage.delete(key: 'refresh_token'))
          .thenAnswer((_) async {});

      await repository.clearTokens();

      verify(() => mockStorage.delete(key: 'access_token')).called(1);
      verify(() => mockStorage.delete(key: 'refresh_token')).called(1);
    });
  });

  group('login', () {
    test('retorna AuthResponseDto em caso de sucesso (AC-01)', () async {
      when(() => mockDio.post<Map<String, dynamic>>(
            '/auth/login',
            data: any(named: 'data'),
          )).thenAnswer((_) async => Response(
            requestOptions: RequestOptions(path: '/auth/login'),
            statusCode: 200,
            data: {
              'access_token': 'access_123',
              'refresh_token': 'refresh_456',
            },
          ));

      final result = await repository.login('user@example.com', 'pass123');
      expect(result.accessToken, equals('access_123'));
      expect(result.refreshToken, equals('refresh_456'));
    });

    test('lança ApiException em caso de 401', () async {
      when(() => mockDio.post<Map<String, dynamic>>(
            '/auth/login',
            data: any(named: 'data'),
          )).thenThrow(DioException(
        requestOptions: RequestOptions(path: '/auth/login'),
        response: Response(
          requestOptions: RequestOptions(path: '/auth/login'),
          statusCode: 401,
          data: {'message': 'Credenciais inválidas'},
        ),
        error: const ApiException(statusCode: 401, message: 'Credenciais inválidas'),
        type: DioExceptionType.badResponse,
      ));

      expect(
        () => repository.login('x@x.com', 'wrong'),
        throwsA(isA<ApiException>()),
      );
    });
  });
}
