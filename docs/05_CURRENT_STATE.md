# MYPA Current State

Last updated: 2026-09-11
Review status: IN_PROGRESS

## Audit governance

This root-level file is the canonical location required by the MYPA audit protocol for current project state. It is intentionally kept separate from the legacy/operational document at `apps/backend/docs/05_CURRENT_STATE.md` until those two documents are reconciled.

## Current audit status

- Repository: `Ramin-rezaie-nazari/my-personal-assistant`
- Audit branch: `audit/project-brain-2026-09-11`
- Latest audit checkpoint: continuing BATCH-0013 / Master Prompt closure; current documentation remains audit-only.
- Audit is IN_PROGRESS.
- No production-code modification has been made by this audit branch work; changes remain documentation/audit-only.

## Verified scope in this continuation

- Backend route↔mobile consumer reconciliation was extended across Meals/Nutrition, Calendar, Reminders, Notifications, Habits, Supplements, Inventory, Shopping, Recipe Match, Assistant, Onboarding and Daily Command Center.
- Mobile domain transport clients were compared against the canonical refresh/retry behavior.
- Backend common config/bootstrap/database/i18n/image-pipeline boundaries were rechecked.
- Raw-SQL ownership/destructive-operation paths were rechecked for Goals, ConversationTurn, LifeTask, TaskDependency, WorkoutPerformance and Price Intelligence.
- CI/release workflows and package-script entrypoints were reconciled.
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

## Validation state

Source-level inspection has been performed for the listed files. Runtime execution, live database state, physical-device validation, and end-to-end production behavior are not established by this session and must not be inferred from this document.

## Historical reconciliation state

High-value open feature lines are not equivalent to merged production state. PR #48 is open/unmergeable, PR #49 is open/mergeable only against its feature base, and PR #66 remains a draft branch-only workstream. No historical line is treated as current-main production behavior without explicit merge evidence.

## Progress accounting

A trustworthy repo-wide completion percentage is not recalculated in this continuation. The Master Prompt remains open until the remaining repository-wide source/test/consumer, database/transaction, security/privacy, runtime, and historical closure gates are reconciled.

## Next audit step

Continue the Master Prompt with exhaustive database reader/writer/transaction/relation/index reconciliation, remaining backend↔mobile DTO/test mapping, security/privacy retention/deletion closure, remaining common/platform/test and legacy-source inventory, and final historical reconciliation. Only after that audit scope is fully closed should the separate correction/remediation phase begin.
