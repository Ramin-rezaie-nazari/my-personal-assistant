# File Review Index

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: Initial governance/docs/package/auth batch.
Scope not yet read: Complete repository source inventory and all requested deep-read scopes.
Evidence roots: GitHub branch `agent/mypa-autonomous-control-plane` at commit `85a575ec6716261d116cff20ddfc3b769d64df14` plus subsequent audit checkpoint commit.
Confidence level: MEDIUM for baseline, LOW for unreviewed areas.
Open questions: exact complete source-file counts and local dirty/untracked state.

| Path | Status | Batch | Evidence | Notes |
|---|---|---|---|---|
| AGENTS.md | READ_COMPLETELY | BATCH-0001 | AGENTS.md | Governance contract |
| MYPA_START_HERE.md | READ_COMPLETELY | BATCH-0001 | MYPA_START_HERE.md | Session navigator |
| apps/backend/docs/02_ROADMAP.md | READ_COMPLETELY | BATCH-0001 | apps/backend/docs/02_ROADMAP.md | Roadmap |
| apps/backend/docs/03_PROJECT_BRAIN_BOOK.md | READ_PARTIALLY | BATCH-0001 | apps/backend/docs/03_PROJECT_BRAIN_BOOK.md | Large document; full continuation required |
| apps/backend/docs/04_ARCHITECTURE_ATLAS.md | READ_PARTIALLY | BATCH-0001 | apps/backend/docs/04_ARCHITECTURE_ATLAS.md | Large document; full continuation required |
| apps/backend/docs/05_CURRENT_STATE.md | READ_COMPLETELY | BATCH-0001 | apps/backend/docs/05_CURRENT_STATE.md | Operational source of truth |
| apps/backend/docs/06_VALIDATION_LEDGER.md | READ_PARTIALLY | BATCH-0001 | apps/backend/docs/06_VALIDATION_LEDGER.md | Long ledger; continuation required |
| apps/backend/docs/08_AUTONOMOUS_PROGRESS_LOG.md | READ_PARTIALLY | BATCH-0001 | apps/backend/docs/08_AUTONOMOUS_PROGRESS_LOG.md | Long ledger; continuation required |
| package.json | READ_COMPLETELY | BATCH-0001 | package.json | Root validation commands |
| apps/backend/prisma/schema.prisma | READ_PARTIALLY | BATCH-0001 | apps/backend/prisma/schema.prisma | Large file; continuation required |
| apps/backend/src/modules/auth/auth.service.ts | READ_COMPLETELY | BATCH-0001 | source path | Auth logic |
| apps/backend/src/modules/auth/auth.service.spec.ts | READ_COMPLETELY | BATCH-0001 | source path | Refresh rotation tests |
| apps/mobile/package.json | READ_COMPLETELY | BATCH-0001 | apps/mobile/package.json | Expo/mobile stack |

No source file is marked READ_COMPLETELY unless its complete contents were actually retrieved and read.
