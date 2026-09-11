# Audit Findings Reconciliation — 2026-09-11

This is an audit-control reconciliation note for the ongoing Master Prompt audit. It does not replace `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md` or the continuation file.

## PB-250 reconciliation

`PB-250` is **not a new canonical finding**. It is a second manifestation of the same defective `LifeTasksService.update()` `completedAt` ternary already recorded as **PB-160**. Merge its impact/evidence into PB-160 and do not retain PB-250.

## PB-199/PB-200/PB-204 current-main verification

A direct file-level recheck against audited main commit `e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b` confirms that `recipe-recommendation-score.mjs` and `recipe-nutrition-estimate.mjs` **do exist** on current main. Therefore earlier missing-file reasoning must not be used to withdraw PB-199 or PB-200. Their logic/provenance findings remain independently auditable. PB-204 likewise remains a logic/data-contract finding and must not be merged into a missing-file finding.

## PB-251 — WITHDRAWN

Direct current-main lookup confirms `apps/backend/scripts/recipe-image-reprocess-retry.mjs` exists at the package-declared path. PB-251 was caused by stale/incomplete repository-search evidence and is withdrawn. PB-196 remains the separate restartability finding.

## PB-255 — WITHDRAWN / MERGED INTO PB-203

Direct current-main lookup confirms `recipe-images-local-guaranteed-v7.mjs` exists. The v8 orchestrator does still reference missing `recipe-images-local-strict-v3.mjs`, `recipe-images-local-gallery-upgrade-v1.mjs`, and `recipe-images-local-status.mjs`; those missing dependencies are already covered by canonical **PB-203**. PB-255 adds no distinct defect and is withdrawn. The earlier claim that v7 was missing was stale/incomplete search evidence.

## PB-252/PB-253 reconciliation

- **PB-252** remains provisional: `ContentModule` is runtime-mounted, but `ContentRecommendationService` has no observed active consumer. Withdraw it if final architecture review establishes that it is intentionally a reusable dormant provider.
- **PB-253 is WITHDRAWN.** `ResponsePlanningService` actively imports/injects `ConversationStyleService`; the earlier no-consumer observation was false.

## PB-254 account-erasure status

PB-254 remains provisional: resource-level deletes and session deletion primitives exist, but no composed canonical account-erasure workflow was located that demonstrably coordinates canonical User data, Supabase Auth identity, storage/user-owned data, session state, and migration-only/user-sensitive persistence. This remains a closure item requiring the final retention/deletion matrix.

## PB-256 — WITHDRAWN

Direct current-main lookup confirms both `recipe-nutrition-estimate.mjs` and `recipe-recommendation-score.mjs` exist at the package-declared paths. PB-256 was caused by stale/incomplete repository-search evidence and is withdrawn. Existing logic findings concerning those scripts must remain independently evaluated.

## BATCH-0024/0025 — revalidation outcome

The operational lineage and raw-SQL/ownership sweeps were repeated with direct file lookups for previously provisional missing-script findings. The revalidation removed PB-251 and PB-256 as false positives and merged/withdrew PB-255 into existing PB-203. This is a deliberate audit correction, not remediation.

## Historical PB-001..PB-155 recovery — repository-history closure

A direct Git-history query for `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md` on the audit branch returns only the 2026-09-11 Appendix lineage beginning with PB-156; exact historical PB-001..PB-155 prose is not recoverable from the exposed repository history. The audit must not fabricate those findings. This is a documented evidence limitation.

## Audit status / external-validation boundary

No production code changed. Runtime/device behavior, deployed Supabase RLS/storage, production DB schema drift, external Auth configuration, and production notification delivery remain environmental validation boundaries and must not be falsely marked PASS.

Remaining source-level closure: canonical Appendix reconciliation, complete DB/route/security matrices, PB-252 decision, PB-254 account-erasure inventory closure, checkpoint/index synchronization, and final duplicate-free findings freeze.