/// Model gerado — representa um Asset retornado pelo backend.
class AssetDto {
  final String id;
  final String ticker;
  final String name;
  final String assetClass;
  final String currency;
  final String dataSource;
  final String userId;
  final String createdAt;

  const AssetDto({
    required this.id,
    required this.ticker,
    required this.name,
    required this.assetClass,
    required this.currency,
    required this.dataSource,
    required this.userId,
    required this.createdAt,
  });

  factory AssetDto.fromJson(Map<String, dynamic> json) => AssetDto(
        id: json['id'] as String,
        ticker: json['ticker'] as String,
        name: json['name'] as String,
        assetClass: json['asset_class'] as String,
        currency: json['currency'] as String,
        dataSource: json['data_source'] as String,
        userId: json['user_id'] as String,
        createdAt: json['created_at'] as String,
      );
}
