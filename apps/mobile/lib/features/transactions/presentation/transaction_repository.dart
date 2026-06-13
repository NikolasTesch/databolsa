import 'package:decimal/decimal.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/api/generated/model/create_transaction_dto.dart';
import '../../../core/api/generated/model/transaction_dto.dart';
import '../../../features/assets/domain/asset_models.dart';

abstract class ITransactionRepository {
  Future<AssetTransaction> create({
    required String assetId,
    required String type,
    required String date,
    required Decimal unitPrice,
    required Decimal quantity,
    Decimal? fees,
  });
}

class TransactionRepository implements ITransactionRepository {
  final Dio _dio;

  TransactionRepository({required Dio dio}) : _dio = dio;

  @override
  Future<AssetTransaction> create({
    required String assetId,
    required String type,
    required String date,
    required Decimal unitPrice,
    required Decimal quantity,
    Decimal? fees,
  }) async {
    try {
      final payload = CreateTransactionDtoGenerated(
        type: type,
        date: date,
        unitPrice: unitPrice.toString(),
        quantity: quantity.toString(),
        fees: fees?.toString(),
      );

      final response = await _dio.post<Map<String, dynamic>>(
        '/assets/$assetId/transactions',
        data: payload.toJson(),
      );

      return AssetTransaction.fromDto(
        TransactionDto.fromJson(response.data!),
      );
    } on DioException catch (e) {
      if (e.error is ApiException) throw e.error as ApiException;
      throw ApiException(
        statusCode: e.response?.statusCode,
        message: e.message ?? 'Erro ao criar transação',
      );
    }
  }
}

final transactionRepositoryProvider = Provider<ITransactionRepository>(
  (ref) => throw UnimplementedError('transactionRepositoryProvider must be overridden.'),
);
