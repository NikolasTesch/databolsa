import 'package:decimal/decimal.dart';
import '../../../core/api/generated/model/portfolio_summary_dto.dart';
import '../../../core/api/generated/model/position_summary_dto.dart';
import '../../../core/money/money.dart';

// ============================================================================
// Domain models para portfolio.
//
// CONVENÇÃO: todos os campos monetários são Decimal — nunca double.
// A conversão String → Decimal ocorre aqui, na borda de entrada.
// Os generated DTOs são apenas para desserialização HTTP.
// ============================================================================

class PositionSummary {
  final String ticker;
  final String assetId;
  final Decimal currentQuantity;
  final Decimal averagePrice;
  final Decimal investedValue;
  final Decimal? valorAtualBrl;
  final Decimal? lucroPrejuizoBrl;
  final Decimal? lucroPrejuizoPct;
  final Decimal? alocacaoPct;
  final bool isStale;

  const PositionSummary({
    required this.ticker,
    required this.assetId,
    required this.currentQuantity,
    required this.averagePrice,
    required this.investedValue,
    this.valorAtualBrl,
    this.lucroPrejuizoBrl,
    this.lucroPrejuizoPct,
    this.alocacaoPct,
    required this.isStale,
  });

  /// Converte o DTO gerado em domain model com Decimal.
  factory PositionSummary.fromDto(PositionSummaryDtoGenerated dto) =>
      PositionSummary(
        ticker: dto.ticker,
        assetId: dto.assetId,
        currentQuantity: parseDecimal(dto.currentQuantity),
        averagePrice: parseDecimal(dto.averagePrice),
        investedValue: parseDecimal(dto.investedValue),
        valorAtualBrl: parseDecimalOrNull(dto.valorAtualBrl),
        lucroPrejuizoBrl: parseDecimalOrNull(dto.lucroPrejuizoBrl),
        lucroPrejuizoPct: parseDecimalOrNull(dto.lucroPrejuizoPct),
        alocacaoPct: parseDecimalOrNull(dto.alocacaoPct),
        isStale: dto.isStale,
      );
}

class PortfolioSummary {
  final List<PositionSummary> positions;
  final Decimal patrimonioTotalBrl;

  const PortfolioSummary({
    required this.positions,
    required this.patrimonioTotalBrl,
  });

  factory PortfolioSummary.fromDto(PortfolioSummaryDtoGenerated dto) =>
      PortfolioSummary(
        positions:
            dto.positions.map(PositionSummary.fromDto).toList(),
        patrimonioTotalBrl: parseDecimal(dto.patrimonioTotalBrl),
      );
}
