# ADR-0003 — Autenticação Web via BFF com Cookies HttpOnly

**Status:** aceito
**Data:** 2026-06-12
**Autores:** nikolasdtesch@gmail.com

---

## Contexto

O frontend Next.js precisa autenticar o usuário no backend NestJS (JWT access_token + refresh_token). Existem duas abordagens principais:

1. **Token no cliente (localStorage/sessionStorage):** O browser recebe e guarda os tokens diretamente. Chamadas ao backend incluem o token no header `Authorization`.
2. **BFF com cookies httpOnly:** O Next.js atua como Backend-for-Frontend (BFF). O browser jamais vê os tokens — eles ficam em cookies httpOnly gerenciados pelo servidor Next.

## Decisão

Adotamos a **abordagem BFF com cookies httpOnly**.

### Fluxo de autenticação

```
Browser              Next.js BFF (route handlers)      API NestJS
   |                        |                              |
   |-- POST /api/session/login (email+pwd) -->             |
   |                        |-- POST /auth/login -------> |
   |                        |<-- { access_token, refresh_token } --|
   |                        | Set-Cookie: access_token httpOnly    |
   |                        | Set-Cookie: refresh_token httpOnly   |
   |<-- { ok: true } -------|                              |
   |                        |                              |
   |-- GET /api/proxy/portfolio/summary -->                |
   |   (cookie access_token enviado automaticamente)       |
   |                        |-- GET /portfolio/summary (Bearer token) -->
   |                        |<-- PositionSummaryDto[] --|  |
   |<-- PositionSummaryDto[] ---|                         |
```

### Tratamento do 401 (token expirado)

O `lib/api/client.ts` intercepta respostas 401 no browser:

1. Chama `POST /api/session/refresh` (BFF lê o cookie refresh_token e pede novo par ao backend).
2. O BFF grava os novos cookies.
3. Repete a requisição original.
4. Se o refresh também falhar, lança `ApiClientError(401)` → o `AuthProvider` redireciona para `/login`.

## Consequências

### Positivas

- **XSS mitigation:** tokens em httpOnly não são acessíveis a JavaScript malicioso — elimina o vetor de roubo de token via XSS.
- **CSRF mitigation:** `SameSite=Lax` bloqueia o uso dos cookies em requisições cross-site de terceiros sem o token CSRF (suficiente para API REST sem formulários externos).
- **Sem CORS para chamadas client-side:** o browser fala apenas com o Next.js (mesma origem); o Next faz a chamada server-side ao backend. CORS só se aplica ao proxy, configurável centralmente.
- **Refresh transparente:** o usuário não percebe a troca de tokens.

### Negativas / trade-offs

- **Infraestrutura adicional:** o Next.js precisa estar em pé para autenticar; não é possível usar o frontend como SPA pura (CDN-only).
- **Latência:** cada chamada client-side passa pelo proxy Next antes de chegar ao NestJS (mas negligenciável em infra local/container).
- **Tokens não disponíveis no cliente:** impossível inspecionar expiração no browser; isso é intencional mas limita alguns casos de uso (ex.: decodificar `sub`/`email` do JWT no cliente sem uma rota dedicada como `/api/session/me`).

## Alternativas consideradas

| Abordagem | Rejeitada por |
|---|---|
| Token em localStorage | Vulnerável a XSS; tokens acessíveis a qualquer script |
| Token em cookie sem httpOnly | Mesma vulnerabilidade XSS |
| Token em memory (variável React) | Perdido em reload; UX ruim; sem persistência |
| Usar `/auth/me` para hidratar estado | Não existe no backend; fora do escopo do MVP |

## Referências

- OWASP: [Storing Tokens](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#local-storage)
- Next.js App Router: [Route Handlers / Cookies](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- SPEC-0008 (REQ-01, AC-01)
