/// Model gerado equivalente ao output do openapi-generator dart-dio.
///
/// AUDITORIA DE CAMPOS MONETÁRIOS:
/// Todos os campos monetários vêm como String da API (conforme PositionSummaryDto no backend).
/// Portanto NÃO há risco de double aqui — todos são String? ou String.
/// A conversão para Decimal ocorre no domain model [PositionSummary].
class PositionSummaryDtoGenerated {
  final String ticker;
  final String assetId;
  // Campos monetários como String — correto, nunca double
  final String currentQuantity;
  final String averagePrice;
  final String investedValue;
  final String? valorAtualBrl;
  final String? lucroPrejuizoBrl;
  final String? lucroPrejuizoPct;
  final String? alocacaoPct;
  final bool isStale;

  const PositionSummaryDtoGenerated({
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

  factory PositionSummaryDtoGenerated.fromJson(Map<String, dynamic> json) =>
      PositionSummaryDtoGenerated(
        ticker: json['ticker'] as String,
        assetId: json['asset_id'] as String,
        currentQuantity: json['current_quantity'] as String,
        averagePrice: json['average_price'] as String,
        investedValue: json['invested_value'] as String,
        valorAtualBrl: json['valor_atual_brl'] as String?,
        lucroPrejuizoBrl: json['lucro_prejuizo_brl'] as String?,
        lucroPrejuizoPct: json['lucro_prejuizo_pct'] as String?,
        alocacaoPct: json['alocacao_pct'] as String?,
        isStale: json['is_stale'] as bool,
      );
}
