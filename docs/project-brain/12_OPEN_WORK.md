# Open Work / Issue Catalog

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: baseline; Core; Prisma schema + all 39 migrations; Assistant; complete Brain file-level scope; Food/Recipe/Nutrition/Meals/Recommendation/Budget; Shopping/Inventory/Shopping Intelligence; substantial Price Intelligence; Calendar; Daily; Goals; Habits; Life Execution; Reminders; Notifications; Supplements; active Health plus legacy Health surface; Fitness/Workout/Calisthenics/Gym/Yoga and related Personal Brain fitness consumers; Platform/Test/CI; substantial Mobile route/client scope.
Scope not yet read: remaining Fitness-adjacent source; remaining Mobile route/component/library files; full repository-wide route/consumer/database matrices; runtime/device validation; full security/privacy; historical docs/branches; any remaining source files outside the inspected scopes.
Evidence roots: `apps/backend/src/modules/`; `apps/backend/prisma/`; `apps/mobile/`; `.github/workflows/`; `docs/project-brain/`.
Confidence level: HIGH for exact issues below; MEDIUM for cross-module impact until all consumers/runtime are reconciled.
Open questions: deployed schema drift; remaining Mobile routes/components; physical-device behavior; runtime test/build results; full repo route/reader-writer/transaction coverage.

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

### PB-089 — Fitness controller write bodies lack DTO/runtime validation
Status: OPEN — API CONTRACT
Location: `apps/backend/src/modules/fitness/controllers/fitness.controller.ts`.
Problem: authenticated Fitness profile/natural-goal write operations accept inline object bodies rather than dedicated validated DTOs.
Impact: API boundary does not enforce the shape/ranges of profile and preference data and differs from the validated contracts used by some other modules.

### PB-090 — Active persistent and inactive in-memory FitnessProfileService implementations coexist and direct tests cover the inactive implementation
Status: OPEN — ARCHITECTURE/TEST INTEGRITY
Locations: `apps/backend/src/modules/fitness/fitness.module.ts`, `fitness/services/fitness-profile-persistence.service.ts`, `fitness/services/fitness-profile.service.ts`, `fitness/services/fitness-profile.service.spec.ts`.
Problem: the Nest provider token is bound to `FitnessProfilePersistenceService` with `useExisting`, while the separate `FitnessProfileService` keeps profiles in a process-local Map. Its direct spec constructs/tests the inactive service implementation.
Impact: unit tests can pass against behavior that production does not execute; the two implementations can drift independently and one lacks durable persistence.

### PB-091 — Fitness profile normalization validates broad shape but not semantic ranges/enums
Status: OPEN — DATA INTEGRITY
Location: `apps/backend/src/modules/fitness/services/fitness-profile-persistence.service.ts` `normalize()`.
Problem: normalization primarily checks object/array shape and does not validate supported goal/level/frequency values, session duration bounds, equipment identity/duplicates, or other domain ranges before persistence.
Impact: malformed or semantically impossible FitnessProfileState can be stored as apparently valid JSON.

### PB-092 — Active/inactive Fitness natural-goal parsing diverges
Status: OPEN — CONTRACT DRIFT
Locations: `fitness/services/fitness-profile-persistence.service.ts` and `fitness/services/fitness-profile.service.ts` `parseNaturalGoal()`.
Problem: the two implementations apply different Persian character/whitespace normalization and different `avoidBulk` matching behavior.
Impact: the same user request can produce different goal semantics depending on which implementation is used.

### PB-093 — Workout patch/create contract lacks dedicated validated DTO and explicit invalid-date/empty-text rejection
Status: OPEN — API CONTRACT/DATA INTEGRITY
Locations: `apps/backend/src/modules/workout/controllers/workout.controller.ts`, `workout/dto/create-workout.dto.ts`, `workout/services/workout.service.ts`.
Problem: PATCH uses inline `Partial<CreateWorkoutDto>` and the create DTO has no class-validator decorators. The service trims text but does not explicitly reject empty `name`/`type`; `performedAt` is parsed with `new Date()` without an explicit invalid-date guard. Numeric fields have finiteness/nonnegative checks but no domain maxima.
Impact: malformed workout records can reach persistence despite authenticated access.

