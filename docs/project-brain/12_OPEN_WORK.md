# Open Work / Issue Catalog

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: baseline; Core; Prisma schema + all 39 migrations; Assistant; complete Brain file-level scope; Food/Recipe/Nutrition/Meals/Recommendation/Budget; Shopping/Inventory/Shopping Intelligence; substantial Price Intelligence; Calendar; Daily; Goals; Habits; Life Execution; Reminders; Notifications; Supplements; active Health plus legacy Health surface.
Scope not yet read: Fitness outside Brain integrations; Platform/Tests/CI; Mobile; full repository-wide route/consumer/database matrices; runtime validation; full security/privacy; historical docs/branches; any remaining life/health files outside the inspected module trees.
Evidence roots: `apps/backend/src/modules/`; `apps/backend/prisma/`; `docs/project-brain/`.
Confidence level: HIGH for exact issues below; MEDIUM for cross-module impact until all consumers/runtime are reconciled.
Open questions: deployed schema drift; any unenumerated life-health source files; mobile contracts; runtime execution; full repo route/reader-writer/transaction coverage.

## Issue catalog

### PB-001 — Memory governance metadata is not persisted
Status: OPEN
Location: `apps/backend/src/modules/memory-intelligence/models/memory.model.ts`, `models/memory-governance.model.ts`, `repositories/prisma-memory.repository.ts`, Prisma `UserFact`.

### PB-002 — Brain memory integration does not satisfy required user-id contract
Status: OPEN
Location: `apps/backend/src/modules/brain-integration/services/brain-memory.service.ts`, Memory Intelligence service/repository.

### PB-003 — Personal Brain MemoryManager is placeholder-level
Status: OPEN
Location: `apps/backend/src/modules/personal-brain/services/memory-manager.service.ts`.

### PB-004 — DecisionOutcome raw SQL runtime contract absent from final Prisma model
Status: OPEN
Location: `personal-brain/services/decision-outcome-learning.service.ts`, decision-outcome migrations, `schema.prisma`.

### PB-005 — ConversationTurn raw SQL runtime contract absent from final Prisma model
Status: OPEN
Location: `assistant/services/conversation-history.service.ts`, conversation-turn migration, `schema.prisma`.

### PB-006 — WorkoutPerformance raw SQL runtime contract absent from final Prisma model
Status: OPEN
Location: `personal-brain/services/workout-performance-memory.service.ts`, workout-performance migration, `schema.prisma`.

### PB-007 — Other migration-only tables need reconciliation
Status: OPEN
Locations: `apps/backend/prisma/migrations/`, `schema.prisma`.

### PB-008 — Notification intelligence can select unsupported channels
Status: OPEN
Locations: `personal-brain/services/notification-channel-intelligence.service.ts`, `notification-delivery-provider.service.ts`.

### PB-009 — Notification dedupe is process-local and approved decisions are not marked sent in observed controller path
Status: OPEN
Locations: `notification-deduplication.service.ts`, `personal-brain.controller.ts`.

### PB-010 — Device disable endpoint lacks ownership check
Status: OPEN — SECURITY HIGH
Locations: `personal-brain.controller.ts`, `notification-device-registry.service.ts`.

### PB-011 — Multiple adaptive/decision/notification state stores are process-local
Status: OPEN
Locations: notification and decision process-local services.

### PB-012 — Personal Brain controller bodies frequently use inline/any contracts rather than DTO validation
Status: OPEN
Locations: Personal Brain controllers.

### PB-013 — Coach cue explanation accepts empty/unbounded message semantics
Status: OPEN
Location: Personal Brain coach cue path.

### PB-014 — Workout implicit date can use UTC instead of user-local date
Status: OPEN
Location: `personal-brain/services/workout-action-adapter.service.ts`.

### PB-015 — Decision execution dependency graph is broader than semantic predecessors
Status: OPEN
Location: `decision-execution-planner.service.ts`.

### PB-016 — Adaptive/scheduling/scenario behavior is strongly rule-based despite broader adaptive naming
Status: OPEN / DESIGN REVIEW
Locations: scheduling/scenario/adaptive services.

### PB-017 — UserUnderstanding/IntentionAnalysis placeholders
Status: OPEN
Locations: `user-understanding.service.ts`, `intention-analysis.service.ts`.

### PB-018 — Goal Intelligence placeholders
Status: OPEN
Locations: `goal-intelligence/services/*`.

