# MYPA Agent Contract

This repository is operated with an autonomous engineering workflow.

## Source of truth

Use the real repository state as technical truth.
The primary progress document is:

`apps/backend/docs/05_CURRENT_STATE.md`

Supporting engineering memory and architecture:

- `apps/backend/docs/03_PROJECT_BRAIN_BOOK.md`
- `apps/backend/docs/04_ARCHITECTURE_ATLAS.md`
- `apps/backend/docs/02_ROADMAP.md`

## Execution rules

1. Read the current-state and architecture documents before starting work.
2. Verify documentation against code before trusting it.
3. Prefer the smallest correct change.
4. Do not rewrite green functionality without evidence.
5. For architecture, database, security, migration, native, synchronization, or provider changes: perform a two-pass review before implementation.
6. Follow Implement → Test → Fix → Retest → Review → Harden → Document.
7. Never weaken or delete tests to make a change green.
8. Never claim a test, build, security review, load test, or release gate passed unless it actually ran and passed.
9. Keep going through the next logical unchecked work item unless a real blocker requires human action.
10. Update `apps/backend/docs/05_CURRENT_STATE.md` after genuine milestones.
11. Keep generated reports and logs under `agent/runs/` and never commit secrets.
12. Physical-device-only checks must be clearly reported as unverified until actually performed.
13. Distinguish architectural scalability from empirically load-tested scalability.
14. Treat native Android/iOS crashes as P0/P1 issues and investigate root causes.
15. Protect Git history and isolate autonomous work from `main` until reviewed.
