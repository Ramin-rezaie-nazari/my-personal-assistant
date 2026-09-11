# MYPA Current State

Last updated: 2026-09-11
Review status: IN_PROGRESS

## Audit governance

This root-level file is the canonical location required by the MYPA audit protocol for current project state. It is intentionally kept separate from the legacy/operational document at `apps/backend/docs/05_CURRENT_STATE.md` until those two documents are reconciled.

## Current audit status

- Repository: `Ramin-rezaie-nazari/my-personal-assistant`
- Audit branch: `audit/project-brain-2026-09-11`
- Latest audit checkpoint: BATCH-0018 validation sweep + CI evidence + Project Brain inventory continuation; current documentation remains audit-only.
- Audit is IN_PROGRESS.
- No production-code modification has been made by this audit branch work; changes remain documentation/audit-only.

## Verified scope in this continuation

- Backend route↔mobile consumer reconciliation was extended across Meals/Nutrition, Calendar, Reminders, Notifications, Habits, Supplements, Inventory, Shopping, Recipe Match, Assistant, Onboarding and Daily Command Center.
- Mobile domain transport clients were compared against the canonical refresh/retry behavior.
- Backend common config/bootstrap/database/i18n/image-pipeline boundaries were rechecked.
- Raw-SQL ownership/destructive-operation paths were rechecked for Goals, ConversationTurn, LifeTask, TaskDependency, WorkoutPerformance and Price Intelligence.
- CI/release workflows and package-script entrypoints were reconciled.
- Memory Intelligence, Goals, Calendar, Preferences, Settings, Onboarding, Health DTOs, Yoga pose pipeline and notification contracts were directly inspected.
- Active Shopping `addRecipeMissing()` and its Recipe Food Operating Loop consumer were inspected for batch-write consistency.
- Active Habits/Workout/Supplements/LifeExecution DTO/controller contracts were rechecked against the global ValidationPipe.
- Project Brain inventories, current Open Work catalog, deep-read directory, and full current Appendix blob were re-read; the historical Appendix gap remains unresolved and no missing historical finding IDs were invented.
- GitHub Actions run/job evidence for the Recipe image import workflow was checked; run `34613481370` failed during frozen-lockfile dependency installation before the import step.
- Historical high-value PRs/branches remain branch-only unless explicit merge evidence exists.

## Important current findings

- PB-188: recipe content importer calls `prisma.recipeStep`/`prisma.recipeMedia` delegates absent from final `schema.prisma`.
- PB-192/PB-193: recipe content import is first-batch-only and not transactionally grouped.
- PB-194/PB-197: image size and hero/primary contracts disagree across operational variants.
- PB-198: final food-intelligence self-test exists but is not package/CI wired.
- PB-199: recipe quality score is written as a fraction but divided by 100 in ranking.
- PB-200: nutrition estimator hard-coded constants lack source/version provenance.
- PB-201/PB-202: image reset/import pagination can orphan storage or repeat work beyond 1000 rows.
- PB-203: local guaranteed-v8 image orchestration references missing scripts.
- PB-204: country preference scoring expects relation fields that its query does not select.
- PB-205: several Mobile domain API clients bypass canonical 401 refresh/retry handling.
- PB-206: recipe content release workflow references undefined backend package scripts.
- PB-207: Mobile onboarding completion is local-only and does not synchronize backend onboarding/profile state.
- PB-208: refresh tokens are stored in plaintext in the Session persistence model.
- PB-209: persisted Session `expiresAt` is not enforced in refresh-token lookup.
- PB-231: Yoga pose analysis has an uncancelled async stop race.
- PB-232: active Memory Intelligence write body conflicts with the global `ValidationPipe` whitelist/forbid policy.
- PB-233: active Goals write/check-in DTOs conflict with the global `ValidationPipe` whitelist/forbid policy.
- PB-234: active Calendar create/update write contracts conflict with the global `ValidationPipe` whitelist/forbid policy.
- PB-235: Goal check-in performs logically coupled parent/child writes without a transaction.
- PB-240: Price Intelligence controller exposes collection/mutation surfaces without authentication or user scoping.
- PB-241: Shopping recipe-missing batch can partially persist basket changes on mid-batch failure because sequential `addToBasket()` writes are not transactionally grouped.
- PB-242: Recipe image CI is currently blocked by package/lockfile drift under `pnpm install --frozen-lockfile`, with evidence from real run `34613481370`.
- PB-243: provisional validation-sweep finding groups active undecorated class DTOs, but it must be reconciled against historical PB-077/PB-085/PB-089 before final catalog freeze to avoid duplicate root-cause IDs.

## Validation state

Source-level inspection has been performed for the listed files. Runtime execution, live database state, physical-device validation, and end-to-end production behavior are not established by this session and must not be inferred from this document.

## Historical reconciliation state

High-value open feature lines are not equivalent to merged production state. PR #48 is open/unmergeable, PR #49 is open/mergeable only against its feature base, and PR #66 remains a draft branch-only workstream. No historical line is treated as current-main production behavior without explicit merge evidence.

## Progress accounting

The audit remains approximately in the high-70% range by the prior working estimate, but this is not a file-count metric and is not treated as a completion claim. The Master Prompt remains open until the remaining repository-wide source/test/consumer, database/transaction, security/privacy, runtime, and historical closure gates are reconciled.

## Next audit step

Continue the Master Prompt without interruption: exhaustively reconcile database readers/writers/transactions/relations/indexes, finish backend↔mobile DTO/test/consumer mapping, close security/privacy/retention/deletion gaps, finish common/platform/test and legacy operational source inventory, and complete historical Project Brain restoration/reconciliation. Only after that audit scope is fully closed should the separate correction/remediation phase begin.
