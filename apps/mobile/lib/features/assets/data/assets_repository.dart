import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/api/generated/model/asset_dto.dart';
import '../../../core/api/generated/model/transaction_dto.dart';
import '../domain/asset_models.dart';

abstract class IAssetsRepository {
  Future<List<Asset>> findAll();
  Future<Asset> findOne(String id);
  Future<List<AssetTransaction>> findTransactions(String assetId);
}

class AssetsRepository implements IAssetsRepository {
  final Dio _dio;

  AssetsRepository({required Dio dio}) : _dio = dio;

  @override
  Future<List<Asset>> findAll() async {
    try {
      final response = await _dio.get<List<dynamic>>('/assets');
      return (response.data!)
          .map((e) => Asset.fromDto(AssetDto.fromJson(e as Map<String, dynamic>)))
          .toList();
    } on DioException catch (e) {
      throw _map(e);
    }
  }

  @override
  Future<Asset> findOne(String id) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/assets/$id');
      return Asset.fromDto(AssetDto.fromJson(response.data!));
    } on DioException catch (e) {
      throw _map(e);
    }
  }

  @override
  Future<List<AssetTransaction>> findTransactions(String assetId) async {
    try {
      final response =
          await _dio.get<List<dynamic>>('/assets/$assetId/transactions');
      return (response.data!)
          .map((e) => AssetTransaction.fromDto(
                TransactionDto.fromJson(e as Map<String, dynamic>),
              ))
          .toList();
    } on DioException catch (e) {
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

final assetsRepositoryProvider = Provider<IAssetsRepository>(
  (ref) => throw UnimplementedError('assetsRepositoryProvider must be overridden.'),
);

final assetDetailProvider = FutureProvider.autoDispose.family<Asset, String>(
  (ref, id) => ref.read(assetsRepositoryProvider).findOne(id),
);

final assetTransactionsProvider =
    FutureProvider.autoDispose.family<List<AssetTransaction>, String>(
  (ref, assetId) =>
      ref.read(assetsRepositoryProvider).findTransactions(assetId),
);
