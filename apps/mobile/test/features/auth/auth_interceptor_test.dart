import 'package:databolsa_mobile/core/api/dio_client.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

// TC-03: Unit tests — AuthInterceptor (refresh único no 401; falha → logout).

class MockDio extends Mock implements Dio {}
class MockErrorInterceptorHandler extends Mock
    implements ErrorInterceptorHandler {}
class MockRequestInterceptorHandler extends Mock
    implements RequestInterceptorHandler {}

void main() {
  setUpAll(() {
    registerFallbackValue(RequestOptions(path: ''));
    registerFallbackValue(DioException(
      requestOptions: RequestOptions(path: ''),
    ));
  });

  late MockDio mockDio;
  late MockErrorInterceptorHandler mockErrorHandler;
  late MockRequestInterceptorHandler mockRequestHandler;

  String? storedAccessToken;
  String? storedRefreshToken;
  bool logoutCalled = false;
  int refreshCallCount = 0;

  setUp(() {
    mockDio = MockDio();
    mockErrorHandler = MockErrorInterceptorHandler();
    mockRequestHandler = MockRequestInterceptorHandler();
    storedAccessToken = 'old_access_token';
    storedRefreshToken = 'valid_refresh_token';
    logoutCalled = false;
    refreshCallCount = 0;
  });

  AuthInterceptor buildInterceptor({
    String? newTokenFromRefresh,
    bool refreshShouldFail = false,
  }) {
    return AuthInterceptor(
      dio: mockDio,
      getAccessToken: () async => storedAccessToken,
      getRefreshToken: () async => storedRefreshToken,
      onRefreshToken: (rt) async {
        refreshCallCount++;
        if (refreshShouldFail) throw Exception('refresh failed');
        storedAccessToken = newTokenFromRefresh ?? 'new_access_token';
        return storedAccessToken!;
      },
      onLogout: () async {
        logoutCalled = true;
        storedAccessToken = null;
        storedRefreshToken = null;
      },
    );
  }

  group('onRequest', () {
    test('adiciona Bearer token no header quando token existe', () async {
      final interceptor = buildInterceptor();
      final options = RequestOptions(path: '/portfolio/summary');

      when(() => mockRequestHandler.next(any())).thenReturn(null);

      await interceptor.onRequest(options, mockRequestHandler);

      expect(options.headers['Authorization'], equals('Bearer old_access_token'));
      verify(() => mockRequestHandler.next(options)).called(1);
    });

    test('não adiciona Authorization se token é null', () async {
      storedAccessToken = null;
      final interceptor = buildInterceptor();
      final options = RequestOptions(path: '/portfolio/summary');

      when(() => mockRequestHandler.next(any())).thenReturn(null);

      await interceptor.onRequest(options, mockRequestHandler);

      expect(options.headers.containsKey('Authorization'), isFalse);
    });
  });

  group('onError — 401 refresh (AC-07)', () {
    test('não tenta refresh em rotas /auth/', () async {
      final interceptor = buildInterceptor();
      final err = DioException(
        requestOptions: RequestOptions(path: '/auth/login'),
        response: Response(
          requestOptions: RequestOptions(path: '/auth/login'),
          statusCode: 401,
        ),
        type: DioExceptionType.badResponse,
      );

      when(() => mockErrorHandler.next(any())).thenReturn(null);

      await interceptor.onError(err, mockErrorHandler);

      expect(refreshCallCount, equals(0));
      expect(logoutCalled, isFalse);
      verify(() => mockErrorHandler.next(err)).called(1);
    });

    test('passa erros não-401 adiante sem refresh', () async {
      final interceptor = buildInterceptor();
      final err = DioException(
        requestOptions: RequestOptions(path: '/portfolio/summary'),
        response: Response(
          requestOptions: RequestOptions(path: '/portfolio/summary'),
          statusCode: 500,
        ),
        type: DioExceptionType.badResponse,
      );

      when(() => mockErrorHandler.next(any())).thenReturn(null);

      await interceptor.onError(err, mockErrorHandler);

      expect(refreshCallCount, equals(0));
      verify(() => mockErrorHandler.next(err)).called(1);
    });

    test('logout quando refresh_token é null', () async {
      storedRefreshToken = null;
      final interceptor = buildInterceptor();
      final err = DioException(
        requestOptions: RequestOptions(path: '/portfolio/summary'),
        response: Response(
          requestOptions: RequestOptions(path: '/portfolio/summary'),
          statusCode: 401,
        ),
        type: DioExceptionType.badResponse,
      );

      when(() => mockErrorHandler.next(any())).thenReturn(null);

      await interceptor.onError(err, mockErrorHandler);

      expect(logoutCalled, isTrue);
      expect(refreshCallCount, equals(0));
    });

    test('logout quando refresh falha', () async {
      final interceptor = buildInterceptor(refreshShouldFail: true);
      final err = DioException(
        requestOptions: RequestOptions(path: '/portfolio/summary'),
        response: Response(
          requestOptions: RequestOptions(path: '/portfolio/summary'),
          statusCode: 401,
        ),
        type: DioExceptionType.badResponse,
      );

      when(() => mockErrorHandler.next(any())).thenReturn(null);

      await interceptor.onError(err, mockErrorHandler);

      expect(logoutCalled, isTrue);
    });
  });
}
