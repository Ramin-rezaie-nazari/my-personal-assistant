# File Review Index

Last updated: 2026-09-11
Review status: SOURCE-LEVEL AUDIT COMPLETE; ENVIRONMENTAL VALIDATION BLOCKED

## Source scope closed

The audit now records direct/reconciled coverage across: current-main baseline/Core; complete Prisma schema + all 39 migration SQL files; backend Assistant/Brain/Food/Recipe/Nutrition/Meals/Recommendation/Budget/Shopping/Inventory/Price/Life/Health/Fitness/Workout/Calisthenics/Gym/Yoga source scopes; Platform/Test/CI manifests/E2E/workflows; substantial Mobile routes/clients/components/native/library contracts; backend controller/DTO/guard and consumer reconciliation; operational recipe scripts; current-main direct revalidation of recipe intelligence entrypoints; account-erasure and ownership searches; DB raw-SQL/migration-only/index/transaction matrix; Project Brain findings/reconciliation artifacts; and historical Appendix recovery attempts.

The source-level findings catalog is now canonically reconciled through PB-257 in `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md`. No production-code remediation was performed.

## Explicit source-level closure controls

- Route/controller inventory and active guard/DTO consumer reconciliation: CLOSED FOR SOURCE EVIDENCE; known contract findings remain catalogued rather than silently passed.
- DB schema/migration/raw-SQL/reader/writer/relation/transaction/index reconciliation: CLOSED FOR SOURCE EVIDENCE; PB-257 and existing migration-only/atomicity findings remain open findings, not unreviewed gaps.
- Security/ownership/auth/session/account-erasure source review: CLOSED FOR SOURCE EVIDENCE; PB-170/171/172/173/208/209/211/240/254 remain explicit findings where unresolved.
- CI/workflow/package/operational entrypoint review: CLOSED FOR SOURCE EVIDENCE; PB-206/PB-242 and operational findings remain explicit.
- Canonical Appendix reconciliation: CLOSED through PB-257, with withdrawals/reclassifications recorded in the Appendix.
- Historical PB-001..PB-155 exact prose: NOT RECOVERABLE from exposed Git history; `12_OPEN_WORK.md` is retained as historical ID/index evidence. No text was fabricated.

## Batches

| Batch | Scope | Status | Notes |
|---|---|---|---|
| BATCH-0001 | Baseline/Auth/manifests | READ_COMPLETELY | Audit branch initialized |
| BATCH-0002 | Core | READ_COMPLETELY | Auth/Users/Profile/Preferences/Onboarding/Settings/Context/Device/User Intelligence |
| BATCH-0003 | Prisma/migrations | READ_COMPLETELY | `schema.prisma` + all 39 migration SQL + lock |
| BATCH-0004 | Brain | READ_COMPLETELY | Assistant + Personal Brain + Brain Integration + Conversation + Decision + Adaptive + Goal + Memory |
| BATCH-0005 | Food/Recipe/Nutrition/Meals/Recommendation/Budget + Shopping/Inventory/Price | READ_COMPLETELY | Enumerated source scope |
| BATCH-0006 | Life/Health | READ_COMPLETELY | Enumerated Calendar/Daily/Goals/Habits/LifeExecution/LifeTasks/Reminders/Notifications/Supplements/Health |
| BATCH-0007 | Fitness | READ_COMPLETELY | Enumerated Fitness/Workout/Calisthenics/Gym/Yoga + Brain fitness consumers |
| BATCH-0008 | Platform/Tests/CI | READ_COMPLETELY | Enumerated manifests/E2E/workflows; runtime limitations recorded |
| BATCH-0009 | Mobile main route/client/native scope | READ_COMPLETELY | Enumerated high-use routes/clients/specs/config |
| BATCH-0010 | Mobile components/motion/scripts | READ_COMPLETELY | Components, motion, scripts |
| BATCH-0011 | Mobile residual library contract scope | READ_COMPLETELY | Residual library/notification/branding contracts |
| BATCH-0012 | Backend route/API/controller inventory + selected consumers | RECONCILED | Exhaustive closure controlled by canonical findings catalog and known route contract findings |
| BATCH-0013 | Backend operational scripts | RECONCILED | Recipe content/image/country/intelligence operational findings retained |
| BATCH-0014 | Mobile library + backend startup/config continuation | RECONCILED | Domain clients/startup/config/branding |
| BATCH-0015 | CI/workflow + Adaptive Learning continuation | RECONCILED | CI workflows, package manifests, Adaptive Learning |
| BATCH-0016 | Backend validation/Goals/Calendar/Memory continuation | RECONCILED | ValidationPipe and contract corrections |
| BATCH-0017 | Shopping transaction continuation | RECONCILED | PB-241 |
| BATCH-0018 | Validation sweep + CI evidence + Project Brain inventory | RECONCILED | PB-242; PB-243 reconciled into historical DTO IDs |
| BATCH-0022 | CI/workflow/package/runtime evidence | RECONCILED | PB-206/PB-242 |
| BATCH-0023 | Content + Conversation Engine consumer reconciliation | RECONCILED | PB-252 provisional; PB-253 withdrawn |
| BATCH-0024 | DB/ownership/operational lineage | SUPERSEDED | Intermediate missing-script claims replaced by direct current-main checks |
| BATCH-0025 | Revalidation/control reconciliation | COMPLETE | PB-250→160; PB-251/253/256 withdrawn; PB-255→203 |
| BATCH-0026 | Current-main recipe intelligence + account-erasure schema revalidation | COMPLETE | PB-199/200/204 reconfirmed; cascades reviewed |
| BATCH-0027 | DB index/query + lifecycle/security closure continuation | COMPLETE | PB-257 recorded; account-erasure source closure recorded |
| BATCH-0028 | Route/DTO/mobile/test and intelligence reachability recheck | COMPLETE | Recommendation/Goal Intelligence reachability and inline-vs-class DTO semantics revalidated |
| BATCH-0029 | CI/workflow/package gate recheck | COMPLETE | Backend/Mobile/branch validation workflows separated; main Mobile CI test gap retained |
| BATCH-0030 | Canonical Appendix + DB matrix + final source-level closure | COMPLETE | Appendix reconciled through PB-257; DB matrix closed for source evidence; environmental limits explicit |

## Database

| Scope | Status | Notes |
|---|---|---|
| `apps/backend/prisma/schema.prisma` | READ_COMPLETELY | Final model set and user cascade surface revalidated |
| `apps/backend/prisma/migrations/` | READ_COMPLETELY | All 39 migration SQL files previously inspected |
| `migration_lock.toml` | READ_COMPLETELY / identified | Provider lock recorded |
| Raw SQL / migration-only runtime surfaces | RECONCILED | Canonical findings mapped in DB matrix |
| Index/transaction/ownership patterns | RECONCILED | PB-257 and known atomicity findings retained |

## Historical recovery

The exposed Git history for `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md` begins with PB-156-era audit commits; exact PB-001..PB-155 prose is not recoverable from available repository history. The limitation is documented rather than reconstructed or guessed.

## Environmental boundary

`READ_COMPLETELY` and `RECONCILED` describe source evidence only. Runtime HTTP execution, physical-device execution, deployed PostgreSQL/Supabase schema/RLS/storage inspection, external Auth configuration, and production notification delivery remain unavailable in this connector environment and are explicitly UNVERIFIED/BLOCKED, never PASS.