### PB-019 — Brain Integration context is thin placeholder
Status: OPEN
Location: `brain-integration/services/brain-context.service.ts`.

### PB-020 — Decision Engine top-level service is placeholder-level while logic is split
Status: OPEN
Locations: Decision Engine services.

### PB-021 — Adaptive Learning write path incomplete
Status: OPEN
Location: `adaptive-learning/`.

### PB-022 — Duplicate incompatible NotificationChannel contracts
Status: OPEN
Locations: notification channel intelligence/provider.

### PB-023 — Proactive event -> delivery lifecycle incomplete
Status: OPEN
Locations: proactive event/dedupe/delivery.

### PB-024 — Confirmation tokens deterministic instead of high-entropy one-time secrets
Status: DESIGN/SECURITY REVIEW
Location: `action-confirmation-intelligence.service.ts`.

### PB-025 — Scenario simulator uses heuristic candidate mutations instead of explicit scenario models
Status: OPEN / DESIGN REVIEW
Locations: `multi-scenario-simulator.service.ts`, `scenario-planning.service.ts`.

### PB-026 — Brain daily/weekly/life-context boundaries are UTC-based
Status: OPEN
Locations: `brain-daily-status.service.ts`, `brain-weekly-status.service.ts`, `brain-life-context.service.ts`.

### PB-027 — Brain reasoning context quality ignores major context dimensions and freshness
Status: OPEN / DESIGN REVIEW
Location: `brain-reasoning-context.service.ts`.

### PB-028 — BrainStateAnalyzer treats empty goal/memory arrays as available
Status: OPEN
Location: `brain-state-analyzer.service.ts`.

### PB-029 — Full-day scheduler uses legacy TaskDependency + server-local time semantics
Status: OPEN — DATA/TIMEZONE HIGH
Location: `full-day-scheduler.service.ts`.

### PB-030 — Recipe nutrition totals assume undefined FoodItem base quantity/unit
Status: OPEN — DATA INTEGRITY HIGH
Locations: `recipes.service.ts`, FoodsService, Prisma `FoodItem`.

### PB-031 — Food Operating Loop and RecipeInventoryMatcher use incompatible inventory unit semantics
Status: OPEN — DATA INTEGRITY HIGH
Locations: `food-operating-loop.service.ts`, `recipe-inventory-matcher.service.ts`.

### PB-032 — Package/unitless inventory cannot be meaningfully compared in FoodOperatingLoop
Status: OPEN
Location: `food-operating-loop.service.ts`.

### PB-033 — Recipe meal-plan endpoint ignores recipe mealTypes
Status: OPEN
Location: `recipes.controller.ts` `GET /recipes/meal-plan`.

### PB-034 — Country code lacks explicit supported-set validation
Status: OPEN
Locations: Recipe country endpoints.

### PB-035 — Controller serving-count contract differs from DTO/service
Status: OPEN
Location: Recipes controller serving parser vs DTO/service.

### PB-036 — Recipe presentation reads migration-only RecipeStep raw SQL
Status: OPEN
Location: `recipe-presentation.service.ts`, RecipeStep migration, `schema.prisma`.

### PB-037 — Recipe create/update does not manage RecipeStep/RecipeMedia lifecycle
Status: OPEN
Locations: Recipes service/presentation + migrations.

### PB-038 — Meal nutrition repeats undefined FoodItem base-unit assumption
Status: OPEN — DATA INTEGRITY HIGH
Locations: `meals.service.ts`, Prisma FoodItem/MealItem.

### PB-039 — Budget MealPlanningService ignores countryCode and inventory/cuisine constraints
Status: OPEN
Location: `budget-intelligence/services/meal-planning.service.ts`.

### PB-040 — Recommendation Intelligence placeholder/disconnected from Recipe flow
Status: OPEN
Locations: recommendation-intelligence services.

### PB-041 — Budget Intelligence top-level plan/cost services placeholders
Status: OPEN
Locations: budget/food-cost services.

### PB-042 — Budget plan endpoint public while DTO unused/unvalidated
Status: OPEN — SECURITY/API CONTRACT
Locations: budget controller/DTO.

### PB-043 — Nutrition and Meals dateKey defaults UTC-based
Status: OPEN — TIMEZONE HIGH
Locations: nutrition/meals services.

