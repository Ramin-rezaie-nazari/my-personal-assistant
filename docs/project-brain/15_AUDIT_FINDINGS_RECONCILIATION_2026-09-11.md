# Audit Findings Reconciliation — 2026-09-11

This is an audit-control reconciliation note for the ongoing Master Prompt audit. It does not replace `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md` or the continuation file.

## PB-250 reconciliation

`PB-250` from the continuation is **not a new canonical finding**. It is a second manifestation of the same defective `LifeTasksService.update()` `completedAt` ternary already recorded as **PB-160** in the canonical Appendix.

Current main (`e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b`) computes:

`status === 'completed' ? new Date() : status === 'completed' ? task.completedAt : null`

with `status = dto.status ?? task.status`.

This produces two observable defects from the same code:
- a completed task edited without a status change gets a fresh completion timestamp (PB-160); and
- a completed task changed to any non-completed status clears `completedAt` instead of preserving/transitioning it deliberately (the former PB-250 observation).

Therefore PB-250 must be **merged into PB-160's evidence/impact**, not retained as a separate ID.

## PB-199 reconciliation

`PB-199` requires **withdrawal/reclassification before canonical freeze** as a current-main runtime finding. Its evidence describes a producer/consumer normalization mismatch between `recipe-ingest.mjs` and `recipe-recommendation-score.mjs`. Current main still contains the producer and writes fractional `quality_score` values, but the referenced `recipe-recommendation-score.mjs` executable is absent from current main; the executable exists on `agent/mypa-autonomous-control-plane`. Therefore the scorer-side normalization defect is not currently executable from the audited main tree. The current-main package/source contract defect is already captured by **PB-256**. The normalization observation should be retained as lineage evidence attached to PB-256 or a future remediation note, not retained as a separate active PB-199 finding unless the scorer is restored to main and the defect is re-verified there.

## PB-251 reconciliation status

PB-251 remains **provisional and distinct from PB-250**. The package entry `recipe-images:retry-quality` points to an executable absent from current main, while the same path exists on `agent/mypa-autonomous-control-plane`. This establishes a branch-lineage discrepancy but not the intent of the merge state. Keep distinct from PB-196 (bounded reprocess restartability) and reconcile whether the package entry is stale or the source was accidentally omitted before final freeze.

## PB-252/PB-253 reconciliation status

- **PB-252** remains provisional: `ContentModule` is imported by `AppModule` and therefore runtime-mounted, but `ContentRecommendationService` has no observed active consumer. This is narrower than an orphan-module finding. It should be withdrawn if the service is intentionally a reusable provider with no expected current consumer.
- **PB-253 is WITHDRAWN.** The earlier observation that `ConversationStyleService` had no consumer was false. `ResponsePlanningService` imports/injects `ConversationStyleService`; therefore there is an active consumer and no orphan-service finding is warranted.

## PB-254 account-erasure status

PB-254 remains provisional: resource-level deletes and session deletion primitives exist, but no composed canonical account-erasure workflow was located that demonstrably coordinates canonical User data, Supabase Auth identity, storage/user-owned data, session state, and migration-only/user-sensitive persistence. This is a closure item requiring the final retention/deletion matrix, not a claim that every resource lacks deletion.

## PB-255/PB-256 operational lineage status

- **PB-255** remains provisional: current-main `recipe-images-local-guaranteed-v8.mjs` invokes v7/strict-v3/status helpers absent from current main. All three helper files exist on `agent/mypa-autonomous-control-plane`, so the evidence is a branch-lineage discrepancy. Intentional retirement versus incomplete merge remains unresolved.
- **PB-256** remains provisional: current-main package scripts reference `recipe-nutrition-estimate.mjs` and `recipe-recommendation-score.mjs`, both absent from current main. The nutrition and score scripts are present on `agent/mypa-autonomous-control-plane`, again establishing lineage discrepancy rather than invalid filenames. Intentional merge/deprecation status remains unresolved.

These are distinct from PB-206 (workflow invokes missing package scripts) and PB-251 (different retry-quality package target).

## BATCH-0022 — CI/workflow/package/runtime-evidence continuation

Scope checked:
- current `apps/backend/package.json` against backend workflow commands;
- current `apps/mobile/package.json` against mobile workflow commands;
- `mypa-branch-validation.yml`, `mobile-ci.yml`, `android-build.yml`, `recipe-content-release.yml`, and recipe-image workflow command surfaces;
- actual GitHub Actions run `34613481370` on main commit `e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b`;
- workflow job and job-log evidence for the failed recipe-image run;
- current mobile route entry aliases (`index.tsx` -> `command-center.tsx` -> `command-center-v2.tsx`);
- mobile package dependency/import surfaces for voice/TTS, confirming those are already covered by existing PB-180/PB-181/PB-185 rather than creating duplicates.

