#!/usr/bin/env bash
set -Eeuo pipefail

# MYPA autonomous overnight runner.
# Runs a Worker -> Supervisor -> CONTINUE loop locally.
# Requires Codex CLI to be installed and authenticated before starting.
#
# Safe-by-default: workspace-write sandbox, no dangerous host-wide access.
# The runner never auto-merges to main and never pushes tags/releases.
# The worker defaults to approval_policy=never so unattended runs do not pause.
# Rate-limit retries use bounded backoff instead of hammering the API.

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$ROOT_DIR" ]]; then
  echo "ERROR: run this script from inside the MYPA git repository."
  exit 1
fi
cd "$ROOT_DIR"

MAX_CYCLES="${MYPA_MAX_CYCLES:-40}"
MODEL="${MYPA_CODEX_MODEL:-gpt-5.6-luna}"
APPROVAL_POLICY="${MYPA_CODEX_APPROVAL_POLICY:-never}"
RATE_LIMIT_BACKOFF_SECONDS="${MYPA_RATE_LIMIT_BACKOFF_SECONDS:-60}"
CYCLE_PAUSE_SECONDS="${MYPA_CYCLE_PAUSE_SECONDS:-10}"
MAX_CODEX_ATTEMPTS="${MYPA_CODEX_ATTEMPTS:-3}"
BRANCH="$(git branch --show-current)"
LOG_DIR="$ROOT_DIR/agent/runs/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$LOG_DIR"

if [[ "$BRANCH" == "main" || "$BRANCH" == "master" ]]; then
  echo "ERROR: refusing to run autonomous write mode on $BRANCH."
  echo "Create/use a dedicated agent branch first."
  exit 1
fi

if ! command -v codex >/dev/null 2>&1; then
  echo "ERROR: Codex CLI is not installed or not on PATH."
  exit 1
fi

cat > "$LOG_DIR/session.md" <<EOF
# MYPA Autonomous Session

- Started: $(date "+%Y-%m-%dT%H:%M:%S%z")
- Branch: $BRANCH
- Max cycles: $MAX_CYCLES
- Model: $MODEL
- Approval policy: $APPROVAL_POLICY
- Rate-limit backoff: ${RATE_LIMIT_BACKOFF_SECONDS}s

EOF

is_rate_limit_error() {
  local log_file="$1"
  grep -Eqi 'rate limit|rate_limit_exceeded|too many requests|tokens per min|TPM|HTTP 429|429 Too Many|insufficient_quota' "$log_file"
}

run_codex() {
  local sandbox="$1"
  local output_file="$2"
  local console_file="$3"
  local prompt="$4"

  for ((attempt=1; attempt<=MAX_CODEX_ATTEMPTS; attempt++)); do
    echo "[Codex] attempt $attempt / $MAX_CODEX_ATTEMPTS"

    if codex exec \
      --sandbox "$sandbox" \
      -c "approval_policy=$APPROVAL_POLICY" \
      -m "$MODEL" \
      -o "$output_file" \
      "$prompt" 2>&1 | tee -a "$console_file"; then
      return 0
    fi

    if is_rate_limit_error "$console_file" && (( attempt < MAX_CODEX_ATTEMPTS )); then
      echo "[Codex] rate limit detected; sleeping ${RATE_LIMIT_BACKOFF_SECONDS}s before retry..."
      sleep "$RATE_LIMIT_BACKOFF_SECONDS"
      continue
    fi

    return 1
  done

  return 1
}

worker_prompt() {
  cat <<'PROMPT'
You are the MYPA Autonomous Worker.

Read the repository root AGENTS.md first. Then inspect the relevant sections of these source-of-truth documents:
- apps/backend/docs/05_CURRENT_STATE.md
- apps/backend/docs/03_PROJECT_BRAIN_BOOK.md
- apps/backend/docs/04_ARCHITECTURE_ATLAS.md
- apps/backend/docs/02_ROADMAP.md

Context-efficiency rule:
- Do NOT dump entire large documents into the conversation.
- Use rg/grep/head/tail/sed to inspect only the headings and sections relevant to the current work item.
- Start from the current-state highest-priority unfinished item and verify it against code.
- Keep investigation focused on the smallest coherent vertical slice.

Treat the repository as technical truth and current-state documentation as progress truth, but verify documentation against code.

Continue the highest-priority unfinished work. Do not invent unrelated features.
Prefer one coherent, production-relevant work item per cycle rather than broad speculative refactors.

For each work item:
DISCOVER -> TWO-PASS REVIEW (when applicable) -> IMPLEMENT -> TEST -> DEBUG -> RETEST -> REVIEW -> HARDEN -> DOCUMENT.

You may edit files, run tests/builds, inspect logs, create tests, and fix root causes.

Never weaken/remove tests, hide errors, fake success, or claim validation that did not occur.
Do not merge to main, delete branches, publish releases, or perform destructive irreversible actions.
Do not expose secrets in files or logs.

Keep command/tool output focused. Do not paste large unrelated files into your report.

Keep working until:
- the current milestone is genuinely green and documented, or
- a real blocker requires a human/device/credential, or
- the environment cannot continue safely.

At the end, write a concise work report to stdout with these exact headings:
STATUS: GREEN|YELLOW|RED
CONTINUE_RECOMMENDED: YES|NO
WORK_ITEM:
CHANGES:
TESTS_RUN:
BUILD_STATUS:
BLOCKERS:
NEXT_STEP:
EVIDENCE:

Important: CONTINUE_RECOMMENDED should be YES whenever another safe logical task can be performed without human intervention. A single failing test is not a reason to stop; debug it first.
PROMPT
}

