#!/bin/zsh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$REPO_ROOT/apps/backend"
MIRROR_ROOT="${MYPA_CONTENT_MIRROR_ROOT:-$HOME/MYPA-content-mirror}"

cd "$BACKEND"
export MYPA_CONTENT_MIRROR_ROOT="$MIRROR_ROOT"

if command -v pnpm >/dev/null 2>&1; then
  PM=(pnpm)
elif command -v corepack >/dev/null 2>&1; then
  corepack enable >/dev/null 2>&1 || true
  PM=(corepack pnpm)
else
  echo "pnpm/corepack is required for MYPA content mirroring." >&2
  exit 1
fi

echo "MYPA content mirror root: $MYPA_CONTENT_MIRROR_ROOT"
"${PM[@]}" content:mirror
"${PM[@]}" content:mirror:audit

echo
echo "MYPA content mirror finished."
echo "Manifest: $MYPA_CONTENT_MIRROR_ROOT/manifest.json"
echo "Summary:  $MYPA_CONTENT_MIRROR_ROOT/summary.json"
