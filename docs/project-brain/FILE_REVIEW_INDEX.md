# File Review Index

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: current-`main` root/backend/mobile manifests, `apps/backend/src/app.module.ts`, and 47 identified Core source files.
Scope not yet read: complete repository source inventory; non-Core source; schema/migrations; CI; mobile source/tests.
Evidence roots: current-`main` commit `e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b` and Core source paths.
Confidence level: MEDIUM for listed Core files; LOW for repository completeness.
Open questions: automated line counts; hidden/additional files; exact total source count.

## Current known source inventory — Core

| Path / scope | Language | Line count | Module | Purpose | Status |
|---|---|---:|---|---|---|
| `apps/backend/src/modules/auth/**` (11 identified files) | TypeScript | unknown* | auth | auth/session/token flow | READ_COMPLETELY |
| `apps/backend/src/modules/users/**` (5 identified files) | TypeScript | unknown* | users | account/profile routes | READ_COMPLETELY |
| `apps/backend/src/modules/profile/**` (4 identified files) | TypeScript | unknown* | profile | extended profile | READ_COMPLETELY |
| `apps/backend/src/modules/preferences/**` (4 identified files) | TypeScript | unknown* | preferences | user preferences | READ_COMPLETELY |
| `apps/backend/src/modules/onboarding/**` (4 identified files) | TypeScript | unknown* | onboarding | onboarding state | READ_COMPLETELY |
| `apps/backend/src/modules/settings/**` (4 identified files) | TypeScript | unknown* | settings | language/timezone settings | READ_COMPLETELY |
| `apps/backend/src/modules/context-engine/**` (7 identified files) | TypeScript | unknown* | context-engine | context fusion/priority | READ_COMPLETELY |
| `apps/backend/src/modules/device-intelligence/**` (6 identified files) | TypeScript | unknown* | device-intelligence | device data bridge | READ_COMPLETELY |
| `apps/backend/src/modules/user-intelligence/**` (6 identified files) | TypeScript | unknown* | user-intelligence | behavior learning/insights | READ_COMPLETELY |

## Baseline non-source files actually read

| Path | Status | Purpose |
|---|---|---|
| `package.json` | READ_COMPLETELY | root manifest |
| `apps/backend/package.json` | READ_COMPLETELY | backend commands/dependencies |
| `apps/mobile/package.json` | READ_COMPLETELY | mobile commands/dependencies |
| `apps/backend/src/app.module.ts` | READ_COMPLETELY | backend module wiring |

\* Exact line counts are intentionally unknown until a local filesystem inventory is available; no fabricated counts are used.

No source scope outside these paths is marked complete.
