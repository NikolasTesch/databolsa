# ADR 0002 — Mobile: Flutter em vez de React Native + Expo

- **Status:** Accepted
- **Data:** 2026-06-12
- **Decisores:** Nikolas Tesch

## Contexto

O stack mobile inicial era React Native + Expo, escolhido pela promessa de reaproveitamento
de código TypeScript com o web. Na prática, a arquitetura já define que toda lógica de negócio
e cálculos financeiros vivem no backend (`apps/api`) ou em `packages/core` — o cliente mobile
é um **consumidor puro da API REST**, sem necessidade de executar lógica de domínio local.
Com isso, o principal argumento a favor do React Native (reusar `packages/core` diretamente)
deixa de existir, e a escolha da tecnologia mobile passa a ser feita por outros critérios.

A decisão foi tomada enquanto `apps/mobile` ainda é um placeholder vazio (`.gitkeep`), o
melhor momento para trocar sem custo de reescrita.

## Opções consideradas

**React Native + Expo**
- Prós: mesma linguagem (TypeScript) do web e backend; `packages/types` compartilhável diretamente; ecossistema grande; Expo simplifica builds.
- Contras: bridge JS/nativo introduz overhead; performance de animações/scroll abaixo do nativo puro; dois frameworks de UI a manter (web + RN); Victory Native diverge da API do Recharts (web).

**Flutter (Dart)**
- Prós: UI renderizada pelo próprio engine (sem bridge), performance próxima do nativo; único codebase para iOS e Android; Material 3 e widgets ricos out-of-the-box; ecossistema amadurecido (`fl_chart` para gráficos); ideal para app de consulta intensivo em listas e animações.
- Contras: linguagem Dart não compartilha código com o monorepo TS; `packages/types` e `packages/ui` não são reusáveis diretamente — tipos Dart precisam ser mantidos à parte ou gerados via OpenAPI; monorepo tooling (pnpm workspaces) não gerencia pacotes Dart.

## Decisão

**Flutter.** O app mobile é um cliente de leitura intensiva (dashboard, gráficos, listas de
ativos) onde a fluidez visual é perceptível ao usuário. Como a lógica de negócio fica no
backend, a perda de reaproveitamento de código TS é marginal. Os tipos de contrato podem ser
gerados automaticamente a partir do schema OpenAPI da API com `openapi-generator` (target Dart).

## Consequências

**Positivas**
- Melhor performance de UI e animações no mobile.
- Um único framework para iOS e Android, sem dependência do Expo/EAS Build.
- `fl_chart` oferece gráficos de pizza e linha com API consistente com o design system.

**Negativas / trade-offs aceitos**
- `packages/ui` passa a ser **exclusivo do web** (Next.js); não há componentes compartilhados com mobile.
- `packages/types` permanece TypeScript; os tipos Dart equivalentes devem ser **gerados do OpenAPI** (`openapi-generator-cli dart-dio`) e versionados em `apps/mobile/lib/api/`.
- `apps/mobile` é um projeto Flutter autônomo dentro do monorepo — gerenciado pelo `flutter` CLI, não pelo pnpm workspace. Turborepo pode orquestrar o build via comando shell customizado.
- Curva de aprendizado com Dart para quem vem de TypeScript (linguagem fortemente tipada, mas diferente).
