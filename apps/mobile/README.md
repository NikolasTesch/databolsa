# apps/mobile — DataBolsa Mobile

Cliente mobile Flutter para o DataBolsa. Consome a API integrada ao Next.js (Route Handlers em `apps/web/src/app/api/`, ADR-0004).

## Comandos

```bash
# Instalar dependências
flutter pub get

# Rodar testes (sem rede — todos mockados)
flutter test

# Analisar código
flutter analyze

# Rodar o app (emulador Android)
flutter run --dart-define=BASE_URL=http://10.0.2.2:3000

# Rodar o app (iOS Simulator ou macOS)
flutter run --dart-define=BASE_URL=http://localhost:3000

# Rodar o app (dispositivo físico — substitua pelo IP da máquina)
flutter run --dart-define=BASE_URL=http://192.168.1.x:3000
```

## Configuração de BASE_URL

A URL base da API é configurada via `--dart-define=BASE_URL=...`. O padrão é
`http://10.0.2.2:3000` (emulador Android, que redireciona para o `localhost` da
máquina host).

| Ambiente | BASE_URL |
|---|---|
| Emulador Android | `http://10.0.2.2:3000` |
| iOS Simulator / macOS | `http://localhost:3000` |
| Dispositivo físico | `http://<IP_DA_MAQUINA>:3000` |

## Tokens de design (app_tokens.dart)

O arquivo `lib/core/theme/app_tokens.dart` é uma **cópia** de
`packages/ui/src/app_tokens.dart`. Ele é gerado automaticamente pelo script
`node packages/ui/scripts/generate-theme-dart.mjs`. Se os tokens do design system
mudarem, copie o arquivo atualizado:

```bash
# Da raiz do monorepo:
cp packages/ui/src/app_tokens.dart apps/mobile/lib/core/theme/app_tokens.dart
```

## Cliente HTTP (sem openapi-generator em runtime)

O cliente HTTP é implementado manualmente em `lib/core/api/` a partir dos contratos
dos DTOs do backend. Os models em `lib/core/api/generated/model/` são equivalentes ao
output do `openapi-generator dart-dio`, porém escritos manualmente para garantir que
todos os campos monetários sejam `String` (nunca `double`).

**Auditoria de campos monetários obrigatória:** qualquer campo novo que represente
dinheiro, quantidade ou percentual deve ser `String` no DTO gerado e `Decimal` no
domain model correspondente.

## Convencoes nao-negociaveis

- **Nunca `double` para dinheiro.** Todo campo monetario e `Decimal` (package `decimal`).
- **`double` apenas na borda de exibicao:** `value.toDouble()` dentro de `NumberFormat`.
- **Campos nulos → `"—"`** via `formatBrl(null)`, nunca quebrar.
- **`is_stale: true` → `StaleBadge` ambar** (RN-10).
- **IBM Plex Mono** em todos os valores monetarios, tickers e percentuais.

## Estrutura

```
lib/
  main.dart              # Bootstrap + injecao de providers concretos
  app.dart               # MaterialApp.router com GoRouter
  core/
    theme/               # app_tokens.dart (copia), app_theme.dart
    api/                 # dio_client.dart, api_exception.dart, generated/model/
    money/               # money.dart (Decimal helpers + formatacao pt_BR)
    router/              # app_router.dart (GoRouter + guarda de auth)
  features/
    auth/                # Login, Register, AuthRepository, AuthController
    portfolio/           # Dashboard, PositionCard, AllocationChart, PatrimonioHeader
    assets/              # AssetDetailScreen, AssetsRepository
    transactions/        # NewTransactionScreen, TransactionRepository
  shared/widgets/        # MoneyText, SignedMoneyText, PercentText, StaleBadge, ...
test/
  core/money/            # TC-01: unit tests de money.dart
  features/auth/         # TC-02: AuthRepository, TC-03: AuthInterceptor
  features/portfolio/    # TC-04: PositionCard+StaleBadge, TC-05: AllocationChart, TC-07: Dashboard
  features/transactions/ # TC-06: TransactionForm
```
