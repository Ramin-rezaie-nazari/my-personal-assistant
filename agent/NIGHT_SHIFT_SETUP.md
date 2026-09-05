# MYPA Overnight Autonomous Runner

This folder contains the local runner for an autonomous Worker -> Supervisor -> Continue loop.

## What it does

`mypa-autonomous-runner.sh` starts repeated Codex CLI cycles. Each cycle:

1. Worker reads project state, implements/fixes work, and runs validation.
2. Supervisor independently reviews the Worker report and the git state.
3. Supervisor returns `CONTINUE`, `CONTINUE_WITH_CAUTION`, or a real stop condition.
4. The runner starts the next cycle automatically.
5. All reports and console logs are written under `agent/runs/<timestamp>/`.

The runner refuses to operate on `main`/`master` and never auto-merges, creates releases, or publishes tags.

## One-time local setup

From the repository root:

```bash
npm install -g @openai/codex
codex --version
codex login
```

Use the normal browser/device authentication supported by your account. Do not put an OpenAI API key in the repository or in shell history.

Make the runner executable:

```bash
chmod +x agent/mypa-autonomous-runner.sh
```

Create a dedicated local branch, or checkout the autonomous branch:

```bash
git fetch origin
git checkout agent/mypa-autonomous-control-plane
git pull --ff-only
```

## Approval configuration

For a long unattended session, Codex must not stop every time it needs an ordinary development action. Current Codex documentation recommends explicit sandboxing; `--full-auto` is deprecated. Workspace-write is the normal automation boundary, while dangerous full host access should only be used in an externally isolated environment. See OpenAI's safety guidance before changing approval settings.

If using auto-review, configure it in `~/.codex/config.toml` according to the current Codex documentation. Do not disable all sandboxing unless the machine itself is a disposable, isolated build environment.

## Start a night shift

From the MYPA repository root:

```bash
MYPA_MAX_CYCLES=40 ./agent/mypa-autonomous-runner.sh
```

Optional model override:

```bash
MYPA_CODEX_MODEL='<your-installed-codex-model>' MYPA_MAX_CYCLES=40 ./agent/mypa-autonomous-runner.sh
```

The runner defaults to 40 cycles as a safety limit. Increase only when you are comfortable with the runtime and quota.

## Where to inspect the result

Each run creates:

```text
agent/runs/<timestamp>/
├── session.md
├── cycle-1/
│   ├── worker-report.txt
│   ├── worker-console.log
│   ├── supervisor-report.txt
│   ├── supervisor-console.log
│   ├── git-status-before.txt
│   └── git-status-after.txt
└── cycle-2/
   ...
```

The final supervisor decision is always visible in `supervisor-report.txt` for the last cycle.

## Important limitation

This runner can keep the Worker/Supervisor loop alive on your machine, but no automation can truthfully bypass physical-device-only validation. Android/iOS hardware checks, Play Store account actions, credentials, and other environment-specific steps remain explicitly reported as unverified until actually performed.