supervisor_prompt() {
  local report_file="$1"
  cat <<PROMPT
You are the MYPA Autonomous Supervisor.

Read AGENTS.md and inspect only the relevant sections of the current source-of-truth documents before judging the worker report.
Worker report:
---
$(cat "$report_file")
---

Inspect the git diff/status and relevant changed files yourself. Do not trust the worker report blindly.

Determine whether the worker actually produced evidence for its claims.

You must return exactly one decision on the first line:
CONTINUE
CONTINUE_WITH_CAUTION
BLOCKED_HUMAN_REQUIRED
STOP_RELEASE_READY
STOP_ENVIRONMENT_LIMIT

Then provide:
REASON:
EVIDENCE:
REQUIRED_FIXES:
NEXT_ACTION:

Rules:
- Prefer CONTINUE when safe and another logical task exists.
- Use CONTINUE_WITH_CAUTION for non-blocking known limitations while continuing.
- Use BLOCKED_HUMAN_REQUIRED only for a genuine device/credential/external-account/human-approval dependency.
- STOP_RELEASE_READY is allowed only when release gates are actually evidenced; never infer it from code review alone.
- STOP_ENVIRONMENT_LIMIT is allowed when the environment itself prevents further meaningful work.
- Never approve false-green status.
- Never approve a test that was weakened or skipped just to pass.
PROMPT
}

for ((cycle=1; cycle<=MAX_CYCLES; cycle++)); do
  CYCLE_DIR="$LOG_DIR/cycle-$cycle"
  mkdir -p "$CYCLE_DIR"

  echo "=================================================="
  echo "MYPA AUTONOMOUS CYCLE $cycle / $MAX_CYCLES"
  echo "Branch: $BRANCH"
  echo "Model: $MODEL"
  echo "=================================================="

  git status --short --branch | tee "$CYCLE_DIR/git-status-before.txt"

  worker_file="$CYCLE_DIR/worker-report.txt"
  supervisor_file="$CYCLE_DIR/supervisor-report.txt"

  echo "[Worker] starting..."
  if ! run_codex "workspace-write" "$worker_file" "$CYCLE_DIR/worker-console.log" "$(worker_prompt)"; then
    echo "[Worker] failed. Autonomous run stopping safely."
    echo "WORKER_FAILED" >> "$LOG_DIR/session.md"
    break
  fi

  echo "[Supervisor] validating..."
  if ! run_codex "read-only" "$supervisor_file" "$CYCLE_DIR/supervisor-console.log" "$(supervisor_prompt "$worker_file")"; then
    echo "[Supervisor] failed. Autonomous run stopping safely."
    echo "SUPERVISOR_FAILED" >> "$LOG_DIR/session.md"
    break
  fi

  decision="$(head -n 1 "$supervisor_file" | tr -d '\r' | xargs)"
  echo "Supervisor decision: $decision"
  echo "Supervisor decision: $decision" >> "$LOG_DIR/session.md"

  git status --short --branch | tee "$CYCLE_DIR/git-status-after.txt"

  case "$decision" in
    CONTINUE|CONTINUE_WITH_CAUTION)
      echo "Supervisor says continue."
      if (( cycle < MAX_CYCLES )); then
        echo "Pausing ${CYCLE_PAUSE_SECONDS}s before next cycle..."
        sleep "$CYCLE_PAUSE_SECONDS"
      fi
      ;;
    BLOCKED_HUMAN_REQUIRED|STOP_RELEASE_READY|STOP_ENVIRONMENT_LIMIT)
      echo "Supervisor says stop: $decision"
      break
      ;;
    *)
      echo "ERROR: unexpected supervisor decision '$decision'. Stopping for safety."
      break
      ;;
  esac

done

cat >> "$LOG_DIR/session.md" <<EOF

- Finished: $(date "+%Y-%m-%dT%H:%M:%S%z")
- Final branch: $(git branch --show-current)
- Final status:
EOF

git status --short --branch | tee -a "$LOG_DIR/session.md"

echo ""
echo "Session logs: $LOG_DIR"
echo "Autonomous run finished."
