import 'position_summary_dto.dart';

/// Model gerado — wrapper do PortfolioSummaryDto do backend.
/// patrimonio_total_brl é String (nunca double).
class PortfolioSummaryDtoGenerated {
  final List<PositionSummaryDtoGenerated> positions;
  final String patrimonioTotalBrl;

  const PortfolioSummaryDtoGenerated({
    required this.positions,
    required this.patrimonioTotalBrl,
  });

  factory PortfolioSummaryDtoGenerated.fromJson(Map<String, dynamic> json) =>
      PortfolioSummaryDtoGenerated(
        positions: (json['positions'] as List<dynamic>)
            .map((e) => PositionSummaryDtoGenerated.fromJson(e as Map<String, dynamic>))
            .toList(),
        patrimonioTotalBrl: json['patrimonio_total_brl'] as String,
      );
}
