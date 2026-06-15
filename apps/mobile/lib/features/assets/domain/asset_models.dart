import 'package:decimal/decimal.dart';
import '../../../core/api/generated/model/asset_dto.dart';
import '../../../core/api/generated/model/transaction_dto.dart';
import '../../../core/money/money.dart';

// ============================================================================
// Modelos de mercado (cotação e histórico) — consumidos de endpoints públicos.
// Todos os campos monetários são Decimal — NUNCA double.
// ============================================================================

/// Representa a cotação atual de um ativo retornada por /api/market/[ticker]/quote.
class AssetQuote {
  final String ticker;
  final String name;
  final Decimal price;
  final String currency;

  /// Preço em BRL. Null quando currency == 'BRL' (usar [price] diretamente).
  final Decimal? priceInBrl;

  /// Variação percentual do dia. Null se não disponível (tratar no widget).
  final Decimal? changePercent;

  /// Variação absoluta do dia. Null se não disponível.
  final Decimal? changeValue;

  /// true quando a cotação é proveniente de cache expirado (RN-10).
  final bool stale;

  /// ISO 8601 timestamp da cotação. Null se não informado.
  final String? asOf;

  const AssetQuote({
    required this.ticker,
    required this.name,
    required this.price,
    required this.currency,
    this.priceInBrl,
    this.changePercent,
    this.changeValue,
    required this.stale,
    this.asOf,
  });

  factory AssetQuote.fromJson(Map<String, dynamic> json) => AssetQuote(
        ticker: json['ticker'] as String,
        name: json['name'] as String,
        price: parseDecimal(json['price'] as String),
        currency: json['currency'] as String,
        priceInBrl: parseDecimalOrNull(json['priceInBrl'] as String?),
        changePercent: parseDecimalOrNull(json['changePercent'] as String?),
        changeValue: parseDecimalOrNull(json['changeValue'] as String?),
        stale: json['stale'] as bool? ?? false,
        asOf: json['asOf'] as String?,
      );
}

/// Um único ponto de preço histórico: data + fechamento.
class PricePoint {
  final DateTime date;

  /// Preço de fechamento — Decimal, nunca double.
  final Decimal close;

  const PricePoint({required this.date, required this.close});

  factory PricePoint.fromJson(Map<String, dynamic> json) => PricePoint(
        date: DateTime.parse(json['date'] as String),
        close: parseDecimal(json['close'] as String),
      );
}

/// Série histórica de preços de um ativo retornada por /api/market/[ticker]/history.
class AssetHistorySeries {
  final String ticker;
  final String range;

  /// Lista de pontos ordenados do mais antigo para o mais recente. Pode ser [].
  final List<PricePoint> series;

  /// true quando os dados vieram de cache expirado (RN-10).
  final bool stale;

  const AssetHistorySeries({
    required this.ticker,
    required this.range,
    required this.series,
    required this.stale,
  });

  factory AssetHistorySeries.fromJson(Map<String, dynamic> json) =>
      AssetHistorySeries(
        ticker: json['ticker'] as String,
        range: json['range'] as String,
        series: (json['series'] as List<dynamic>)
            .map((e) => PricePoint.fromJson(e as Map<String, dynamic>))
            .toList(),
        stale: json['stale'] as bool? ?? false,
      );
}

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
