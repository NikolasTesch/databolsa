import 'package:dio/dio.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/api/generated/model/portfolio_summary_dto.dart';
import '../domain/portfolio_models.dart';

abstract class IPortfolioRepository {
  Future<PortfolioSummary> getSummary();
}

class PortfolioRepository implements IPortfolioRepository {
  final Dio _dio;

  PortfolioRepository({required Dio dio}) : _dio = dio;

  @override
  Future<PortfolioSummary> getSummary() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/portfolio/summary');
      final dto = PortfolioSummaryDtoGenerated.fromJson(response.data!);
      return PortfolioSummary.fromDto(dto);
    } on DioException catch (e) {
      if (e.error is ApiException) throw e.error as ApiException;
      throw ApiException(
        statusCode: e.response?.statusCode,
        message: e.message ?? 'Erro ao carregar portfólio',
      );
    }
  }
}
