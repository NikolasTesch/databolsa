import 'package:decimal/decimal.dart';
import '../../../core/api/generated/model/asset_dto.dart';
import '../../../core/api/generated/model/transaction_dto.dart';
import '../../../core/money/money.dart';

// ============================================================================
// Domain models para assets e transactions.
// Todos os campos monetários são Decimal — conversão de String ocorre aqui.
// ============================================================================

class Asset {
  final String id;
  final String ticker;
  final String name;
  final String assetClass;
  final String currency;
  final String dataSource;

  const Asset({
    required this.id,
    required this.ticker,
    required this.name,
    required this.assetClass,
    required this.currency,
    required this.dataSource,
  });

  factory Asset.fromDto(AssetDto dto) => Asset(
        id: dto.id,
        ticker: dto.ticker,
        name: dto.name,
        assetClass: dto.assetClass,
        currency: dto.currency,
        dataSource: dto.dataSource,
      );
}

class AssetTransaction {
  final String id;
  final String assetId;
  final String type; // 'BUY' | 'SELL'
  final String date;
  // Campos monetários: Decimal — NUNCA double
  final Decimal unitPrice;
  final Decimal quantity;
  final Decimal? fees;

  const AssetTransaction({
    required this.id,
    required this.assetId,
    required this.type,
    required this.date,
    required this.unitPrice,
    required this.quantity,
    this.fees,
  });

  factory AssetTransaction.fromDto(TransactionDto dto) => AssetTransaction(
        id: dto.id,
        assetId: dto.assetId,
        type: dto.type,
        date: dto.date,
        unitPrice: parseDecimal(dto.unitPrice),
        quantity: parseDecimal(dto.quantity),
        fees: parseDecimalOrNull(dto.fees),
      );

  bool get isBuy => type == 'BUY';
}
