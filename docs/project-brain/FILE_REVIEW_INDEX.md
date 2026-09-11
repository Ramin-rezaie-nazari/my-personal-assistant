# File Review Index

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: current-main baseline/Core; complete Prisma schema + all 39 migration SQL files; complete Assistant TypeScript source/test scope; complete enumerated Brain file-level scope; complete Food/Recipe/Nutrition/Meals/Recommendation/Budget file-level scope; relevant recipe nutrition script; complete enumerated Shopping/Inventory/Shopping Intelligence and substantial Price Intelligence; complete enumerated Life/Health; complete enumerated Fitness/Workout/Calisthenics/Gym/Yoga and related Personal Brain consumers; Platform/Test/CI enumerated manifests/E2E/workflows; substantial Mobile routes/clients/components; remaining identified Mobile library contracts and scripts.
Scope not yet read: any Mobile source outside current `app/`, `lib/`, `components/`, `scripts/` snapshots if present; exhaustive platform/common/test inventory; repository-wide route/consumer/DB transaction map; runtime validation; full security/privacy; historical docs/branches.
Evidence roots: target `main` commit `e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b`; audit branch `audit/project-brain-2026-09-11`; `apps/backend/src/modules/`; `apps/backend/prisma/`; `apps/backend/scripts/`; `apps/mobile/`; `.github/workflows/`.
Confidence level: HIGH for closed file-read scopes; MEDIUM for cross-module semantics; LOW for whole-repository completion.
Open questions: exact repo-wide source/line inventory; native/generated-media boundaries; live DB drift; route/mobile/database consumers; runtime tests/build/device validation; historical reconciliation.

## Closed / explicitly read batches

| Batch | Scope | Status | Notes |
|---|---|---|---|
| BATCH-0001 | Baseline/Auth/manifests | READ_COMPLETELY | Audit branch initialized |
| BATCH-0002 | Core | READ_COMPLETELY | Auth/Users/Profile/Preferences/Onboarding/Settings/Context/Device/User Intelligence |
| BATCH-0003 | Prisma/migrations | READ_COMPLETELY | `schema.prisma` + all 39 migration SQL + lock |
| BATCH-0004 | Brain | READ_COMPLETELY | Assistant + Personal Brain + Brain Integration + Conversation + Decision + Adaptive + Goal + Memory |
| BATCH-0005 | Food/Recipe/Nutrition/Meals/Recommendation/Budget + Shopping/Inventory/Price | READ_COMPLETELY | Enumerated source scope; runtime/schema consumer reconciliation pending |
| BATCH-0006 | Life/Health | READ_COMPLETELY | Enumerated Calendar/Daily/Goals/Habits/LifeExecution/LifeTasks/Reminders/Notifications/Supplements/Health |
| BATCH-0007 | Fitness | READ_COMPLETELY | Enumerated Fitness/Workout/Calisthenics/Gym/Yoga + Brain fitness consumers |
| BATCH-0008 | Platform/Tests/CI | READ_COMPLETELY | Enumerated manifests/E2E/workflows; no runtime execution claim |
| BATCH-0009 | Mobile main route/client/native scope | READ_COMPLETELY | Enumerated high-use routes/clients/specs/config |
| BATCH-0010 | Mobile components/motion/scripts | READ_COMPLETELY | All 7 components, `lib/motion.tsx`, 2 scripts read; findings PB-183..185 |
| BATCH-0011 | Mobile residual library contract scope | READ_COMPLETELY | `design-system.ts`, `motion-components.tsx`, `branding.ts`, `branding.spec.ts`, notification contract/spec read; active consumers checked where relevant |

## BATCH-0011 exact files

- `apps/mobile/lib/design-system.ts`
- `apps/mobile/lib/motion-components.tsx`
- `apps/mobile/lib/branding.ts`
- `apps/mobile/lib/branding.spec.ts`
- `apps/mobile/lib/notifications/notification-contract.ts`
- `apps/mobile/lib/notifications/notification-contract.spec.ts`

## Mobile inventory notes

- `apps/mobile/components/` contains exactly seven source files in the inspected Git tree; all seven were read in BATCH-0010.
- `apps/mobile/scripts/` contains exactly two current `.cjs` files in the inspected Git tree; both were read in BATCH-0010.
- `apps/mobile/app/` top-level tree snapshot is not truncated and was enumerated; BATCH-0009 read the listed routes, with nested `meal/[id].tsx` accounted for.
- `apps/mobile/lib/` tree snapshot is not truncated; BATCH-0011 closed the remaining identified root/notification contract files after the prior client/runtime reads.
- Assets under `apps/mobile/assets/` are treated as imported/generated media rather than ordinary source code, but relevant branding documentation/assets remain part of cross-contract review.

## Database

| Scope | Status | Notes |
|---|---|---|
| `apps/backend/prisma/schema.prisma` | READ_COMPLETELY | 32 final Prisma models |
| `apps/backend/prisma/migrations/` | READ_COMPLETELY | All 39 migration SQL files |
| `migration_lock.toml` | READ_COMPLETELY / identified | Provider lock recorded |

Known runtime migration/schema anomalies remain open. Repository-wide exact source line counts are not claimed because no local clone/runtime filesystem is available in this session.

## Important caveat

`READ_COMPLETELY` means every file explicitly enumerated for the closed batch was actually read. It does not mean the whole repository has been read. Any file not in a closed batch remains unreviewed unless separately recorded elsewhere.
