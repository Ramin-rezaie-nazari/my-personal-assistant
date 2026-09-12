# File Review Index

Last updated: 2026-09-12
Review status: SOURCE-LEVEL AUDIT RECONCILED; MASTER-0004 REMEDIATION CONTINUING; LATEST-HEAD CI PENDING

## Source scope closed

The audit records direct/reconciled coverage across the complete recorded backend Core, Brain, Food/Recipe/Nutrition/Meals/Recommendation/Budget, Shopping/Inventory/Price, Life/Health, Fitness/Workout/Calisthenics/Gym/Yoga, Platform/Test/CI and Mobile source scopes; Prisma schema/migration reconciliation; route/controller/DTO/guard and consumer reconciliation; operational recipe scripts; account-erasure/ownership/index checks; DB raw-SQL/migration-only/index/transaction matrix; Project Brain findings/reconciliation artifacts; historical Appendix recovery attempts; and focused Shopping/Price semantic remediation.

The canonical findings catalog is `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md`. Master Prompt remediation is tracked by continuation batches and must be re-verified on the latest branch HEAD after material changes.

## Explicit source-level closure controls

- Route/controller/DTO/guard consumer reconciliation: CLOSED FOR SOURCE EVIDENCE.
- DB schema/migration/raw-SQL/reader/writer/relation/transaction/index reconciliation: CLOSED FOR SOURCE EVIDENCE.
- Security/ownership/auth/session/account-erasure source review: CLOSED FOR SOURCE EVIDENCE.
- CI/workflow/package/operational entrypoint review: CLOSED FOR SOURCE EVIDENCE.
- Canonical Appendix reconciliation: CLOSED through PB-274.
- Historical PB-001..PB-155 exact prose: NOT RECOVERABLE from exposed Git history; no history fabricated.

## Batches

| Batch | Scope | Status | Notes |
|---|---|---|---|
| BATCH-0001 | Baseline/Auth/manifests | READ_COMPLETELY | Historical audit batch |
| BATCH-0002 | Core | READ_COMPLETELY | Auth/Users/Profile/Preferences/Onboarding/Settings/Context/Device/User Intelligence |
| BATCH-0003 | Prisma/migrations | READ_COMPLETELY | Schema + migration SQL + lock |
| BATCH-0004 | Brain | READ_COMPLETELY | Assistant + Personal Brain + Brain Integration + Conversation + Decision + Adaptive + Goal + Memory |
| BATCH-0005 | Food/Recipe/Nutrition/Meals/Recommendation/Budget + Shopping/Inventory/Price | READ_COMPLETELY | Enumerated source scope |
| BATCH-0006 | Life/Health | READ_COMPLETELY | Calendar/Daily/Goals/Habits/LifeTasks/Reminders/Notifications/Supplements/Health |
| BATCH-0007 | Fitness | READ_COMPLETELY | Fitness/Workout/Calisthenics/Gym/Yoga + relevant Brain consumers |
| BATCH-0008 | Platform/Tests/CI | READ_COMPLETELY | Manifests/E2E/workflows |
| BATCH-0009 | Mobile main route/client/native scope | READ_COMPLETELY | Enumerated high-use routes/clients/specs/config |
| BATCH-0010 | Mobile components/motion/scripts | READ_COMPLETELY | Components, motion, scripts |
| BATCH-0011 | Mobile residual library contract scope | READ_COMPLETELY | Library/notification/branding contracts |
| BATCH-0012 | Backend route/API/controller inventory + consumers | RECONCILED | Route contract control |
| BATCH-0013 | Backend operational scripts | RECONCILED | Recipe/content/image/country/intelligence scripts |
| BATCH-0014 | Mobile library + backend startup/config | RECONCILED | Domain clients/startup/config/branding |
| BATCH-0015 | CI/workflow + Adaptive Learning | RECONCILED | Package/CI continuation |
| BATCH-0016 | Backend validation/Goals/Calendar/Memory | RECONCILED | Contract corrections/rechecks |
| BATCH-0017 | Shopping transaction continuation | RECONCILED | PB-241 |
| BATCH-0018 | Validation sweep + CI evidence + Brain inventory | RECONCILED | PB-242 and duplicate control |
| BATCH-0022 | CI/workflow/package/runtime evidence | RECONCILED | CI and package entrypoints |
| BATCH-0023 | Content + Conversation Engine consumer reconciliation | RECONCILED | Consumer/status reconciliation |
| BATCH-0024 | DB/ownership/operational lineage | SUPERSEDED | Intermediate claims replaced by direct checks |
| BATCH-0025 | Revalidation/control reconciliation | COMPLETE | Duplicate/withdrawn/merged finding control |
| BATCH-0026 | Recipe intelligence + account-erasure schema revalidation | COMPLETE | Food quality/cascade review |
| BATCH-0027 | DB index/query + lifecycle/security closure | COMPLETE | PB-257 and account-erasure checks |
| BATCH-0028 | Route/DTO/mobile/test/intelligence reachability | COMPLETE | Reachability/DTO semantics revalidated |
| BATCH-0029 | CI/workflow/package gate recheck | COMPLETE | Backend/Mobile/branch validation separation |
| BATCH-0030 | Canonical Appendix + DB matrix + source closure | COMPLETE | Historical/source closure |
| BATCH-0031 | Project Brain reconciliation after Appendix CI closure | COMPLETE | Brain/checkpoint/gaps/deep-read synchronization |
| BATCH-0032 | Inventory/Recipe → Shopping unit reconciliation | COMPLETE | PB-270; unit-safe basket merge + CI green |
| BATCH-0033 | Mobile Shopping basket transport reconciliation | COMPLETE | Residual PB-205 transport duplication + CI green |
| BATCH-0034 | Shopping completion → Inventory lifecycle | COMPLETE | PB-271; transactional purchase-to-inventory synchronization |
| BATCH-0035 | Price Intelligence durability/source/package/currency | COMPLETE | PB-061/PB-064/PB-065/PB-059 |
| BATCH-0036 | Price Intelligence canonicalization/placeholder cleanup | COMPLETE | PB-272/PB-273 |
| BATCH-0037 | Shopping Intelligence placeholder cleanup | COMPLETE FOR SOURCE/IMPLEMENTATION | PB-274; latest-head CI pending |

## Database

| Scope | Status | Notes |
|---|---|---|
| `apps/backend/prisma/schema.prisma` | READ_COMPLETELY | Final model set and ownership/cascade surface revalidated |
| `apps/backend/prisma/migrations/` | READ_COMPLETELY | Recorded migration SQL scope previously inspected |
| `migration_lock.toml` | READ_COMPLETELY / identified | Provider lock recorded |
| Raw SQL / migration-only runtime surfaces | RECONCILED | Canonical findings mapped in DB matrix |
| Index/transaction/ownership patterns | RECONCILED | Composite indexes and atomicity findings reconciled |

## Historical recovery

The exposed Git history for `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md` begins with PB-156-era audit commits; exact PB-001..PB-155 prose is not recoverable from available repository history. The limitation is documented rather than reconstructed or guessed.

## Environmental boundary

`READ_COMPLETELY` and `RECONCILED` describe source evidence only. Runtime HTTP execution, physical-device execution, deployed PostgreSQL/RLS/storage inspection, external Auth configuration, production notification delivery and external provider quotas remain unavailable in this connector environment and are explicitly UNVERIFIED/BLOCKED, never PASS.
