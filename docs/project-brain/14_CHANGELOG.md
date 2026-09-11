# Project Brain Changelog

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: baseline + Core + complete Prisma schema + all 39 migration SQL files + complete Assistant TypeScript source/test scope + Personal Brain production/test scope covered by the enumerated current-main tree + Brain Integration + Conversation Engine + Decision Engine + Adaptive Learning + Goal Intelligence + Memory Intelligence file-level scopes.
Scope not yet read: Food, Shopping, Life/Health, Fitness deep-read outside Personal Brain integrations, Platform/Tests, Mobile, repository-wide route/consumer/database matrices, full automated validation, full security/privacy closure, historical docs/branches.
Evidence roots: Project Brain documents; `apps/backend/src/modules/`; `apps/backend/prisma/`.
Confidence level: HIGH for completed file-level reads; MEDIUM for cross-module conclusions; no repository runtime execution claim.
Open questions: exact repository-wide inventory/line counts, live DB drift, complete model/table consumer graph, transaction boundaries, route/mobile mappings, full CI validation.

## 2026-09-11 — BATCH-0001
- Initialized durable Project Brain on `audit/project-brain-2026-09-11` without modifying `main`.

## 2026-09-11 — BATCH-0002
- Re-read current-main Core modules instead of relying on the divergent historical audit branch.
- Completed identified current-main Core source reads.

## 2026-09-11 — BATCH-0003
- Read the complete current-main Prisma schema.
- Read all 39 migration SQL files plus `migration_lock.toml`.
- Reconciled schema evolution paths and recorded migration-created tables absent from final Prisma (`ConversationTurn`, `DecisionOutcome`, `WorkoutPerformance`, price-intelligence tables, RecipeStep/RecipeMedia, compatibility tables).

## 2026-09-11 — BATCH-0004A/B
- Completed Assistant TypeScript source/test read, including controller/specs, deterministic local understanding, contextual commands, conversation persistence, planning and action execution.
- Confirmed raw-SQL runtime dependency on `ConversationTurn`, local provider routing and placeholder assistant services.

## 2026-09-11 — BATCH-0004C/D — Brain deep-read continuation
- Completed file-level reading of the enumerated Brain support modules: Brain Integration, Conversation Engine, Decision Engine, Adaptive Learning, Goal Intelligence and Memory Intelligence.
- Completed the enumerated Personal Brain production/test scope across state/reasoning, decisions, execution, planning, scheduling, proactive coach/notifications, memory/learning, fitness and action adapters.
- Recorded 29 evidence-backed Personal Brain issues in `docs/project-brain/12_OPEN_WORK.md`, including schema/runtime drift, notification capability mismatch, process-local state, high-priority device ownership risk, timezone boundaries, legacy dependency usage, broad execution dependencies, placeholder façades and decision/context quality concerns.
- Confirmed `FullDaySchedulerService` reads legacy `TaskDependency` via raw SQL while Life Execution also has `LifeTaskDependency` in the schema/migration evolution.
- Confirmed Brain daily/weekly/life-context date boundaries are UTC-based, requiring reconciliation with any user-local timezone model.
- Confirmed Brain reasoning quality uses a narrow four-signal heuristic and BrainStateAnalyzer can mark empty memory/goal arrays as available.
- Confirmed NotificationDeliveryProviderRegistry currently implements only `in_app` while channel intelligence can rank additional channels.
- Confirmed proactive notification dedupe state is process-local and observed controller flow does not call `markSent()`.
- Confirmed action confirmation tokens are deterministic hashes rather than high-entropy one-time secrets.

## Next
- Freeze the Brain deep-read documents/matrices against the enumerated inventory and ensure every required source/test file is represented.
- Continue with Food, Shopping, Life/Health, Fitness, Platform/Tests and Mobile deep-read scopes.
- Then complete route-to-mobile and mobile-feature-to-backend mappings, Prisma table consumer/transaction reconciliation, CI/runtime validation, security/privacy review and historical reconciliation.
- Only after the audit/master-prompt closure will the separate correction phase begin using the issue catalog as the repair plan.
