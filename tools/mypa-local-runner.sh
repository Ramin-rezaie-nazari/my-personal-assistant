#!/usr/bin/env bash
set -u
PROJECT="${MYPA_PROJECT_DIR:-$HOME/my-personal-assistant}"
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
  nvm use --silent 20 >/dev/null 2>&1 || true
fi
LOG="$PROJECT/logs/mypa-local-runner.log"
STATE="$PROJECT/logs/mypa-local-state.env"
LOCK_DIR="$PROJECT/logs/mypa-local-runner.lockdir"
mkdir -p "$PROJECT/logs"
if ! mkdir "$LOCK_DIR" 2>/dev/null; then exit 0; fi
trap 'rmdir "$LOCK_DIR" 2>/dev/null || true' EXIT

printf 'RUNNER_STARTED=%s\n' "$(date '+%Y-%m-%dT%H:%M:%S%z')" >> "$LOG"
while true; do
  {
    printf 'timestamp=%s\n' "$(date '+%Y-%m-%dT%H:%M:%S%z')"
    printf 'macos=%s\n' "$(sw_vers -productVersion)"
    printf 'arch=%s\n' "$(uname -m)"
    printf 'node=%s\n' "$(node --version 2>/dev/null || echo unavailable)"
    printf 'pnpm=%s\n' "$(pnpm --version 2>/dev/null || echo unavailable)"
    printf 'commit=%s\n' "$(cd "$PROJECT" && git rev-parse --short HEAD 2>/dev/null || echo unknown)"
    printf 'image_count=%s\n' "$(find "$PROJECT/data/mypa-recipe-media-local/images/recipes-hq" -type f -name '*.webp' 2>/dev/null | wc -l | tr -d ' ')"
  } > "$STATE"

  # Keeps the Mac awake during the current worker cycle. A fully shut-down Mac cannot run jobs.
  caffeinate -dimsu -w $$ >/dev/null 2>&1 &

  if [[ -x "$PROJECT/tools/recipe-pipeline-supervisor.sh" ]]; then
    "$PROJECT/tools/recipe-pipeline-supervisor.sh" >> "$LOG" 2>&1 || true
  fi

  printf 'HEARTBEAT=%s\n' "$(date '+%Y-%m-%dT%H:%M:%S%z')" >> "$LOG"
  sleep 30
done
