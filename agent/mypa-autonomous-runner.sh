#!/usr/bin/env bash
set -Eeuo pipefail

# MYPA autonomous overnight runner.
# Runs a Worker -> Supervisor -> CONTINUE loop locally.
# Requires Codex CLI to be installed and authenticated before starting.
#
# Safe-by-default: workspace-write sandbox, no dangerous host-wide access.
# The runner never auto-merges to main and never pushes tags/releases.

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$ROOT_DIR" ]]; then
  echo "ERROR: run this script from inside the MYPA git repository."
  exit 1
fi
cd "$ROOT_DIR"

MAX_CYCLES="${MYPA_MAX_CYCLES:-40}"
MODEL="${MYPA_CODEX_MODEL:-}"
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

- Started: $(date -Is)
- Branch: $BRANCH
- Max cycles: $MAX_CYCLES
- Model override: ${MODEL:-configured-default}

EOF

worker_prompt() {
  cat <<'PROMPT'
You are the MYPA Autonomous Worker.

Read the repository root AGENTS.md first. Then read:
- apps/backend/docs/05_CURRENT_STATE.md
- apps/backend/docs/03_PROJECT_BRAIN_BOOK.md
- apps/backend/docs/04_ARCHITECTURE_ATLAS.md
- apps/backend/docs/02_ROADMAP.md

Treat the repository as technical truth and current-state documentation as progress truth, but verify documentation against code.

Continue the highest-priority unfinished work. Do not invent unrelated features.

For each work item:
DISCOVER -> TWO-PASS REVIEW (when applicable) -> IMPLEMENT -> TEST -> DEBUG -> RETEST -> REVIEW -> HARDEN -> DOCUMENT.

You may edit files, run tests/builds, inspect logs, create tests, and fix root causes.

Never weaken/remove tests, hide errors, fake success, or claim validation that did not occur.
Do not merge to main, delete branches, publish releases, or perform destructive irreversible actions.
Do not expose secrets in files or logs.

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

Read AGENTS.md and the current source-of-truth documents again before judging the worker report.
Worker report:
---
$(cat "$report_file")
---

Inspect the git diff/status and relevant files yourself. Do not trust the worker report blindly.

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
  echo "=================================================="

  git status --short --branch | tee "$CYCLE_DIR/git-status-before.txt"

  worker_file="$CYCLE_DIR/worker-report.txt"
  supervisor_file="$CYCLE_DIR/supervisor-report.txt"

  echo "[Worker] starting..."
  if [[ -n "$MODEL" ]]; then
    codex exec --sandbox workspace-write --ask-for-approval on-request -c approvals_reviewer=auto_review -m "$MODEL" -o "$worker_file" "$(worker_prompt)" 2>&1 | tee "$CYCLE_DIR/worker-console.log"
  else
    codex exec --sandbox workspace-write --ask-for-approval on-request -c approvals_reviewer=auto_review -o "$worker_file" "$(worker_prompt)" 2>&1 | tee "$CYCLE_DIR/worker-console.log"
  fi

  echo "[Supervisor] validating..."
  if [[ -n "$MODEL" ]]; then
    codex exec --sandbox read-only --ask-for-approval never -m "$MODEL" -o "$supervisor_file" "$(supervisor_prompt "$worker_file")" 2>&1 | tee "$CYCLE_DIR/supervisor-console.log"
  else
    codex exec --sandbox read-only --ask-for-approval never -o "$supervisor_file" "$(supervisor_prompt "$worker_file")" 2>&1 | tee "$CYCLE_DIR/supervisor-console.log"
  fi

  decision="$(head -n 1 "$supervisor_file" | tr -d '\r' | xargs)"
  echo "Supervisor decision: $decision"
  echo "Supervisor decision: $decision" >> "$LOG_DIR/session.md"

  git status --short --branch | tee "$CYCLE_DIR/git-status-after.txt"

  case "$decision" in
    CONTINUE|CONTINUE_WITH_CAUTION)
      echo "Supervisor says continue."
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

- Finished: $(date -Is)
- Final branch: $(git branch --show-current)
- Final status:
EOF

git status --short --branch | tee -a "$LOG_DIR/session.md"

echo ""
echo "Session logs: $LOG_DIR"
echo "Autonomous run finished."
