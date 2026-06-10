# =============================================================================
# IMPORTANTE: o contexto de build deve ser a RAIZ do monorepo, não apps/api.
#   docker build -f apps/api/Dockerfile .
# Isso é necessário para copiar packages/core e packages/types.
# =============================================================================

ARG NODE_VERSION=20
ARG PNPM_VERSION=9

# ─── Stage: base ─────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS base
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app

# ─── Stage: deps (instala todas as dependências com cache de layer) ───────────
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/core/package.json ./packages/core/
COPY packages/types/package.json ./packages/types/
RUN pnpm install --frozen-lockfile

# ─── Stage: dev (hot-reload; usado pelo docker-compose.override.yml) ─────────
FROM deps AS dev
COPY . .
EXPOSE 3001
CMD ["pnpm", "--filter", "api", "run", "start:dev"]

# ─── Stage: build (compila TypeScript) ───────────────────────────────────────
FROM deps AS build
COPY . .
RUN pnpm --filter api run build

# ─── Stage: runner (imagem final mínima de produção) ─────────────────────────
FROM node:${NODE_VERSION}-alpine AS runner
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./
COPY --from=build /app/packages/core/dist ./packages/core/dist
COPY --from=build /app/packages/core/package.json ./packages/core/
COPY --from=build /app/packages/types/dist ./packages/types/dist
COPY --from=build /app/packages/types/package.json ./packages/types/
# Prisma client gerado no build
COPY --from=build /app/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/node_modules/prisma ./node_modules/prisma
COPY --from=build /app/apps/api/prisma ./prisma

COPY apps/api/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs && \
    chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3001

ENTRYPOINT ["/entrypoint.sh"]
