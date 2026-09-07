#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$BACKEND_DIR"

if [ -f .env.local ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

: "${SUPABASE_URL:?Create apps/backend/.env.local with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running.}"
: "${SUPABASE_SERVICE_ROLE_KEY:?Create apps/backend/.env.local with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running.}"

command -v node >/dev/null 2>&1 || { echo "Node.js is required."; exit 2; }
command -v pnpm >/dev/null 2>&1 || { echo "pnpm is required."; exit 2; }

pnpm install --frozen-lockfile
pnpm recipe-images:local-mac
pnpm recipe-images:local-mac:audit
