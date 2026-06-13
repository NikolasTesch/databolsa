/// Representa um erro retornado pela API DataBolsa.
class ApiException implements Exception {
  final int? statusCode;
  final String message;
  final dynamic raw;

  const ApiException({
    this.statusCode,
    required this.message,
    this.raw,
  });

  /// Verifica se este erro é um erro de validação (422 — ex: SELL maior que posição).
  bool get isUnprocessable => statusCode == 422;

  /// Verifica se este erro é de autenticação (401).
  bool get isUnauthorized => statusCode == 401;

  @override
  String toString() => 'ApiException($statusCode): $message';
}