### PB-044 — Multiple meal-planning/recommendation implementations can diverge
Status: OPEN / DESIGN REVIEW
Locations: Recipe/Budget/FoodOperatingLoop/Recommendation Intelligence.

### PB-045 — Recipe nutrition estimate script uses separate Supabase/legacy schema contract
Status: OPEN — DATA INTEGRITY HIGH
Location: `apps/backend/scripts/recipe-nutrition-estimate.mjs`.

### PB-046 — Budget MealPlanningService ignores targetServings in scoring/plan math
Status: OPEN
Location: `budget-intelligence/services/meal-planning.service.ts`.

### PB-047 — Meal-created DailyLog and Nutrition summary use different source sets
Status: OPEN — DATA CONSISTENCY HIGH
Locations: MealsService, NutritionService, DailyLog/Meal/NutritionLog.

### PB-048 — Meal and NutritionLog ingestion lack shared event deduplication
Status: OPEN — DATA CONSISTENCY HIGH
Locations: MealsService, NutritionService.

### PB-049 — Shopping addToBasket does not enforce FoodItem visibility/ownership
Status: OPEN — SECURITY/DATA HIGH
Location: `shopping/shopping.service.ts` `addToBasket()`.

### PB-050 — Shopping Intelligence top-level service is placeholder-level
Status: OPEN
Locations: shopping-intelligence facade/list/purchase-analysis.

### PB-051 — Household consumption learning is process-local and not user/household scoped
Status: OPEN — DATA ISOLATION HIGH
Location: `household-consumption-learning.service.ts`.

### PB-052 — Inventory forecast assumes numeric quantities share one unit
Status: OPEN — DATA INTEGRITY HIGH
Location: `household-inventory-intelligence.service.ts`.

### PB-053 — Household purchase planner conflates safetyStock with purchase quantity
Status: OPEN / DESIGN REVIEW
Location: `household-purchase-planner.service.ts`.

### PB-054 — Shopping controller write bodies have no DTO validation
Status: OPEN
Location: `shopping/shopping.controller.ts`.

### PB-055 — Inventory adjustment body lacks DTO/finite-number validation
Status: OPEN
Location: `inventory/inventory.controller.ts`, `inventory.service.ts`.

### PB-056 — Shopping Intelligence controller unguarded and placeholder
Status: OPEN
Location: `shopping-intelligence/controllers/shopping-intelligence.controller.ts`.

### PB-057 — Price Intelligence controller unguarded including write/collection endpoint
Status: OPEN — SECURITY CRITICAL
Location: `price-intelligence/controllers/price-intelligence.controller.ts`.

### PB-058 — HTTP price normalization forces non-IRR currencies to IRT
Status: OPEN — DATA INTEGRITY CRITICAL
Location: `price-intelligence/services/http-price-source.adapter.ts`.

### PB-059 — Price analysis aggregates incompatible currency/unit/package/source observations
Status: OPEN — DATA INTEGRITY HIGH
Location: `price-intelligence.service.ts`, `price-persistence.service.ts`.

### PB-060 — Price analysis/history has duplicate service ownership
Status: OPEN / ARCHITECTURE
Locations: price-analysis/history/history-store/intelligence/market-analysis services.

### PB-061 — In-memory price history duplicates durable PriceSnapshot
Status: OPEN
Locations: `price-history-store.service.ts`, `price-persistence.service.ts`.

### PB-062 — Price scheduling timezone policy duplicated/hard-coded
Status: OPEN
Locations: three price scheduler services.

### PB-063 — Nightly attempts counter off-by-one reporting risk
Status: DESIGN/VALIDATION REVIEW
Location: `nightly-market-intelligence.service.ts` retry loop.

### PB-064 — Price source registry lacks health/capability/trust metadata
Status: OPEN / DESIGN
Location: `price-source-registry.service.ts`.

### PB-065 — Product matching does not explicitly penalize package-size variants
Status: OPEN / DESIGN REVIEW
Location: `product-matching.service.ts`.

### PB-066 — Shopping from-recipe path does not ownership-scope Recipe
Status: OPEN — SECURITY/DATA HIGH
Location: `shopping/shopping.service.ts` `addRecipeMissing()`.

### PB-067 — Household consumption learning has no unit identity
Status: OPEN — DATA INTEGRITY HIGH
Location: `household-consumption-learning.service.ts`.

