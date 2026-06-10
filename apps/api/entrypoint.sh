#!/bin/sh
# Aplica migrations pendentes antes de iniciar o servidor.
# Em caso de falha na migration, o container encerra (exit != 0) e o
# orquestrador (compose/k8s) detecta a falha sem deixar a api em estado inconsistente.
set -e

echo "[entrypoint] Running Prisma migrations..."
npx prisma migrate deploy

echo "[entrypoint] Starting NestJS..."
exec node dist/main.js
