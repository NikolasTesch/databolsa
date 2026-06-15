import 'package:databolsa_mobile/features/assets/domain/asset_models.dart';
import 'package:decimal/decimal.dart';
import 'package:flutter_test/flutter_test.dart';

// TC-01: Unit — AssetQuote.fromJson / PricePoint.fromJson / AssetHistorySeries.fromJson.
// Cobre: REQ-01, REQ-02.
// Todos os campos monetários são Decimal — nunca double.

void main() {
  group('AssetQuote.fromJson', () {
    test('parsing completo com todos os campos', () {
      final json = {
        'ticker': 'PETR4',
        'name': 'Petrobras PN',
        'price': '38.50',
        'currency': 'BRL',
        'priceInBrl': null,
        'changePercent': '1.20',
        'changeValue': '0.46',
        'stale': false,
        'asOf': '2026-06-14T10:00:00Z',
      };

      final quote = AssetQuote.fromJson(json);

      expect(quote.ticker, 'PETR4');
      expect(quote.name, 'Petrobras PN');
      expect(quote.price, Decimal.parse('38.50'));
      expect(quote.currency, 'BRL');
      expect(quote.priceInBrl, isNull);
      expect(quote.changePercent, Decimal.parse('1.20'));
      expect(quote.changeValue, Decimal.parse('0.46'));
      expect(quote.stale, false);
      expect(quote.asOf, '2026-06-14T10:00:00Z');
    });

    test('price é Decimal — não double', () {
      final json = {
        'ticker': 'AAPL',
        'name': 'Apple Inc.',
        'price': '189.30',
        'currency': 'USD',
        'priceInBrl': '945.50',
        'changePercent': '-0.35',
        'changeValue': '-0.67',
        'stale': false,
        'asOf': null,
      };

      final quote = AssetQuote.fromJson(json);

      expect(quote.price, isA<Decimal>());
      expect(quote.price, Decimal.parse('189.30'));
      expect(quote.priceInBrl, Decimal.parse('945.50'));
      expect(quote.changePercent, Decimal.parse('-0.35'));
    });

    test('stale=true é mapeado corretamente (RN-10)', () {
      final json = {
        'ticker': 'BTCUSDT',
        'name': 'Bitcoin',
        'price': '68000.00',
        'currency': 'USD',
        'priceInBrl': null,
        'changePercent': null,
        'changeValue': null,
        'stale': true,
        'asOf': null,
      };

      final quote = AssetQuote.fromJson(json);

      expect(quote.stale, true);
      expect(quote.changePercent, isNull);
      expect(quote.changeValue, isNull);
    });

    test('stale ausente no JSON assume false', () {
      final json = {
        'ticker': 'VALE3',
        'name': 'Vale ON',
        'price': '62.00',
        'currency': 'BRL',
        'priceInBrl': null,
        'changePercent': '0.00',
        'changeValue': '0.00',
        // 'stale' ausente
        'asOf': null,
      };

      final quote = AssetQuote.fromJson(json);

      expect(quote.stale, false);
    });

    test('changePercent null quando campo ausente/null', () {
      final json = {
        'ticker': 'XPTO3',
        'name': 'Xpto SA',
        'price': '10.00',
        'currency': 'BRL',
        'priceInBrl': null,
        'changePercent': null,
        'changeValue': null,
        'stale': false,
        'asOf': null,
      };

      final quote = AssetQuote.fromJson(json);
      expect(quote.changePercent, isNull);
    });
  });

  group('PricePoint.fromJson', () {
    test('parsing de data e close decimal', () {
      final json = {'date': '2026-01-15', 'close': '37.80'};
      final pt = PricePoint.fromJson(json);

      expect(pt.date, DateTime.parse('2026-01-15'));
      expect(pt.close, Decimal.parse('37.80'));
      expect(pt.close, isA<Decimal>());
    });
  });

  group('AssetHistorySeries.fromJson', () {
    test('série com pontos', () {
      final json = {
        'ticker': 'PETR4',
        'range': '1m',
        'series': [
          {'date': '2026-05-01', 'close': '36.00'},
          {'date': '2026-05-02', 'close': '36.50'},
          {'date': '2026-05-03', 'close': '37.20'},
        ],
        'stale': false,
      };

      final series = AssetHistorySeries.fromJson(json);

      expect(series.ticker, 'PETR4');
      expect(series.range, '1m');
      expect(series.series.length, 3);
      expect(series.series[0].close, Decimal.parse('36.00'));
      expect(series.series[2].close, Decimal.parse('37.20'));
      expect(series.stale, false);
    });

    test('série vazia não lança exceção (AC-04)', () {
      final json = {
        'ticker': 'NOVX3',
        'range': '1y',
        'series': <dynamic>[],
        'stale': true,
      };

      expect(() => AssetHistorySeries.fromJson(json), returnsNormally);
      final series = AssetHistorySeries.fromJson(json);
      expect(series.series, isEmpty);
      expect(series.stale, true);
    });

    test('stale ausente assume false', () {
      final json = {
        'ticker': 'VALE3',
        'range': '6m',
        'series': <dynamic>[],
        // 'stale' ausente
      };

      final series = AssetHistorySeries.fromJson(json);
      expect(series.stale, false);
    });
  });
}
