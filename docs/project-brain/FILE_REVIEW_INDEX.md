# File Review Index

Last updated: 2026-09-11
Review status: IN_PROGRESS

## Scope actually read
Current-main baseline/Core; complete Prisma schema + all 39 migration SQL files; complete Assistant TypeScript source/test scope; complete enumerated Brain file-level scope; complete Food/Recipe/Nutrition/Meals/Recommendation/Budget file-level scope; relevant recipe nutrition/scoring scripts; complete enumerated Shopping/Inventory/Shopping Intelligence and substantial Price Intelligence; complete enumerated Life/Health; complete enumerated Fitness/Workout/Calisthenics/Gym/Yoga and related Personal Brain consumers; Platform/Test/CI enumerated manifests/E2E/workflows; substantial Mobile routes/clients/components; remaining identified Mobile library contracts/scripts; BATCH-0012 backend controller inventory and selected mobile consumer reconciliation; BATCH-0013 operational recipe scripts; BATCH-0018 active DTO validation sweep, Project Brain inventory and CI run evidence; BATCH-0022 CI/package/workflow runtime-evidence continuation; BATCH-0023 Content + Conversation Engine consumer reconciliation; BATCH-0026 direct current-main recipe-intelligence/operational-script revalidation and Prisma User cascade/account-erasure schema review; historical Git-history lookup for the Audit Findings Appendix path.

## Scope not yet fully closed
Exhaustive repository-wide route↔DTO↔test↔mobile mapping; exhaustive backend operational-script closure; exhaustive database reader/writer/relation/index/transaction map; remaining common/platform/test/legacy source closure; runtime/device execution; complete security/privacy/retention/deletion reconciliation; canonical Appendix final merge/freeze.

Evidence roots: target `main` commit `e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b`; audit branch `audit/project-brain-2026-09-11`; `apps/backend/src/modules/`; `apps/backend/prisma/`; `apps/backend/scripts/`; `apps/mobile/`; `.github/workflows/`; `docs/project-brain/`.
Confidence level: HIGH for closed file-read/direct-revalidation scopes; MEDIUM for cross-module semantics; LOW for whole-repository completion until remaining gates close.

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
| BATCH-0011 | Mobile residual library contract scope | READ_COMPLETELY | Identified residual library/notification/branding contracts |
| BATCH-0012 | Backend route/API/controller inventory + selected consumers | IN_PROGRESS | Controller/path/guard inventory largely read; exhaustive DTO/test/mobile mapping remains open. |
| BATCH-0013 | Backend operational scripts | IN_PROGRESS | Recipe content/image/country and related operational surfaces; PB-188..PB-220. |
| BATCH-0014 | Mobile library + backend startup/config continuation | IN_PROGRESS | Domain clients, startup/config, branding, operational script continuation. |
| BATCH-0015 | CI/workflow + Adaptive Learning continuation | IN_PROGRESS | CI workflows, package manifests, Adaptive Learning services; PB-221/222/223. |
| BATCH-0016 | Backend validation/Goals/Calendar/Memory continuation | IN_PROGRESS | ValidationPipe, active write DTOs, Goals/Calendar/Memory, Yoga/notifications; PB-231..235 with later semantic corrections. |
| BATCH-0017 | Shopping transaction continuation | IN_PROGRESS | Shopping `addRecipeMissing()` and Recipe Food Operating Loop consumer; PB-241. |
| BATCH-0018 | Validation sweep + CI evidence + Project Brain inventory | IN_PROGRESS | Active Habits/Workout/Supplements/LifeExecution DTOs; CI run evidence; PB-242 and provisional PB-243. |
| BATCH-0022 | CI/workflow/package/runtime evidence | IN_PROGRESS | Current package/workflow cross-check; real Actions failure evidence; PB-206/PB-242 reconfirmed. |
| BATCH-0023 | Content + Conversation Engine consumer reconciliation | IN_PROGRESS | Content recommendation consumer gap; ConversationStyleService later verified as consumed, withdrawing PB-253. |
| BATCH-0024 | DB/ownership/operational lineage | SUPERSEDED | Intermediate missing-script claims superseded by direct current-main checks. |
| BATCH-0025 | Revalidation/control reconciliation | COMPLETE | PB-250→PB-160; PB-251 withdrawal; PB-255→PB-203; PB-256 withdrawal; PB-253 withdrawal; PB-252/PB-254 provisional decisions. |
| BATCH-0026 | Current-main recipe intelligence + account-erasure schema revalidation | COMPLETE | PB-199/PB-200/PB-204 reconfirmed; withdrawn script findings revalidated; User cascade surface inspected. |

## Database

| Scope | Status | Notes |
|---|---|---|
| `apps/backend/prisma/schema.prisma` | READ_COMPLETELY | Current final Prisma model set inspected; User cascade relations directly revalidated. |
| `apps/backend/prisma/migrations/` | READ_COMPLETELY | All 39 migration SQL files previously inspected. |
| `migration_lock.toml` | READ_COMPLETELY / identified | Provider lock recorded. |

Known migration-only/raw-SQL contracts remain open findings. The final Prisma `User` model has broad modeled-record cascades, but this does not prove complete account erasure across migration-only tables, Supabase Auth, or Storage.

## Historical recovery

The exposed Git history for `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md` begins with PB-156-era audit commits; exact PB-001..PB-155 prose is not recoverable from the repository history available to this audit. The limitation is documented rather than reconstructed or guessed.

## Important caveat

`READ_COMPLETELY` means every file explicitly enumerated for that closed batch was actually read. It does not mean the whole repository has been read. Any file outside a closed/explicitly recorded scope remains unreviewed until directly inspected or explicitly reconciled.
