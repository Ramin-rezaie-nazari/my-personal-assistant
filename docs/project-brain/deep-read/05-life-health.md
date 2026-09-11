# Life and Health Deep Read

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: `calendar` controller/service/DTO/service spec; `daily` module/controller/service/DTOs/service spec; `goals` inventory/controller/service/DTOs/service spec; `habits` module/controller/service/DTO/service spec; `life-execution` module/controller/DTO/service and missing service-spec check; `reminders` module/controller/DTOs/service/service spec/update spec; `notifications` module/controller/DTO/service/DTO and smart-notification service/spec; `supplements` module/controller/DTOs/service/service spec; `health` root legacy controller/service/specs plus active nested controller/DTO/services/module. File-level read is complete for these enumerated scopes; runtime execution not performed.
Scope not yet read: any life/health files outside the enumerated module trees; `daily-command-center` if present outside the inspected daily scope; Fitness; Platform/Tests/CI; Mobile; repository-wide route/consumer/database reader-writer/transaction reconciliation; deployed schema drift and runtime behavior.
Evidence roots: `apps/backend/src/modules/calendar/`; `daily/`; `goals/`; `habits/`; `life-execution/`; `reminders/`; `notifications/`; `supplements/`; `health/`; `apps/backend/prisma/schema.prisma`; relevant migrations.
Confidence level: HIGH for file-level findings below; MEDIUM for cross-module/runtime impact because runtime execution and full consumer reconciliation remain pending.

## Findings

- Calendar endpoints are JWT/user scoped and service ownership checks are present, but `CreateCalendarEventDto` has no runtime validation decorators and the update route accepts an inline body rather than a dedicated DTO. `CalendarService.updateEventTime()` uses `setUTCHours()` without an explicit user-timezone contract, so a time-only reschedule can disagree with intended local time.
- Daily uses a date-aware `(userId,dateKey)` key and validates explicit date strings, but implicit date defaults are UTC. `UpdateDailyDto` only constrains values as numbers and does not express finite/non-negative/domain ranges; `DailyService.updateDailyLog()` can therefore persist semantically invalid numeric values when controller-pipe validation is relied upon. `AddWaterDto` has no decorators, although the service itself enforces 1..5000 finite milliliters.
- Goals are user-scoped at the controller/service boundary but operate through raw SQL against `Goal` and `GoalCheckin`, which are absent from the final Prisma model contract. Check-in date defaults to UTC. Create/update/check-in DTOs have no runtime validation decorators. Goal tests exist, but the first check-in validation path can stop on the mocked-not-found condition before reaching progress validation, so that specific test does not exercise the intended DB-success path end-to-end.
- Habits are Prisma/user scoped and have service tests, but `todayKey()`, streak calculations and weekly summaries use UTC rather than an explicit user-local timezone. Weekly possible-count logic is simplified to `min(targetPerWeek,7)` per habit without modeling frequency-specific schedules or lifecycle gaps. The habit DTO is not decorated for runtime validation.
- Life Execution uses raw SQL for task/dependency/event data and specifically references legacy `TaskDependency`/`TaskEvent` tables while newer `LifeTaskDependency`/`LifeTaskEvent` structures also exist in migrations. This is a schema-contract drift risk. `task.dto.ts` has no runtime validation decorators, and no direct `life-execution.service.spec.ts` was found at the expected path (404), leaving the core service without a direct automated test in the inspected scope.
- Reminders are comparatively mature: user timezone is consulted for local scheduling, DTO validation is present, ownership tests exist, and update behavior has direct coverage. No major confirmed correctness issue was identified in the inspected files.
- Notifications are user-scoped and DTO-backed. Smart notification dedupe is persisted, but the workout query uses only a lower `performedAt >= start-of-day` bound without an upper end-of-day bound, so future workouts can be included in the current-day rule evaluation. The existing smart-notification spec did not cover the upper-bound case.
- Supplements are user-scoped and have service tests, but DTO validation is absent in the active `supplement.dto.ts`. A second, conflicting `CreateSupplementDto` remains in `dto/create-supplement.dto.ts` with `category`/required `dosage` fields, while the active controller/service import the different definition from `supplement.dto.ts`. This creates a stale duplicate API contract. Supplement implicit date keys are UTC-based.
- Health contains two different contract layers: root `health.controller.ts`/`health.service.ts` and their specs expose a simple `/health` check, while `health.module.ts` actually wires `controllers/health.controller.ts` with nested `services/health.service.ts` and `nutrition.service.ts`. Search evidence shows the root health pair are referenced only by their own tests in the audited target, making them legacy/dead duplicate surface relative to the active module. The active health update DTOs use type validators (`IsInt`/`IsNumber`/`IsString`) but lack domain-range constraints and enum validation, while active services directly upsert the values.

## Issue IDs introduced/confirmed in this deep read

- PB-082: Smart notification workout query has no end-of-day upper bound; future workouts can count as today.
- PB-083: Supplements contain conflicting duplicate `CreateSupplementDto` definitions; active controller/service use one while another stale contract remains.
- PB-084: Life Execution dependency/event SQL uses legacy `TaskDependency`/`TaskEvent` while newer `LifeTaskDependency`/`LifeTaskEvent` structures also exist; schema contract is inconsistent.
- PB-085: Life Execution DTOs lack runtime validation decorators.
- PB-086: Life Execution core service lacks a direct service spec in the inspected tree (`life-execution.service.spec.ts` was not found).
- PB-087: Active Health module has a duplicate legacy root health controller/service/test surface separate from the nested active health implementation.
- PB-088: Active Health profile DTOs do not enforce domain ranges/enums; services directly persist supplied values.

## Remaining work

Finish any unenumerated Life/Health source files and then reconcile this deep read with the global file index, contract matrix, feature matrix, checkpoints, review gaps and issue catalog. Runtime verification and repository-wide consumer/database reconciliation remain pending.
