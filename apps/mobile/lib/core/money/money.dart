import 'package:decimal/decimal.dart';
import 'package:intl/intl.dart';

// ============================================================================
// money.dart — helpers de aritmética e formatação monetária para DataBolsa.
//
// CONVENÇÃO OBRIGATÓRIA:
//   • Toda representação interna de dinheiro, quantidade e percentual é Decimal.
//   • double é usado APENAS na borda de exibição, dentro de NumberFormat.format().
//   • Campos nulos da API são exibidos como '—' (constante kEmDash).
// ============================================================================

const String kEmDash = '—';

/// Formata [value] como moeda BRL: R$ 1.234,56
/// Retorna [kEmDash] se [value] for null.
String formatBrl(Decimal? value) {
  if (value == null) return kEmDash;
  return NumberFormat.currency(locale: 'pt_BR', symbol: 'R\$')
      .format(value.toDouble());
}

/// Formata [value] como percentual: 12,34%
/// Retorna [kEmDash] se [value] for null.
String formatPercent(Decimal? value) {
  if (value == null) return kEmDash;
  return '${NumberFormat('#,##0.00', 'pt_BR').format(value.toDouble())}%';
}

/// Formata [value] com sinal explícito: +R$ 1.234,56 ou −R$ 1.234,56
/// Retorna [kEmDash] se [value] for null.
String formatSignedBrl(Decimal? value) {
  if (value == null) return kEmDash;
  final formatted = formatBrl(value.abs());
  if (value > Decimal.zero) return '+$formatted';
  if (value < Decimal.zero) return '−$formatted';
  return formatted;
}

/// Formata percentual com sinal explícito: +12,34% ou −12,34%
/// Retorna [kEmDash] se [value] for null.
String formatSignedPercent(Decimal? value) {
  if (value == null) return kEmDash;
  final formatted = formatPercent(value.abs());
  if (value > Decimal.zero) return '+$formatted';
  if (value < Decimal.zero) return '−$formatted';
  return formatted;
}

/// Converte uma [String]? da API para [Decimal].
/// Retorna null se a string for null ou vazia.
/// Lança [FormatException] se não for um número válido.
Decimal? parseDecimalOrNull(String? raw) {
  if (raw == null || raw.trim().isEmpty) return null;
  return Decimal.parse(raw.trim());
}

/// Converte uma [String] da API para [Decimal].
/// Lança [FormatException] se não for um número válido.
Decimal parseDecimal(String raw) => Decimal.parse(raw.trim());

/// Retorna true se [value] representa um P/L positivo.
bool isProfit(Decimal? value) => value != null && value > Decimal.zero;

/// Retorna true se [value] representa um P/L negativo.
bool isLoss(Decimal? value) => value != null && value < Decimal.zero;