Evidence result:
- Backend workflow commands are compatible with the backend package scripts when executed under the workflow's `apps/backend` working directory.
- Mobile workflow commands are compatible with the mobile package's existing `typecheck` script; the absence of a mobile test runner/CI test command remains PB-246.
- `recipe-content-release.yml` still invokes the missing `recipe:content:import` and `recipe:content:audit` commands; this reconfirms PB-206 and is not a duplicate.
- Run `34613481370` is a real runtime CI failure on the audited main commit. The `Install dependencies` step failed before the import step because `pnpm-lock.yaml` is stale relative to `apps/backend/package.json`. The log explicitly reports one added dependency (`sharp@^0.34.2`), three removed dependencies, and six mismatched dependency specifiers. This is the runtime evidence for PB-242.
- No additional unique CI finding was created from this pass.

## BATCH-0024 — Operational script lineage closure continuation

Scope checked:
- current-main backend package script targets;
- exact current-main presence/absence of package-referenced recipe intelligence and recipe-image executables;
- corresponding files on `agent/mypa-autonomous-control-plane` for lineage reconciliation;
- v8 local image pipeline internal helper dependencies;
- recipe recommendation scoring implementation and its current branch-only state;
- retry-quality implementation and its current branch-only state.

Evidence result:
- `apps/backend/package.json` currently advertises executable targets that are absent from main for retry-quality, nutrition estimation, and recommendation scoring.
- The missing nutrition/scoring files and retry-quality file exist on the autonomous-control-plane branch, so these findings are not safely classifiable as simple filename typos.
- v8's missing v7/strict-v3/status helpers likewise exist on the autonomous-control-plane branch.
- `PB-199` is therefore not treated as an independently active current-main scorer defect; its scorer-side normalization observation is retained as lineage evidence under PB-256 pending restoration/reverification.
- No new finding was created solely from the branch discrepancy; the existing provisional IDs remain the minimal distinct set.

## BATCH-0025 — Raw-SQL / ownership / delete-surface revalidation

Scope checked:
- active `$queryRaw` consumers in Goals, LifeTasks, LifeExecution, Recipe Presentation, Personal Brain, Assistant conversation history, Price Intelligence, and Fitness operational scripts;
- destructive controller/service surfaces across Inventory, Goals, Habits, Fitness/Workout, Calendar, Reminders, Supplements, and Memory;
- user-scoping patterns on active delete paths.

Evidence result:
- Existing migration-only/raw-SQL findings remain the correct canonical surface; no duplicate finding was created merely because another service uses `$queryRaw`.
- Active delete paths inspected in this batch generally scope resource lookup by both resource ID and authenticated user ID before deletion; no new IDOR finding was established by this sweep.
- Account erasure remains a separate composed-workflow closure item under PB-254.

## Historical PB-001..PB-155 recovery — repository-history closure

A direct Git-history query for `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md` on the audit branch returns only the 2026-09-11 Appendix lineage beginning with commits that recorded PB-156 onward; the older PB-001..PB-155 findings are not present in the historical path of the Appendix itself. A query against the default/main branch for the same path returns no history because the Project Brain audit Appendix is audit-branch documentation rather than a main-branch historical file.

This means exact-text recovery of PB-001..PB-155 from the canonical Appendix file is **not possible from the repository history exposed by GitHub**. The audit therefore must not fabricate or reconstruct those findings. Their IDs and known duplicate mappings remain represented through `12_OPEN_WORK.md` and the reconciliation notes, while the exact original prose remains an explicitly documented historical-source limitation. If an external archived Project Brain copy is later supplied, it can be reconciled then; until that happens, this is considered a closed *evidence limitation*, not an unreported unknown.

## Audit status / external-validation boundary

No production code changed in these audit batches. The remaining validation boundary is explicitly environmental rather than an uninvestigated source gap: local backend/mobile execution, physical-device behavior, deployed database/RLS/schema drift, external Supabase/Auth configuration, and any production storage state cannot be truthfully verified from the repository alone. These limitations must be stated in the final audit report rather than converted into unsupported “PASS” claims.

The remaining source-level closure work is therefore: canonical Appendix merge/reconciliation, final DB/route/security matrices, intentional-library/orphan decisions for PB-252 and operational lineage decisions for PB-251/PB-255/PB-256, account-erasure inventory closure, checkpoint/index synchronization, and a final duplicate-free findings freeze.