### PB-094 — Workout weekly summary uses UTC calendar boundaries without explicit user-local conversion
Status: OPEN — TIMEZONE
Location: `apps/backend/src/modules/workout/services/workout.service.ts` weekly/date helper paths.
Impact: weekly active-day/streak semantics can differ from the user's local calendar near midnight.

### PB-095 — Calisthenics session generator can exceed requested duration and has no input validation
Status: OPEN — LOGIC
Location: `apps/backend/src/modules/calisthenics/services/calisthenics-session-generator.service.ts`.
Problem: exercise count is clamped to a minimum of four from `durationMin/5`, so very short requests still produce a multi-step workload; returned duration does not demonstrate that total hold/rest/recovery time fits the requested time.
Impact: generated sessions can be materially longer than requested.

### PB-096 — Gym session generator silently clamps duration and uses coarse workload fitting
Status: OPEN — LOGIC
Location: `apps/backend/src/modules/gym/services/gym-session-generator.service.ts`.
Problem: request duration is silently clamped to 10..120 and exercise count is chosen with a coarse formula without explicit timing of set/rep/rest workload against the final duration.
Impact: generated training volume can mismatch the user's requested time while the response hides the coercion.

### PB-097 — Yoga controller inputs lack DTO/runtime validation
Status: OPEN — API CONTRACT
Location: `apps/backend/src/modules/yoga/controllers/yoga.controller.ts`.
Impact: duration, level, focus and coach-analysis payloads are not consistently validated at the API boundary.

### PB-098 — Yoga motion analysis ignores per-landmark confidence and treats missing landmarks as angle=180
Status: OPEN — LOGIC/SAFETY
Location: `apps/backend/src/modules/yoga/services/yoga-motion-analysis.service.ts`.
Problem: `overallConfidence` is used as the main gate while individual landmark confidence values are not incorporated into metric validity; `angle()` returns 180 when a required landmark is missing.
Impact: low-quality or incomplete pose data can produce plausible-looking measurements and coaching feedback instead of an explicit insufficient-data state.

### PB-099 — Backend PoseProvider contract differs from Mobile PoseProvider contract
Status: OPEN — CROSS-PLATFORM CONTRACT
Locations: backend `yoga/models/pose-provider.model.ts`; Mobile pose pipeline/bridge contracts.
Problem: backend and mobile define different provider methods/types; search found a separate Mobile implementation contract.
Impact: provider integration cannot be considered one canonical cross-platform contract without reconciliation.

### PB-100 — YogaCoachService consumes hold duration during enter phase, effectively skipping hold timing
Status: OPEN — LOGIC HIGH
Location: `apps/backend/src/modules/yoga/services/yoga-coach.service.ts` phase initialization/tick logic.
Problem: `start()` initializes `remainingSec` from the pose hold duration even while phase is `enter`; `tick()` decrements that same counter during `enter`, then transitions to `hold` when it reaches zero. The hold phase therefore begins after its duration has already been consumed. A similar coupling exists around rest/exit transitions.
Impact: the coach state machine does not honor the intended hold duration. Existing tests verify eventual completion but do not assert phase-by-phase timing.

### PB-101 — Fitness TrainingConstraint type is incompatible with FitnessDecisionPolicyService low-impact check
Status: OPEN — LOGIC/TYPE CONTRACT HIGH
Locations: `apps/backend/src/modules/fitness/models/fitness.model.ts`, `personal-brain/services/fitness-decision-policy.service.ts`, its spec, `personal-brain/services/brain-life-context.service.ts`.
Problem: `TrainingConstraint` is a string union, and Brain context provides strings, but the decision policy checks each constraint as an object with `key === 'low_impact' && enabled`. Production string constraints therefore cannot satisfy that branch. The test uses an `{key,enabled}` object cast as `any`, masking the mismatch.
Impact: a configured `low_impact` constraint can be ignored in real execution, defeating the safety decision rule.

