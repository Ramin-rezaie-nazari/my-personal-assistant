# Audit Findings Reconciliation — 2026-09-11

This is an audit-control reconciliation note for the ongoing Master Prompt audit. It does not replace `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md` or the continuation file.

## PB-250 reconciliation

`PB-250` is **not a new canonical finding**. It is a second manifestation of the same defective `LifeTasksService.update()` `completedAt` ternary already recorded as **PB-160**. Merge its impact/evidence into PB-160 and do not retain PB-250.

## PB-199/PB-200/PB-204 current-main verification

Direct file-level recheck against audited main commit `e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b` confirms that `recipe-recommendation-score.mjs` and `recipe-nutrition-estimate.mjs` **do exist** on current main. PB-199 remains active because the scorer divides a positive stored `quality_score` by 100 even though the ingest producer stores a bounded fractional score. PB-204 remains active because `globalCultureFit()` expects `iso2`/`country`/`region` fields that are not selected by its `recipe_country_relations` query. PB-200 remains active because the nutrition estimator relies on hard-coded nutrient constants and unit conversions without an explicit persisted provenance/source contract. None of these findings is a missing-file finding.

## PB-251 — WITHDRAWN

Direct current-main lookup confirms `apps/backend/scripts/recipe-image-reprocess-retry.mjs` exists at the package-declared path. PB-251 was caused by stale/incomplete repository-search evidence and is withdrawn. PB-196 remains the separate restartability finding.

## PB-255 — WITHDRAWN / MERGED INTO PB-203

Direct current-main lookup confirms `recipe-images-local-guaranteed-v7.mjs` exists. The v8 orchestrator still references missing `recipe-images-local-strict-v3.mjs`, `recipe-images-local-gallery-upgrade-v1.mjs`, and `recipe-images-local-status.mjs`; those missing dependencies are already covered by canonical **PB-203**. PB-255 adds no distinct defect and is withdrawn.

## PB-252/PB-253 reconciliation

- **PB-252** remains provisional: `ContentModule` is runtime-mounted, but `ContentRecommendationService` has no observed active consumer. Final architecture review must decide whether this is intentional dormant infrastructure or stale source.
- **PB-253 is WITHDRAWN.** `ResponsePlanningService` actively imports/injects `ConversationStyleService`; the earlier no-consumer observation was false.

## PB-254 account-erasure status

PB-254 remains provisional: resource-level deletes and session deletion primitives exist, but no composed canonical account-erasure workflow was located that demonstrably coordinates canonical User data, Supabase Auth identity, storage/user-owned data, session state, and migration-only/user-sensitive persistence. The current Prisma `User` model does have broad `onDelete: Cascade` relations across its modeled user-owned records, but migration-only tables and external Auth/storage are outside that cascade graph. Final closure requires the complete retention/deletion inventory and workflow decision.

## PB-256 — WITHDRAWN

Direct current-main lookup confirms both `recipe-nutrition-estimate.mjs` and `recipe-recommendation-score.mjs` exist at the package-declared paths. PB-256 was caused by stale/incomplete repository-search evidence and is withdrawn. Existing logic findings concerning those scripts remain independently evaluated.

## BATCH-0024/0025/0026 — revalidation outcome

The operational lineage, raw-SQL/ownership sweep, and current-main direct-file revalidation were repeated. The revalidation removes PB-251 and PB-256 as false positives and withdraws/merges PB-255 into PB-203. It also reconfirms PB-199/PB-200/PB-204 as active logic/provenance findings. This is audit correction, not remediation.

## Historical PB-001..PB-155 recovery — repository-history closure

A direct Git-history query for `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md` on the audit branch returns only the 2026-09-11 Appendix lineage beginning with PB-156; exact historical PB-001..PB-155 prose is not recoverable from the exposed repository history. The audit must not fabricate those findings. `12_OPEN_WORK.md` preserves the historical ID/index and overlap map, but that is not equivalent to exact-text recovery.

## Audit status / external-validation boundary

No production code changed. Runtime/device behavior, deployed Supabase RLS/storage, production DB schema drift, external Auth configuration, and production notification delivery remain environmental validation boundaries and must not be falsely marked PASS.

Remaining source-level closure: canonical Appendix reconciliation, complete route↔DTO↔test↔mobile and DB reader/writer/relation/index/transaction matrices, PB-252 decision, PB-254 account-erasure inventory closure, checkpoint/index synchronization, final duplicate-free findings freeze, and explicit environmental validation limitations.
