import 'package:databolsa_mobile/core/money/money.dart';
import 'package:decimal/decimal.dart';
import 'package:flutter_test/flutter_test.dart';

// TC-01: Unit tests para core/money.
// Cobre: Decimal.parse, NumberFormat pt_BR, nulo → '—', sinal P/L.
void main() {
  group('parseDecimal', () {
    test('converte string numérica para Decimal', () {
      expect(parseDecimal('123.45'), equals(Decimal.parse('123.45')));
    });

    test('converte string inteira para Decimal', () {
      expect(parseDecimal('100'), equals(Decimal.parse('100')));
    });

    test('lança FormatException para string inválida', () {
      expect(() => parseDecimal('abc'), throwsA(isA<FormatException>()));
    });
  });

  group('parseDecimalOrNull', () {
    test('retorna null para null', () {
      expect(parseDecimalOrNull(null), isNull);
    });

    test('retorna null para string vazia', () {
      expect(parseDecimalOrNull(''), isNull);
    });

    test('retorna null para string com espaços', () {
      expect(parseDecimalOrNull('   '), isNull);
    });

    test('converte string válida para Decimal', () {
      expect(parseDecimalOrNull('50.25'), equals(Decimal.parse('50.25')));
    });
  });

  group('formatBrl', () {
    test('retorna "—" para null (AC-05)', () {
      expect(formatBrl(null), equals('—'));
    });

    test('formata valor positivo em BRL pt_BR', () {
      final result = formatBrl(Decimal.parse('1234.56'));
      expect(result, contains('1.234'));
      expect(result, contains('56'));
      expect(result, contains('R\$'));
    });

    test('formata zero', () {
      final result = formatBrl(Decimal.zero);
      expect(result, contains('R\$'));
    });
  });

  group('formatPercent', () {
    test('retorna "—" para null', () {
      expect(formatPercent(null), equals('—'));
    });

    test('formata percentual com vírgula decimal (pt_BR)', () {
      final result = formatPercent(Decimal.parse('12.34'));
      expect(result, contains('12'));
      expect(result, contains('34'));
      expect(result, endsWith('%'));
    });
  });

  group('formatSignedBrl — sinal explícito (REQ-05)', () {
    test('retorna "—" para null', () {
      expect(formatSignedBrl(null), equals('—'));
    });

    test('valor positivo → prefixo "+"', () {
      final result = formatSignedBrl(Decimal.parse('100.00'));
      expect(result, startsWith('+'));
    });

    test('valor negativo → prefixo "−"', () {
      final result = formatSignedBrl(Decimal.parse('-50.00'));
      expect(result, startsWith('−'));
    });

    test('zero → sem sinal', () {
      final result = formatSignedBrl(Decimal.zero);
      expect(result, isNot(startsWith('+')));
      expect(result, isNot(startsWith('−')));
    });
  });

  group('formatSignedPercent', () {
    test('retorna "—" para null', () {
      expect(formatSignedPercent(null), equals('—'));
    });

    test('valor positivo → prefixo "+"', () {
      final result = formatSignedPercent(Decimal.parse('5.00'));
      expect(result, startsWith('+'));
      expect(result, endsWith('%'));
    });

    test('valor negativo → prefixo "−"', () {
      final result = formatSignedPercent(Decimal.parse('-3.50'));
      expect(result, startsWith('−'));
    });
  });

  group('isProfit / isLoss', () {
    test('null → não é profit nem loss', () {
      expect(isProfit(null), isFalse);
      expect(isLoss(null), isFalse);
    });

    test('positivo → profit', () {
      expect(isProfit(Decimal.parse('10.00')), isTrue);
      expect(isLoss(Decimal.parse('10.00')), isFalse);
    });

    test('negativo → loss', () {
      expect(isProfit(Decimal.parse('-5.00')), isFalse);
      expect(isLoss(Decimal.parse('-5.00')), isTrue);
    });

    test('zero → nem profit nem loss', () {
      expect(isProfit(Decimal.zero), isFalse);
      expect(isLoss(Decimal.zero), isFalse);
    });
  });
}
