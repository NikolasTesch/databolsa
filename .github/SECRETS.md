# GitHub Actions Secrets

Este documento lista os secrets necessários para o pipeline de CI/CD do DataBolsa.
Configure-os em **Settings → Secrets and variables → Actions** no repositório GitHub.

## Secrets obrigatórios

| Secret | Descrição | Exemplo / Instrução |
|---|---|---|
| `JWT_SECRET` | Chave secreta para assinar os access tokens JWT. Deve ter pelo menos 32 caracteres. | Gere com: `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Chave secreta para assinar os refresh tokens JWT. Deve ser diferente de `JWT_SECRET`. | Gere com: `openssl rand -hex 32` |
| `BRAPI_TOKEN` | Token da API brapi.dev para cotações B3. Em CI, pode ser string vazia ou mock — o `USE_QUOTE_STUB=true` desativa chamadas reais. | `""` ou token real de https://brapi.dev |
| `FINNHUB_KEY` | API key da Finnhub para cotações de ações US. Em CI com `USE_QUOTE_STUB=true`, não é utilizado. | `""` ou key real de https://finnhub.io |

## Secrets gerados automaticamente pelo CI

| Variável | Fonte | Valor em CI |
|---|---|---|
| `DATABASE_URL` | Service container PostgreSQL do workflow | `postgresql://databolsa:databolsa@localhost:5432/databolsa_test` |

## Observações

- **`USE_QUOTE_STUB=true`** é definido diretamente no workflow (não é secret) e
  substitui todos os adapters de cotação pelo `StubQuoteAdapter` com preços fixos.
  Isso evita dependência de APIs externas no CI e elimina flakiness por rate limit.

- Em produção/staging, defina `USE_QUOTE_STUB=false` (ou simplesmente omita a
  variável) e configure os tokens reais nas variáveis de ambiente do servidor.

- Nunca commite secrets em arquivos `.env` que sejam versionados. Use `.env.local`
  (já ignorado pelo `.gitignore`) para desenvolvimento local.
