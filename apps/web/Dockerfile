# =============================================================================
# IMPORTANTE: o contexto de build deve ser a RAIZ do monorepo, não apps/web.
#   docker build -f apps/web/Dockerfile .
# =============================================================================

ARG NODE_VERSION=20
ARG PNPM_VERSION=9

# ─── Stage: base ─────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS base
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app

# ─── Stage: deps ─────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
RUN pnpm install --frozen-lockfile

# ─── Stage: dev (hot-reload; usado pelo docker-compose.override.yml) ─────────
FROM deps AS dev
COPY . .
EXPOSE 3000
CMD ["pnpm", "--filter", "web", "run", "dev"]

# ─── Stage: build ────────────────────────────────────────────────────────────
FROM deps AS build
COPY . .
# Habilita output standalone do Next.js (configurar em next.config.ts:
#   output: 'standalone')
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter web run build

# ─── Stage: runner (imagem final mínima de produção) ─────────────────────────
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copia o output standalone gerado pelo Next.js
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
