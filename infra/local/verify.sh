#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> Starting local PostgreSQL"
docker compose -f infra/local/docker-compose.yml up -d

echo "==> Waiting for PostgreSQL"
for _ in {1..30}; do
  if docker compose -f infra/local/docker-compose.yml exec -T postgres pg_isready -U mypa -d mypa >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "==> Applying Prisma migrations"
cd apps/backend
pnpm prisma migrate deploy
pnpm prisma generate

echo "==> Importing fitness content"
pnpm fitness:content:import

echo "==> Auditing fitness content"
pnpm fitness:content:audit

echo "==> Verifying approved WebP media"
pnpm fitness:content:verify-media

echo "==> Fitness local release gate: PASS"