### PB-102 — FitnessSessionOrchestrator ignores policy blockers/canDecide
Status: OPEN — SAFETY/LOGIC HIGH
Location: `apps/backend/src/modules/personal-brain/services/fitness-session-orchestrator.service.ts` and its spec.
Problem: the decision policy returns a `canDecide` flag and blockers/uncertainties, but the orchestrator path primarily checks intent and proceeds to session generation instead of treating `canDecide=false` or blockers as a hard stop.
Impact: a policy intended to prevent unsafe/uncertain fitness sessions can be bypassed by the orchestration layer.

### PB-103 — FitnessSkillUnlock ownTrend path can unlock advanced skills without enforcing missing prerequisites
Status: OPEN — LOGIC
Location: `apps/backend/src/modules/personal-brain/services/fitness-skill-unlock.service.ts`.
Problem: advanced-skill unlock logic can use a positive ownTrend condition without requiring the separately computed `missingPrerequisites` set to be empty. Existing test coverage does not combine positive trend with missing prerequisites.
Impact: users can be marked eligible for skills whose required earlier skills are not actually completed.

### PB-104 — Fitness natural-goal IDs generated from Date.now() are unstable/collision-prone
Status: OPEN — DATA IDENTITY
Location: `apps/backend/src/modules/fitness/services/fitness-profile-persistence.service.ts` goal ID creation path.
Problem: parsed natural-goal IDs use `Date.now()`, so rapid same-millisecond writes can collide and repeated parse/persistence cycles do not have a durable identity strategy.
Impact: goal identity can be unstable or collide under rapid operations.

### PB-106 — E2E DB preparation uses `prisma db push` and can mask migration-chain drift
Status: OPEN — TEST/SCHEMA HIGH
Location: `apps/backend/test/prepare-e2e-db.cjs`, CI workflow migration steps.
Problem: CI can deploy migrations and then the E2E preparation script uses `prisma db push`, aligning the test database to the Prisma schema rather than requiring the migration chain to reproduce it.
Impact: migration-only tables, raw-SQL contracts and migration drift can be hidden by E2E setup, reducing confidence that tests reflect production schema history.

### PB-107 — E2E unauthenticated/high-risk endpoint coverage is incomplete
Status: OPEN — SECURITY TEST GAP
Locations: `apps/backend/test/api.e2e-spec.ts`, `app.e2e-spec.ts`, high-risk controllers such as Price Intelligence and Shopping Intelligence.
Problem: existing E2E coverage does not comprehensively assert that known write/collection endpoints reject anonymous access.
Impact: regressions in route guards can ship without a direct black-box test for the affected endpoints.

### PB-108 — Mobile typecheck-repair workflow can mutate source and push commits automatically
Status: OPEN — GOVERNANCE/REPRODUCIBILITY
Location: `.github/workflows/mypa-mobile-typecheck-repair-once.yml`.
Problem: workflow is designed to edit mobile source, commit and push changes with write permissions.
Impact: CI is no longer a pure verifier; source mutation from automation can bypass normal review/reproducibility expectations and complicate auditability.

### PB-109 — Duplicate Android build workflows
Status: OPEN — CI ARCHITECTURE
Locations: `.github/workflows/android-build.yml`, `.github/workflows/android-apk.yml`.
Problem: both workflows perform near-identical Android build responsibilities.
Impact: duplicated release/build logic can drift, waste CI, and produce inconsistent artifacts or status signals.

### PB-110 — ESLint static safety rules are weakened by broad any/unsafe warnings
Status: OPEN / DESIGN REVIEW
Location: `apps/backend/eslint.config.mjs`.
Problem: explicit-any is disabled and several unsafe rules are warning-level rather than blocking.
Impact: type/contract problems such as the Fitness constraint mismatch can survive static analysis and CI.

