# ADR-0006 — Mobile: instância Dio pública para endpoints de mercado sem auth

- **Status:** accepted
- **Data:** 2026-06-14
- **Autores:** Antigravity, Nikolas

## Contexto

Os endpoints `/api/market/[ticker]/quote` e `/api/market/[ticker]/history` são
públicos — não requerem autenticação. O Dio padrão do app (`authedDio`) injeta
o Bearer token via `AuthInterceptor` em toda requisição e, ao receber um 401,
tenta fazer refresh automático. Chamar rotas públicas com esse Dio é
desnecessariamente acoplado e poderia disparar um ciclo de refresh em caso de
resposta inesperada do servidor.

Além disso, o `MarketRepository` (novo, para cotações e histórico) não tem
relação com o ciclo de vida de autenticação do usuário — ele deve funcionar
mesmo antes do login.

## Decisão

Criar uma instância de `Dio` pública (`publicDio`) via `createDio()` **sem**
nenhum dos callbacks de auth (`onRefreshToken`, `onLogout`, `getAccessToken`,
`getRefreshToken`). Essa instância é injetada no `MarketRepository` e
registrada em `main.dart` como override de `marketRepositoryProvider`.

O `MarketRepository` é separado do `AssetsRepository` — ambos implementam
interfaces distintas (`IMarketRepository` vs `IAssetsRepository`), preservando
o Princípio de Responsabilidade Única (SRP).

```dart
// main.dart
final publicDio = createDio(); // sem auth callbacks
// ...
marketRepositoryProvider.overrideWithValue(
  MarketRepository(dio: publicDio),
),
```

## Consequências

- **Positivas:**
  - Sem risco de refresh espúrio em rotas públicas.
  - `MarketRepository` pode ser instanciado antes do login, sem dependências de
    tokens.
  - SRP preservado: dois repositórios com responsabilidades distintas.
  - Alinhado ao padrão já estabelecido: `AuthRepository` usa seu próprio Dio
    não autenticado.
- **Negativas:**
  - Segunda instância Dio no bootstrap (`main.dart`), aumentando levemente o
    custo de inicialização (negligível).

## Alternativas consideradas

- **Reutilizar `authedDio` com flag para pular interceptor:** mais complexo,
  quebraria a separação de responsabilidades.
- **Adicionar métodos diretamente ao `AssetsRepository`:** misturaria dados
  privados do usuário (assets, transações) com dados públicos de mercado —
  descartado por violar SRP e RN-11 (isolamento por usuário).
