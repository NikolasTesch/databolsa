// Smoke test removido — o app agora usa ProviderScope com overrides obrigatórios.
// Os testes estão em test/core/ e test/features/.
// Este arquivo é mantido para evitar erro de "no tests found".

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('placeholder — testes estão em test/core/ e test/features/', () {
    expect(1 + 1, equals(2));
  });
}
