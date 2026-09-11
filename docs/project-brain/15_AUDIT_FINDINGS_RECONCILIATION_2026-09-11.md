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

Therefore PB-250 must be **merged into PB-160's evidence/impact**, not retained as a separate ID. No new PB-251 is created for this LifeTasks defect.

## PB-251 reconciliation status

PB-251 is **provisional and distinct from PB-250**. PB-251 concerns a package manifest entry (`recipe-images:retry-quality`) whose referenced executable is absent from current main. The same executable path exists on the historical `agent/mypa-autonomous-control-plane` branch. Before canonical freeze, reconcile whether this represents a stale package entry, an accidentally omitted source file, or an intentionally retired command that was never cleaned from the manifest. Do not merge it into PB-196 merely because both involve recipe-image reprocessing; PB-196 concerns positional LIMIT/restartability in `recipe-image-reprocess-quality.mjs`, whereas PB-251 concerns the package-to-source contract for a different retry script.

## PB-252/PB-253 reconciliation status

- **PB-252** remains provisional: `ContentModule` is imported by `AppModule` and therefore runtime-mounted, but `ContentRecommendationService` has no observed active consumer. This is narrower than an orphan-module finding.
- **PB-253** remains provisional: `ConversationEngineModule` is imported by `PersonalBrainModule`, but `ConversationStyleService` has no observed active consumer. The module itself is not orphaned; only the exported service appears dormant.

Both must be reconciled against Project Brain architecture claims and historical feature branches before freeze. They should be withdrawn if the services are intentionally reusable primitives with no expected runtime consumer.

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

## Historical PB-001..PB-155 recovery — repository-history closure

A direct Git-history query for `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md` on the audit branch returns only the 2026-09-11 Appendix lineage beginning with commits that recorded PB-156 onward; the older PB-001..PB-155 findings are not present in the historical path of the Appendix itself. A query against the default/main branch for the same path returns no history because the Project Brain audit Appendix is audit-branch documentation rather than a main-branch historical file.

This means exact-text recovery of PB-001..PB-155 from the canonical Appendix file is **not possible from the repository history exposed by GitHub**. The audit therefore must not fabricate or reconstruct those findings. Their IDs and known duplicate mappings remain represented through `12_OPEN_WORK.md` and the reconciliation notes, while the exact original prose remains an explicitly documented historical-source limitation. If an external archived Project Brain copy is later supplied, it can be reconciled then; until that happens, this is considered a closed *evidence limitation*, not an unreported unknown.

This distinction is important for the final audit claim: the repository has been checked for the historical Appendix source, the absence has been evidenced, and no false historical findings are being invented.

## Audit status / external-validation boundary

No production code changed in these audit batches. The remaining validation boundary is explicitly environmental rather than an uninvestigated source gap: local backend/mobile execution, physical-device behavior, deployed database/RLS/schema drift, external Supabase/Auth configuration, and any production storage state cannot be truthfully verified from the repository alone. These limitations must be stated in the final audit report rather than converted into unsupported “PASS” claims.

The remaining source-level closure work is therefore: canonical Appendix merge/reconciliation, final DB/route/security matrices, intentional-library/orphan decisions for PB-251..PB-253, account-erasure inventory closure, checkpoint/index synchronization, and a final duplicate-free findings freeze.