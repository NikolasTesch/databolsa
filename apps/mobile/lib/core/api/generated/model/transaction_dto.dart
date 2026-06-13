/// Model gerado — representa uma Transaction retornada pelo backend.
///
/// AUDITORIA DE CAMPOS MONETÁRIOS:
/// unit_price, quantity, fees são todos String no backend (IsNumberString).
/// Nenhum campo é double — conversão para Decimal ocorre no domain model [AssetTransaction].
class TransactionDto {
  final String id;
  final String assetId;
  final String type; // 'BUY' | 'SELL'
  final String date;
  final String unitPrice; // String — nunca double
  final String quantity;  // String — nunca double
  final String? fees;     // String? — nunca double

  const TransactionDto({
    required this.id,
    required this.assetId,
    required this.type,
    required this.date,
    required this.unitPrice,
    required this.quantity,
    this.fees,
  });

  factory TransactionDto.fromJson(Map<String, dynamic> json) => TransactionDto(
        id: json['id'] as String,
        assetId: json['asset_id'] as String,
        type: json['type'] as String,
        date: json['date'] as String,
        unitPrice: json['unit_price'] as String,
        quantity: json['quantity'] as String,
        fees: json['fees'] as String?,
      );
}
