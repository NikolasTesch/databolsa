import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_exception.dart';
import '../domain/asset_models.dart';

// ============================================================================
// market_repository.dart — repositório para endpoints públicos de mercado.
//
// Usa uma instância Dio SEM AuthInterceptor (ADR-0006): endpoints de cotação
// e histórico são públicos e não requerem token JWT.
// ============================================================================

abstract class IMarketRepository {
  /// Busca a cotação atual do [ticker].
  Future<AssetQuote> fetchQuote(String ticker);

  /// Busca o histórico de preços do [ticker] para o [range] especificado.
  /// [range] aceita: '1m', '6m', '1y', '5y'.
  Future<AssetHistorySeries> fetchHistory(String ticker, String range);
}

class MarketRepository implements IMarketRepository {
  final Dio _dio;

  MarketRepository({required Dio dio}) : _dio = dio;

  @override
  Future<AssetQuote> fetchQuote(String ticker) async {
    try {
      final response =
          await _dio.get<Map<String, dynamic>>('/api/market/$ticker/quote');
      return AssetQuote.fromJson(response.data!);
    } on DioException catch (e) {
      // ignore: avoid_print
      print('[MarketRepository] fetchQuote error for $ticker: $e');
      throw _map(e);
    }
  }

  @override
  Future<AssetHistorySeries> fetchHistory(String ticker, String range) async {
    try {
      final response =
          await _dio.get<Map<String, dynamic>>('/api/market/$ticker/history',
              queryParameters: {'range': range});
      final result = AssetHistorySeries.fromJson(response.data!);
      if (result.series.isEmpty) {
        // ignore: avoid_print
        print('[MarketRepository] empty series for $ticker/$range');
      }
      return result;
    } on DioException catch (e) {
      // ignore: avoid_print
      print('[MarketRepository] fetchHistory error for $ticker/$range: $e');
      throw _map(e);
    }
  }

  ApiException _map(DioException e) {
    if (e.error is ApiException) return e.error as ApiException;
    return ApiException(
      statusCode: e.response?.statusCode,
      message: e.message ?? 'Erro de rede',
    );
  }
}

/// Provider base — substituído em [main.dart] com a instância real.
/// Lança [UnimplementedError] se não for sobrescrito (fail-fast).
final marketRepositoryProvider = Provider<IMarketRepository>(
  (ref) => throw UnimplementedError('marketRepositoryProvider must be overridden.'),
);

// ---------------------------------------------------------------------------
// Riverpod providers para consumo nos widgets.
// ---------------------------------------------------------------------------

/// Busca a cotação atual de um ativo pelo [ticker].
final assetQuoteProvider =
    FutureProvider.autoDispose.family<AssetQuote, String>(
  (ref, ticker) => ref.read(marketRepositoryProvider).fetchQuote(ticker),
);

/// Busca o histórico de preços de um ativo.
/// Recebe um record Dart 3: ({String ticker, String range}).
final assetHistoryProvider = FutureProvider.autoDispose
    .family<AssetHistorySeries, ({String ticker, String range})>(
  (ref, key) =>
      ref.read(marketRepositoryProvider).fetchHistory(key.ticker, key.range),
);
