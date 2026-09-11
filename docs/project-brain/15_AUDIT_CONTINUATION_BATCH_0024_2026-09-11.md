# Audit Continuation Batch 0024 — 2026-09-11

Status: IN_PROGRESS — forensic audit only; no production-code remediation.

## Scope

1. Raw SQL surface re-scan across active backend services and operational scripts.
2. Destructive/ownership surface re-scan.
3. Operational script internal dependency review.
4. Evidence reconciliation for account lifecycle and runtime limitations.

## Results

### Raw SQL

The current-main raw SQL surface remains concentrated in already-known/high-risk domains: Goals, LifeTasks, LifeExecution, Recipe Presentation, Personal Brain, Price Intelligence, Assistant conversation history, and Fitness operational scripts. The search produced no new canonical finding solely from the use of `$queryRaw`; each active surface must be evaluated against schema/migration contracts, user scoping, indexes, and transaction boundaries. Existing findings remain the canonical IDs for known defects. Goal and LifeTask raw SQL have active service tests; this does not prove deployed-schema compatibility.

### Destructive and ownership paths

The repository-wide destructive-controller sweep found active deletes in Inventory, Goals, Habits, Fitness equipment, Workout, Calendar, Reminders, Supplements, Memory Intelligence and other domain surfaces. Representative service implementations first scope by authenticated `userId` and then delete by primary key. This supports the existing conclusion that no additional generic IDOR finding should be created from these paths. Fitness remains exceptional because the controller currently reads `req.user.sub`, already covered by the existing identity-shape finding.

### Operational-script dependency graph

The recipe-image pipeline has multiple package-to-script and script-to-script contract gaps already staged as PB-251, PB-255 and PB-256. The v8 local pipeline invokes v7, strict-v3 and local-status scripts that are absent from audited main; v7 and strict-v3 are present on the historical autonomous-control-plane branch, establishing lineage but not proving intended current support. Package scripts also reference nutrition/score executables absent from main while historical branch content contains at least the nutrition estimator. These are kept distinct until final reconciliation.

### Account lifecycle

No current-main composed account-erasure workflow was located. Existing user-scoped deletion primitives and Prisma cascades are not treated as proof of complete account erasure. Closure requires reconciliation of User rows, migration-only/user-owned tables, sessions, storage objects, and externally managed authentication state. This remains PB-254 / audit closure, not a remediation task.

### Runtime evidence boundary

Repository inspection can establish static contracts and CI evidence, but cannot prove real-device behavior, deployed Supabase RLS/storage policy, production database schema state, or production notification delivery without those environments. These must be recorded as explicit limitations at final freeze rather than marked PASS.

## Freeze gate status

Still OPEN. Canonical Appendix has not yet been safely frozen. Reading Checkpoints/File Review Index and Appendix still require final reconciliation after all remaining audit batches. No claim of 100% completion is made by this batch.