### PB-111 — Mobile onboarding is local-only and does not synchronize collected profile data to backend
Status: OPEN — DATA CONSISTENCY HIGH
Location: `apps/mobile/app/onboarding.tsx`, `apps/mobile/lib/onboarding.ts`.
Problem: onboarding gathers identity/profile/goal/diet/fitness/rhythm/equipment/permission values but finish persists them through AsyncStorage only; no backend profile/onboarding mutation is called in the inspected implementation.
Impact: user account state on the server can remain inconsistent with what the user just completed in onboarding.

### PB-112 — Mobile Brain execution/feedback endpoints do not match an exposed backend route in audited target
Status: OPEN — MOBILE/BACKEND CONTRACT HIGH
Locations: `apps/mobile/lib/brain-execution.ts`, `apps/mobile/app/brain-overview.tsx`, `apps/backend/src/modules/personal-brain/controllers/personal-brain.controller.ts`.
Problem: Mobile posts to `/personal-brain/decision/execute-next` and `/personal-brain/decision/feedback`, while source inspection of the backend controller did not find these endpoint paths.
Impact: Brain action buttons can fail at runtime because the client calls routes that are not part of the exposed controller contract.

### PB-113 — Brain Overview ignores app locale and hardcodes English UI
Status: OPEN — LOCALIZATION
Location: `apps/mobile/app/brain-overview.tsx`.
Impact: Persian mode does not produce consistent localization on this primary Brain screen even though app-level locale state exists.

### PB-114 — Mobile onboarding stored-state parser lacks runtime value/shape validation
Status: OPEN — DATA INTEGRITY
Location: `apps/mobile/lib/onboarding.ts` `getOnboardingState()`.
Problem: parsed AsyncStorage JSON is accepted largely based on a version check and spread into the state shape; there is no full runtime schema validation.
Impact: corrupted or stale local storage can become application state if the version still matches.

### PB-115 — Mobile localization and RTL handling are partial/inconsistent
Status: OPEN — UX/LOCALIZATION
Locations: `apps/mobile/lib/i18n.ts`, `app/language.tsx`, most screen files.
Problem: only a small translation dictionary exists; many screens hardcode English/mixed-language strings, and RTL activation does not establish a consistent global layout/direction strategy.
Impact: language switching can yield mixed-language UI and inconsistent RTL layout behavior.

### PB-116 — Daily screen generates smart notifications as a read-screen side effect
Status: OPEN — BEHAVIOR
Location: `apps/mobile/app/daily.tsx` data-loading path.
Problem: the Daily screen calls `generateSmartNotifications()` whenever its loader runs.
Impact: merely opening or refreshing a read-oriented screen can mutate the user's notification state, duplicate work and make debugging side effects difficult.

### PB-117 — Mobile Meal Builder derives dateKey in UTC and can assign meals to the wrong local day
Status: OPEN — TIMEZONE/DATA
Location: `apps/mobile/app/meal-builder.tsx` save path.
Problem: `dateKey` is generated from `new Date().toISOString().slice(0,10)` while the visible action is a local user operation.
Impact: meals logged near local midnight can be attached to the adjacent UTC date.

### PB-119 — Mobile Supplements mutations have no visible error handling or recovery state
Status: OPEN — UX/ROBUSTNESS
Location: `apps/mobile/app/supplements.tsx` `addSupplement()`, `take()`, `remove()`.
Problem: mutation calls are awaited without try/catch, user-facing error state, or retry path.
Impact: network/API failures can become unhandled rejections with no actionable feedback.

### PB-120 — Mobile Yoga camera mode is unconfigured and feeds no pose frames to analysis
Status: OPEN — FEATURE GAP HIGH
Locations: `apps/mobile/app/yoga.tsx`, `apps/mobile/lib/yoga-camera-bridge.ts`, backend `yoga` motion analysis.
Problem: the screen displays a live `CameraView`, but uses `UnconfiguredYogaCameraBridge` whose `isAvailable()` is false and `subscribe()` is a no-op; no frame is passed to `analyzeYogaPose()`.
Impact: the apparent live pose-coaching feature is camera preview only, not actual motion analysis.