### PB-068 — Smart purchase basket can mix currencies against one numeric budget
Status: OPEN — DATA INTEGRITY HIGH
Location: `smart-purchase-basket.service.ts`.

### PB-069 — PurchasePlanService does not enforce item currency == plan currency
Status: OPEN — DATA INTEGRITY HIGH
Location: `purchase-plan.service.ts`.

### PB-070 — Shopping base module has no direct automated test
Status: OPEN — TEST GAP
Location: `apps/backend/src/modules/shopping/`.

### PB-071 — Price controller lacks direct controller test
Status: OPEN — TEST GAP
Location: `price-intelligence/controllers/price-intelligence.controller.ts`.

### PB-072 — Automatic price scheduler lacks direct service test
Status: OPEN — TEST GAP
Location: `price-intelligence/services/automatic-price-scheduler.service.ts`.

### PB-073 — Goals use raw SQL tables outside final Prisma model contract
Status: OPEN — DATA/SCHEMA HIGH
Locations: `apps/backend/src/modules/goals/services/goals.service.ts`, tables `Goal` and `GoalCheckin`, final `apps/backend/prisma/schema.prisma`.
Problem: goal create/find/update/checkin/delete all use raw SQL; Goal/GoalCheckin are not represented as final Prisma models in the audited schema.
Impact: goal domain changes are invisible to the Prisma model graph and can drift from migrations, generated client and other services.

### PB-074 — Goal check-in dateKey uses UTC without user timezone
Status: OPEN — TIMEZONE HIGH
Location: `apps/backend/src/modules/goals/services/goals.service.ts` `checkin()`.
Problem: absent dateKey defaults to `new Date().toISOString().slice(0,10)`.
Impact: a late-night local check-in can be attached to the wrong calendar day.

### PB-075 — Goal DTOs have no runtime validation decorators
Status: OPEN
Locations: `apps/backend/src/modules/goals/dto/create-goal.dto.ts`, `update-goal.dto.ts`, `checkin-goal.dto.ts`.
Impact: intended priority/progress/date constraints are enforced only after controller binding reaches GoalsService.

### PB-076 — Habit today/streak/weekly window is UTC-based rather than user-local
Status: OPEN — TIMEZONE HIGH
Location: `apps/backend/src/modules/habits/services/habits.service.ts` `todayKey()`, `stats()`, `getWeeklySummary()`.
Impact: habit completion and streaks can fall on the wrong user-local day around midnight.

### PB-077 — Habit DTOs have no validation decorators
Status: OPEN
Location: `apps/backend/src/modules/habits/dto/habit.dto.ts`.
Impact: string/enum/range guarantees rely on service logic rather than API validation.

### PB-078 — Habit weekly summary possible-count semantics are simplistic
Status: OPEN / DESIGN REVIEW
Location: `apps/backend/src/modules/habits/services/habits.service.ts` `getWeeklySummary()`.
Problem: possible completions are computed as `sum(min(targetPerWeek,7))` without considering frequency-specific scheduling or whether a habit started/paused mid-window.
Impact: completionPercent can misrepresent adherence for weekly habits or lifecycle-bound habits.

### PB-079 — Calendar update endpoint uses inline unvalidated patch body and time update has explicit UTC semantics
Status: OPEN
Locations: `calendar/controllers/calendar.controller.ts`, `calendar/services/calendar.service.ts`.
Problem: update body has no DTO; `updateEventTime()` calls `setUTCHours()` without an explicit user timezone contract.
Impact: time-only reschedules may shift the intended local time/day.

### PB-080 — Daily Update DTO allows arbitrary numeric values without non-negative/range constraints
Status: OPEN
Location: `daily/dto/update-daily.dto.ts`.
Problem: @IsNumber is present but no Min/finite constraint is defined, while `DailyService.updateDailyLog()` directly upserts values.
Impact: negative/NaN/infinite/implausible calories/protein/water values can reach DailyLog depending on validation-pipe configuration.

### PB-081 — AddWaterDto has no validation decorators
Status: OPEN
Location: `daily/dto/add-water.dto.ts`.
Impact: service validates range, but API contract does not express the required positive finite amount.

