# ADR-0004 — Migração da API NestJS para Next.js Route Handlers

- **Status:** Accepted
- **Data:** 2026-06-13
- **Autores:** nikolasdtesch@gmail.com

---

## Contexto

No [ADR-0001](0001-backend-stack-node-nestjs.md), decidimos utilizar **Node.js + NestJS** no backend (`apps/api`) para manter a stack unificada em TypeScript e reaproveitar os pacotes `packages/core` e `packages/types`. 

No entanto, hospedar uma aplicação NestJS contínua de forma confiável em produção exige um serviço de hospedagem dedicada de backend (como Railway, Koyeb ou Render pago). Para simplificar o deploy do MVP, reduzir custos a zero e agilizar o desenvolvimento, propõe-se migrar toda a lógica do backend para dentro do próprio Next.js (`apps/web`), rodando as rotas de API como Serverless Functions na **Vercel** e consumindo o banco de dados serverless **Neon**.

## Decisão

Migrar a API de **NestJS** para **Next.js Route Handlers** (API Routes), movendo as funcionalidades para dentro de `apps/web/src/app/api/...`. A aplicação `apps/api` será descontinuada e removida.

A autenticação passará a ser híbrida para suportar ambos os clientes:
1. **Cookies HttpOnly** (`access_token` e `refresh_token`) para o cliente Web (Next.js BFF, mantendo a diretriz do [ADR-0003](0003-web-auth-session-bff.md)).
2. **Authorization Header (Bearer Token)** para o cliente Mobile (Flutter), retornando o token JWT no corpo da resposta JSON durante o login.

O Prisma ORM (schema e migrations) será movido de `apps/api/prisma` para `apps/web/prisma`.

## Consequências

### Positivas

- **Hospedagem Gratuita e Unificada:** Tanto o frontend quanto as rotas de API rodam na Vercel no plano gratuito.
- **Zero CORS:** Como a aplicação Web consome sua própria API na mesma origem, eliminam-se problemas de CORS no navegador.
- **Menos Complexidade no Monorepo:** Remove-se uma aplicação inteira (`apps/api`), reduzindo a sobrecarga de configuração de pacotes, builds e dependências do monorepo.
- **Reuso Direto:** O Next.js continua importando e utilizando os pacotes locais `@databolsa/core` (cálculos) e `@databolsa/types` diretamente através dos workspaces pnpm.

### Negativas / Trade-offs

- **Serverless Cold Starts:** As rotas de API rodando na Vercel como Serverless Functions podem sofrer uma pequena latência (1-3 segundos) no primeiro acesso após um período de inatividade.
- **Perda de Estrutura Modular:** O NestJS oferece uma arquitetura rigidamente organizada e modular (com injeção de dependências nativa, guards e decorators). O Next.js Route Handlers são apenas arquivos de funções puras, exigindo maior disciplina manual do desenvolvedor para manter o código organizado.
- **Migração de Código:** Será necessário reescrever os controllers e services do NestJS para o padrão de Route Handlers do Next.js.

## Referências

- Next.js Route Handlers: [Documentação Oficial](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- SPEC-0011 (Migração da API para Next.js Route Handlers)