### PB-121 — Mobile reminder edit displays time using English locale regardless of current locale
Status: OPEN — LOCALIZATION
Location: `apps/mobile/app/reminders.tsx` `openEdit()`.
Problem: `formatTime(item.scheduledAt, 'en')` is used even when the active app locale is Persian.
Impact: localized users can see an English-formatted edit value inconsistent with the rest of the screen.

### PB-122 — No Mobile offline cache or mutation queue found
Status: OPEN / ROADMAP GAP
Locations: `apps/mobile/lib/api.ts` and inspected domain API clients/screens; no `NetInfo` usage found.
Problem: clients are network-first and expose loading/error states but do not persist offline reads or queue mutations for replay.
Impact: connectivity loss can prevent core actions/data access rather than degrading gracefully.

### PB-123 — Duplicate EAS Android preview workflows
Status: OPEN — CI ARCHITECTURE
Locations: `.github/workflows/eas-android.yml`, `.github/workflows/eas-preview.yml`.
Problem: both workflows trigger substantially the same Expo/EAS Android preview build using different CLI invocation mechanisms.
Impact: duplicated build gates can drift and consume CI/build capacity unnecessarily.

### PB-124 — Command Center quick commands use hard-coded amounts/times independent of context
Status: OPEN / DESIGN REVIEW
Location: `apps/mobile/lib/command-actions.ts`, invoked by `command-center-v2.tsx`.
Problem: quick commands always log 500 ml water, a 20-min/100-kcal walk, a 45-min/300-kcal strength session, or a reminder at 20:00.
Impact: quick actions can contradict current user goals, locale/timezone, recent activity or configured preferences.

### PB-125 — Mobile automated test coverage is limited and lacks screen/integration E2E setup
Status: OPEN — TEST GAP
Locations: `apps/mobile/package.json`; inspected test tree with only small contract/unit specs such as `branding.spec.ts` and `notifications/notification-contract.spec.ts`.
Impact: navigation, screen behavior, backend integration, loading/error states and device-specific flows have little direct automated regression coverage.

### PB-126 — Mobile domain API clients duplicate authentication/request implementations
Status: OPEN — ARCHITECTURE/ROBUSTNESS
Locations: `apps/mobile/lib/api.ts`, `assistant-api.ts`, `calendar-api.ts`, `inventory-api.ts`, `recipe-api.ts`, `shopping-api.ts`, `shopping-basket-api.ts`, `price-api.ts`.
Problem: multiple clients implement their own fetch/auth/refresh semantics; `assistant-api.ts` notably does not refresh on 401 while the main client does.
Impact: identical user sessions can behave differently across screens and fixes to token handling must be replicated in many places.

### PB-127 — Expo Router typedRoutes is disabled
Status: OPEN — STATIC SAFETY
Location: `apps/mobile/app.json` `expo.experiments.typedRoutes`.
Problem: typed route generation is explicitly disabled.
Impact: route strings such as `/personal-brain/...`, `/meal/${id}` and similar navigation links are not compiler-verified, allowing stale paths to reach runtime.

## Next deterministic work

1. Finish remaining Mobile route/component/library inventory and full backend-to-mobile route consumer reconciliation.
2. Complete `deep-read/07-platform-tests.md` and `deep-read/08-mobile-deep-read.md` with explicit remaining gaps, then sync file index, checkpoints, contract matrix, feature matrix, review gaps and changelog.
3. Complete full repository-wide route/API, mobile feature, database reader/writer/transaction, security/privacy and historical reconciliation.
4. Record actual runtime/test/build execution only when executed; otherwise keep statuses at file-read or blocked.
5. Only after Master Prompt closure begin the separate correction phase using this issue catalog.
