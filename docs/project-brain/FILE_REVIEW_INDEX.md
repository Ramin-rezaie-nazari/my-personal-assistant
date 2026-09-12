# File Review Index

Last updated: 2026-09-12
Review status: SOURCE-LEVEL AUDIT RECONCILED; MASTER-0004 REMEDIATION CONTINUING; ONE DOCUMENTATION GAP OPEN

## Source scope closed

The audit records direct/reconciled coverage across the complete recorded backend Core, Brain, Food/Recipe/Nutrition/Meals/Recommendation/Budget, Shopping/Inventory/Price, Life/Health, Fitness/Workout/Calisthenics/Gym/Yoga, Platform/Test/CI and Mobile source scopes; Prisma schema/migration reconciliation; route/controller/DTO/guard and consumer reconciliation; operational recipe scripts; account-erasure/ownership/index checks; Project Brain findings/reconciliation; historical Appendix recovery attempts; and focused Shopping/Price/Budget semantic remediation.

The canonical findings catalog is `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md`. Master Prompt remediation is tracked by continuation batches and re-verified against CI after material code changes.

## Explicit source-level closure controls

- Route/controller/DTO/guard consumer reconciliation: CLOSED FOR SOURCE EVIDENCE.
- DB schema/migration/raw-SQL/reader/writer/relation/transaction/index reconciliation: CLOSED FOR SOURCE EVIDENCE.
- Security/ownership/auth/session/account-erasure source review: CLOSED FOR SOURCE EVIDENCE.
- CI/workflow/package/operational entrypoint review: CLOSED FOR SOURCE EVIDENCE.
- Canonical Appendix reconciliation: CLOSED through PB-284.
- Historical PB-001..PB-155 exact prose: NOT RECOVERABLE from exposed Git history; no history fabricated.
- API catalog consistency: OPEN PB-284; catalog contains stale historical route/guard values and needs a source-preserving rewrite.

## Recent batches

| Batch | Scope | Status | Notes |
|---|---|---|---|
| BATCH-0001 | Baseline/Auth/manifests | READ_COMPLETELY | Historical audit batch |
| BATCH-0002 | Core | READ_COMPLETELY | Auth/Users/Profile/Preferences/Onboarding/Settings/Context/Device/User Intelligence |
| BATCH-0003 | Prisma/migrations | READ_COMPLETELY | Schema + migration SQL + lock |
| BATCH-0004 | Brain | READ_COMPLETELY | Assistant + Personal Brain + Brain Integration + Conversation + Decision + Adaptive + Goal + Memory |
| BATCH-0005 | Food/Recipe/Nutrition/Meals/Recommendation/Budget + Shopping/Inventory/Price | READ_COMPLETELY | Enumerated source scope |
| BATCH-0006 | Life/Health | READ_COMPLETELY | Calendar/Daily/Goals/Habits/LifeTasks/Reminders/Notifications/Supplements/Health |
| BATCH-0007 | Fitness | READ_COMPLETELY | Fitness/Workout/Calisthenics/Gym/Yoga |
| BATCH-0008 | Platform/Tests/CI | READ_COMPLETELY | Manifests/E2E/workflows |
| BATCH-0009 | Mobile main route/client/native scope | READ_COMPLETELY | Enumerated high-use routes/clients/specs/config |
| BATCH-0010 | Mobile components/motion/scripts | READ_COMPLETELY | Components, motion, scripts |
| BATCH-0011 | Mobile residual library contract scope | READ_COMPLETELY | Library/notification/branding |
| BATCH-0012..0031 | Route/DB/operational/CI/Project Brain reconciliation | RECONCILED | Earlier audit continuity |
| BATCH-0032 | Inventory/Recipe → Shopping unit reconciliation | COMPLETE | PB-270; CI VERIFIED |
| BATCH-0033 | Mobile Shopping basket transport reconciliation | COMPLETE | PB-205; CI VERIFIED |
| BATCH-0034 | Shopping completion → Inventory lifecycle | COMPLETE | PB-271; CI VERIFIED in later head |
| BATCH-0035 | Price Intelligence durability/source/package/currency | COMPLETE | PB-061/PB-064/PB-065/PB-059 |
| BATCH-0036 | Price canonicalization/placeholder cleanup | COMPLETE | PB-272/PB-273 |
| BATCH-0037 | Shopping Intelligence placeholder cleanup | COMPLETE | PB-274 |
| BATCH-0038 | PurchasePlan + Shopping input semantics | COMPLETE | PB-275/PB-276 |
| BATCH-0039 | Shopping DTO + Recipe request hardening | COMPLETE | PB-277/PB-278 |
| BATCH-0040 | DTO metadata test bootstrap fix | COMPLETE | PB-279 |
| BATCH-0041 | Budget meal-plan validation + placeholder retirement | COMPLETE | PB-280/PB-281 |
| BATCH-0042 | Food-loop servings + quote totals | COMPLETE | PB-282/PB-283 |
| BATCH-0043 | API catalog drift | OPEN | PB-284; documentation-only |

## Database

| Scope | Status | Notes |
|---|---|---|
| `apps/backend/prisma/schema.prisma` | READ_COMPLETELY | Model/ownership/index surface revalidated |
| `apps/backend/prisma/migrations/` | READ_COMPLETELY | Recorded migration SQL scope inspected |
| Raw SQL / migration-only runtime surfaces | RECONCILED | Canonical DB matrix |
| Index/transaction/ownership patterns | RECONCILED | Composite indexes and atomicity findings reconciled |

## Environmental boundary

`READ_COMPLETELY` and `RECONCILED` describe source evidence only. Runtime HTTP outside CI, physical-device execution, deployed PostgreSQL/RLS/storage/auth state, production notification delivery and external provider quotas remain unavailable and are explicitly UNVERIFIED/BLOCKED.