### PB-082 — Smart notification workout query has no end-of-day upper bound
Status: OPEN — TIME/LOGIC HIGH
Location: `apps/backend/src/modules/notifications/services/smart-notification.service.ts`, workout `findMany` query used for the daily rule.
Problem: the filter applies only `performedAt >= <dateKey>T00:00:00.000Z` and does not apply `performedAt < <nextDateKey>T00:00:00.000Z`. A workout tomorrow or later can satisfy the current-day query.
Impact: smart-notification daily rules may suppress/send the wrong notification because future workouts are treated as today's activity. The existing `smart-notification.service.spec.ts` does not cover the upper-bound case.

### PB-083 — Supplements contain conflicting duplicate CreateSupplementDto definitions
Status: OPEN — API CONTRACT
Locations: `apps/backend/src/modules/supplements/dto/create-supplement.dto.ts`, `apps/backend/src/modules/supplements/dto/supplement.dto.ts`, `supplements.controller.ts`, `supplements.service.ts`.
Problem: the standalone DTO requires `name`, `category`, `dosage`, while the active `supplement.dto.ts` defines `name`, optional `dosage`, optional `frequency`, optional `scheduledTime`; the active controller/service import the latter and the standalone DTO has no observed consumer.
Impact: two incompatible schemas for the same type name can mislead future callers/refactors and allow the API contract to silently drift.

### PB-084 — Life Execution dependency/event SQL uses legacy table contracts
Status: OPEN — DATA/SCHEMA HIGH
Location: `apps/backend/src/modules/life-execution/services/life-execution.service.ts` for dependency insertion, event writes and dependency reads.
Problem: the service uses raw SQL against legacy `TaskDependency` and `TaskEvent`, while the migrations also define newer `LifeTaskDependency` and `LifeTaskEvent` structures. These are not represented consistently in the active Prisma model contract.
Impact: writes/reads can diverge from newer lifecycle tables, causing duplicate graph/event histories, migrations that no longer describe runtime behavior, and difficult reconciliation of task state.

### PB-085 — Life Execution DTOs lack runtime validation decorators
Status: OPEN — API CONTRACT
Location: `apps/backend/src/modules/life-execution/dto/task.dto.ts`.
Problem: task and dependency request fields are plain TypeScript properties without class-validator decorators.
Impact: malformed priorities, statuses, dates, dependency identifiers or state payloads can enter the service layer unless separately rejected.

### PB-086 — Life Execution core service has no direct service spec in inspected tree
Status: OPEN — TEST GAP
Location: `apps/backend/src/modules/life-execution/services/life-execution.service.ts`; expected `life-execution.service.spec.ts` lookup returned 404.
Impact: the central raw-SQL task/dependency/event behavior has no direct unit-level regression safety in the inspected scope.

### PB-087 — Health module contains a duplicate legacy root controller/service/test surface
Status: OPEN — ARCHITECTURE/CONTRACT
Locations: `apps/backend/src/modules/health/health.controller.ts`, `health.service.ts`, `health.controller.spec.ts`, `health.service.spec.ts` versus active `health/controllers/health.controller.ts`, `health/services/health.service.ts`, `health/services/nutrition.service.ts`, `health/health.module.ts`.
Problem: the module wires the nested implementation, while the root pair expose a separate simple `/health` controller and their tests cover only that legacy pair. Repository search showed the root imports only within that root test/controller pair in the audited target.
Impact: maintenance can update or test the inactive contract while the actual profile/nutrition implementation remains unchanged, and route ownership becomes ambiguous.

### PB-088 — Active Health profile DTOs do not enforce domain ranges or enumerated values
Status: OPEN — DATA INTEGRITY
Locations: `apps/backend/src/modules/health/dto/update-health-profile.dto.ts`, `update-nutrition-profile.dto.ts`, active Health services.
Problem: numeric fields use `IsInt`/`IsNumber` only; there are no non-negative/maximum constraints and no enum/domain validation for fields such as `gender`, `activityLevel`, or `dietType`. Active services directly upsert the supplied values.
Impact: semantically impossible or unsupported profile/goal values can be persisted even though the DTOs appear validated.

## Next deterministic work

1. Complete any remaining Life/Health inventory reconciliation, then sync file index, contract matrix, feature matrix, checkpoints, review gaps and changelog.
2. Start Fitness source/deep-read and continue through Platform/Tests/CI and Mobile.
3. Complete repository-wide route/API, mobile consumer, database reader/writer/transaction, security/privacy and historical reconciliation.
4. Record actual runtime/test execution only when executed; otherwise keep status as file-read/blocked.
5. Only after Master Prompt closure begin the separate correction phase using this issue catalog.
