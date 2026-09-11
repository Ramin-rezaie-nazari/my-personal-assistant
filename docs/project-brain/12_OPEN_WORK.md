# Open Work / Issue Catalog

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: baseline; Core; complete Prisma schema + all 39 migration SQL; Assistant; complete Brain file-level scope; Food/Recipe/Nutrition/Meals/Recommendation/Budget; Shopping base; Inventory; Shopping Intelligence production/test scope covered by the enumerated current-main tree; Price Intelligence production/model/controller/DTO/test scope covered so far.
Scope not yet read: remaining Price/Shopping media/import/support files not yet enumerated; Life/Health; Fitness outside Brain integrations; Platform/Tests; Mobile; repository-wide route/consumer/database matrices; runtime validation; full security/privacy; historical docs/branches.
Evidence roots: `apps/backend/src/modules/`; `apps/backend/prisma/`; `apps/backend/scripts/`; `docs/project-brain/`.
Confidence level: HIGH for issues below whose exact source location is listed; MEDIUM for cross-module impact until all consumers and runtime behavior are reconciled.
Open questions: exact deployed DB drift; remaining support/test files; complete mobile consumers; runtime execution.

## Issue catalog — evidence-backed

### PB-001 — Memory governance metadata is not persisted
Status: OPEN
Location: `apps/backend/src/modules/memory-intelligence/models/memory.model.ts`, `models/memory-governance.model.ts`, `repositories/prisma-memory.repository.ts`, `apps/backend/prisma/schema.prisma` (`UserFact`).
Impact: persisted memories cannot fully round-trip governance semantics.

### PB-002 — Brain memory integration does not satisfy required user-id contract
Status: OPEN
Location: `apps/backend/src/modules/brain-integration/services/brain-memory.service.ts`, Memory Intelligence service/repository.
Impact: runtime failure risk or incomplete user-scoped memory context.

### PB-003 — Personal Brain MemoryManager is placeholder-level
Status: OPEN
Location: `apps/backend/src/modules/personal-brain/services/memory-manager.service.ts`.

### PB-004 — DecisionOutcome raw SQL runtime contract absent from final Prisma model
Status: OPEN
Location: `apps/backend/src/modules/personal-brain/services/decision-outcome-learning.service.ts`; decision-outcome migration history; `apps/backend/prisma/schema.prisma`.
Impact: schema/client/runtime drift.

### PB-005 — ConversationTurn raw SQL runtime contract absent from final Prisma model
Status: OPEN
Location: `apps/backend/src/modules/assistant/services/conversation-history.service.ts`; migration `20260812193000_add_conversation_turns`; `schema.prisma`.
Impact: hidden conversation persistence contract outside Prisma graph.

### PB-006 — WorkoutPerformance raw SQL runtime contract absent from final Prisma model
Status: OPEN
Location: `apps/backend/src/modules/personal-brain/services/workout-performance-memory.service.ts`; workout-performance migration; `schema.prisma`.

### PB-007 — Other migration-only tables need reconciliation
Status: OPEN
Locations: `apps/backend/prisma/migrations/`, `schema.prisma`.
Examples: Price Intelligence tables, RecipeStep, RecipeMedia, legacy Life Execution `TaskDependency`/`TaskEvent`.

### PB-008 — Notification intelligence can select unsupported channels
Status: OPEN
Locations: `apps/backend/src/modules/personal-brain/services/notification-channel-intelligence.service.ts`, `notification-delivery-provider.service.ts`.

### PB-009 — Notification dedupe is process-local and approved decisions are not marked sent in observed controller path
Status: OPEN
Locations: `personal-brain/services/notification-deduplication.service.ts`, `personal-brain/controllers/personal-brain.controller.ts`.

### PB-010 — Device disable endpoint lacks ownership check
Status: OPEN — SECURITY HIGH
Locations: `personal-brain.controller.ts` `POST coach/device/disable`; `notification-device-registry.service.ts`.

### PB-011 — Multiple adaptive/decision/notification state stores are process-local
Status: OPEN
Locations: notification feedback/device/queue/experiment/dedupe; decision idempotency/rate-limit/execution state/history; personalization engine.

### PB-012 — Personal Brain controller bodies are frequently inline/any rather than validated DTOs
Status: OPEN
Locations: `personal-brain.controller.ts`, `decision-feedback.controller.ts`, `decision-execution.controller.ts`.

### PB-013 — Coach cue explanation accepts empty/unbounded message semantics
Status: OPEN
Location: `personal-brain.controller.ts` + `coach-cue-engine.service.ts`.

### PB-014 — Workout implicit date can use UTC instead of user-local date
Status: OPEN
Location: `workout-action-adapter.ts`.

### PB-015 — Decision execution dependency graph is broader than semantic predecessors
Status: OPEN
Location: `decision-execution-planner.service.ts`.

### PB-016 — Adaptive/scheduling/scenario behavior is strongly rule-based despite broader adaptive naming
Status: OPEN / DESIGN REVIEW
Locations: schedule/scenario/adaptive decision services.

### PB-017 — UserUnderstanding/IntentionAnalysis placeholders
Status: OPEN
Locations: `user-understanding.service.ts`, `intention-analysis.service.ts`.

### PB-018 — Goal Intelligence placeholders
Status: OPEN
Locations: `apps/backend/src/modules/goal-intelligence/services/*`, controller/DTO.

### PB-019 — Brain Integration context is thin placeholder
Status: OPEN
Location: `apps/backend/src/modules/brain-integration/services/brain-context.service.ts`.

### PB-020 — Decision Engine top-level service is placeholder-level while logic is split
Status: OPEN
Locations: `apps/backend/src/modules/decision-engine/services/decision-engine.service.ts` and related services.

### PB-021 — Adaptive Learning write path incomplete
Status: OPEN
Location: `apps/backend/src/modules/adaptive-learning/`.

### PB-022 — Duplicate incompatible NotificationChannel contracts
Status: OPEN
Locations: notification channel intelligence/provider.

### PB-023 — Proactive event -> delivery lifecycle incomplete
Status: OPEN
Locations: proactive event/dedupe/delivery services.

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

### PB-030 — Recipe nutrition totals assume FoodItem nutrition unit semantics without an explicit base-quantity contract
Status: OPEN — DATA INTEGRITY HIGH
Locations: `recipes.service.ts`, `foods.service.ts`, Prisma `FoodItem`.

### PB-031 — Food Operating Loop and RecipeInventoryMatcher use incompatible inventory unit semantics
Status: OPEN — DATA INTEGRITY HIGH
Locations: `food-operating-loop.service.ts`, `recipe-inventory-matcher.service.ts`.

### PB-032 — Package/unitless inventory cannot be meaningfully compared in FoodOperatingLoop
Status: OPEN
Location: `food-operating-loop.service.ts`.

### PB-033 — Recipe meal-plan endpoint ignores RecipeContract mealTypes
Status: OPEN
Location: `recipes.controller.ts` `GET /recipes/meal-plan`.

### PB-034 — Country code input lacks explicit validation against supported set
Status: OPEN
Locations: `recipes.controller.ts`, `global-country-food.service.ts`.

### PB-035 — Controller serving-count contract is looser than DTO/service contract
Status: OPEN
Locations: `recipes.controller.ts`, `create-recipe.dto.ts`, `recipes.service.ts`.

### PB-036 — Recipe presentation reads migration-only RecipeStep with raw SQL
Status: OPEN
Location: `recipe-presentation.service.ts`; RecipeStep migration; `schema.prisma`.

### PB-037 — Recipe create/update does not manage RecipeStep/RecipeMedia
Status: OPEN
Locations: `recipes.service.ts`, `recipe-presentation.service.ts` + migrations.

### PB-038 — Meal nutrition repeats undefined FoodItem base-unit assumption
Status: OPEN — DATA INTEGRITY HIGH
Locations: `meals.service.ts`, Prisma `FoodItem`/`MealItem`.

### PB-039 — Budget MealPlanningService ignores countryCode and inventory/cuisine constraints
Status: OPEN
Location: `budget-intelligence/services/meal-planning.service.ts`.

### PB-040 — Recommendation Intelligence is placeholder-level and disconnected from Recipe recommendation flow
Status: OPEN
Locations: `recommendation-intelligence/services/*`; `recipes/services/food-operating-loop.service.ts`.

### PB-041 — Budget Intelligence top-level plan/cost services are placeholders
Status: OPEN
Locations: `budget-intelligence/services/budget-intelligence.service.ts`, `food-cost.service.ts`.

### PB-042 — Budget plan endpoint is public while its DTO is unused/unvalidated
Status: OPEN — SECURITY/API CONTRACT
Locations: `budget-intelligence/controllers/budget-intelligence.controller.ts`, `dto/create-budget-plan.dto.ts`.

### PB-043 — Nutrition and Meals default dateKey uses UTC calendar date without user-timezone context
Status: OPEN — TIMEZONE HIGH
Locations: `nutrition.service.ts`, `meals.service.ts`.

### PB-044 — Multiple meal-planning/recommendation implementations can diverge
Status: OPEN / DESIGN REVIEW
Locations: `recipes/controllers/recipes.controller.ts`, `budget-intelligence/services/meal-planning.service.ts`, `recipes/services/food-operating-loop.service.ts`, `recommendation-intelligence/services/*`.

### PB-045 — Recipe nutrition estimate script operates on a separate Supabase/legacy schema contract
Status: OPEN — DATA INTEGRITY HIGH
Location: `apps/backend/scripts/recipe-nutrition-estimate.mjs`.
Problem: script reads/writes `recipes`, `recipe_source_raw`, `recipe_intelligence_profiles` and nutrient-evidence columns outside the Prisma Recipe/RecipeIngredient lifecycle.
Impact: nutrition evidence can be updated outside canonical recipe transactions; source of truth and synchronization are unclear.
Action later: reconcile with canonical schema or document as explicit ETL pipeline with ownership/sync guarantees.

### PB-046 — Budget MealPlanningService ignores targetServings in recommendation math
Status: OPEN
Location: `apps/backend/src/modules/budget-intelligence/services/meal-planning.service.ts`.
Problem: targetServings is accepted/returned but recipe selection remains per-serving and does not alter nutrition/cost/inventory implications.
Impact: different requested batch sizes can produce identical selection without batch-aware planning.

### PB-047 — Meal-created DailyLog nutrition and NutritionService summary use different source sets
Status: OPEN — DATA CONSISTENCY HIGH
Locations: `meals/services/meals.service.ts`, `nutrition/services/nutrition.service.ts`, Prisma `DailyLog`/`Meal`/`NutritionLog`.
Problem: Meal creation updates DailyLog calories/protein, while Nutrition summary derives carbs/fat/entry count from NutritionLog and does not include Meal rows.
Impact: daily nutrition views can disagree internally.

### PB-048 — Meal and NutritionLog ingestion have no cross-source deduplication contract
Status: OPEN — DATA CONSISTENCY HIGH
Locations: `meals/services/meals.service.ts`, `nutrition/services/nutrition.service.ts`.
Problem: both paths can record the same real-world consumption and update DailyLog independently without a shared event identity.
Impact: clients logging both can double-count calories/protein.

### PB-049 — Shopping addToBasket does not validate FoodItem ownership/visibility
Status: OPEN — SECURITY/DATA HIGH
Location: `apps/backend/src/modules/shopping/shopping.service.ts` `addToBasket()`.
Problem: it uses `foodItem.findUnique({id})` rather than the global-or-current-user visibility rule used by Inventory/Foods.
Impact: a caller with another user's private FoodItem ID can potentially reference that food in their ShoppingItem.

### PB-050 — Shopping Intelligence top-level service is placeholder-level
Status: OPEN
Locations: `shopping-intelligence/services/shopping-intelligence.service.ts`, `shopping-list.service.ts`, `purchase-analysis.service.ts`.
Impact: public module façade returns static placeholder behavior while specialized services implement separate local logic.

### PB-051 — Household consumption learning is process-local and not user/household scoped
Status: OPEN — DATA ISOLATION HIGH
Location: `shopping-intelligence/services/household-consumption-learning.service.ts`.
Problem: history Map is keyed only by productKey and events have no user/household ID.
Impact: restart loses data and multiple users can contaminate one another's consumption forecast.

### PB-052 — Inventory forecast assumes quantities share a common unit without conversion
Status: OPEN — DATA INTEGRITY HIGH
Location: `shopping-intelligence/services/household-inventory-intelligence.service.ts`.
Problem: forecast math treats quantity/dailyConsumption as directly comparable numbers while unit is metadata only.
Impact: e.g. kg vs g can create 1000x forecast errors.

### PB-053 — Household purchase planner conflates safetyStock with purchase quantity
Status: OPEN / DESIGN REVIEW
Location: `shopping-intelligence/services/household-purchase-planner.service.ts`.
Problem: for critical items, `purchaseQuantity = min(recommendedQuantity, safetyStock)`.
Impact: critical reorders can be systematically under-purchased.

### PB-054 — Shopping controller write bodies have no DTO validation
Status: OPEN
Location: `shopping/shopping.controller.ts` (`POST basket`, `POST from-recipe`).
Impact: quantity/unit/IDs rely on service checks with incomplete validation.

### PB-055 — Inventory adjustment body is a bare numeric parameter without finite-number validation
Status: OPEN
Location: `inventory/inventory.controller.ts` `PATCH /inventory/:id` and `inventory.service.ts` `adjust()`.
Impact: malformed numeric values can reach persistence because no DTO enforces finite non-negative numbers.

### PB-056 — Shopping Intelligence controller is unguarded and uses placeholder service
Status: OPEN
Location: `shopping-intelligence/controllers/shopping-intelligence.controller.ts`.
Impact: public endpoint has no user context and returns placeholder output.

### PB-057 — Price Intelligence controller is entirely unguarded, including write/collection endpoints
Status: OPEN — SECURITY CRITICAL
Location: `price-intelligence/controllers/price-intelligence.controller.ts`.
Problem: no JWT guard; `POST /price-intelligence/nightly/run` can trigger external collection and raw database writes.
Impact: unauthenticated callers can cause external requests and database activity; internal orchestration surface is publicly reachable.
Action later: require auth/authorization and separate internal scheduler execution from public reads.

### PB-058 — HTTP price normalization forces every non-IRR currency to IRT
Status: OPEN — DATA INTEGRITY CRITICAL
Location: `price-intelligence/services/http-price-source.adapter.ts` `normalize()`.
Problem: output always sets `currency: 'IRT'`; only IRR amounts are divided by 10, with no conversion for USD/EUR/etc.
Impact: cross-currency prices can be mislabeled and compared as tomans.

### PB-059 — Price analysis aggregates across currency/unit/package/source without compatibility filtering
Status: OPEN — DATA INTEGRITY HIGH
Locations: `price-intelligence/services/price-intelligence.service.ts` `analyze()`, `price-persistence.service.ts` `history()`.
Impact: incompatible price observations can be averaged into a false market price.

### PB-060 — Price analysis/history has duplicate service ownership
Status: OPEN / ARCHITECTURE
Locations: `price-analysis.service.ts`, `price-history.service.ts`, `price-history-store.service.ts`, `price-intelligence.service.ts`, `market-analysis.service.ts`.
Impact: placeholder and active implementations can diverge; canonical ownership is unclear.

### PB-061 — Price Intelligence keeps process-local history alongside durable PriceSnapshot
Status: OPEN
Locations: `price-history-store.service.ts`, `price-persistence.service.ts`.
Impact: analytics histories can diverge or disappear on restart.

### PB-062 — Price collection scheduling timezone is duplicated/hard-coded
Status: OPEN
Locations: `price-collection-scheduler.service.ts`, `nightly-market-intelligence.service.ts`, `automatic-price-scheduler.service.ts`.
Impact: independent timezone defaults/policies can drift.

### PB-063 — Nightly collection attempts counter has off-by-one reporting risk
Status: DESIGN/VALIDATION REVIEW
Location: `nightly-market-intelligence.service.ts` retry loop.
Impact: persisted `attempts` can exceed actual executed attempts after natural loop termination.

### PB-064 — Price source registry lacks source health/capability/trust contract
Status: OPEN / DESIGN
Location: `price-source-registry.service.ts`.
Problem: nine sources are statically enabled with URL templates and adapter IDs but no parser version, currency/unit support, freshness, failure health or trust score.
Impact: stale/broken/incompatible sources are not distinguished in downstream analysis.

### PB-065 — Product matching does not explicitly penalize package-size variants
Status: OPEN / DESIGN REVIEW
Location: `price-intelligence/services/product-matching.service.ts`.
Problem: title/brand can raise confidence even when quantity differs materially; quantity scoring only rewards near-exact same-unit size.
Impact: 500g vs 1kg variants can still look like strong matches without a package mismatch penalty.

### PB-066 — Shopping from-recipe path does not ownership-scope the recipe
Status: OPEN — SECURITY/DATA HIGH
Location: `apps/backend/src/modules/shopping/shopping.service.ts` `addRecipeMissing()`.
Problem: recipe is loaded by ID only, not by `(id, userId/global visibility)`, before its ingredient food IDs are accepted.
Impact: users may be able to derive shopping entries from another user's private recipe if they know its ID.

### PB-067 — Household consumption learning has no unit identity
Status: OPEN — DATA INTEGRITY HIGH
Location: `apps/backend/src/modules/shopping-intelligence/services/household-consumption-learning.service.ts`.
Problem: `ConsumptionEvent` contains quantity but no unit; learned dailyRate therefore has no dimensional meaning.
Impact: forecast can be consumed by Inventory/Reorder code as if it were in the inventory unit even when source events used a different unit.

### PB-068 — Smart purchase basket can mix currencies and apply one budget numerically
Status: OPEN — DATA INTEGRITY HIGH
Location: `apps/backend/src/modules/shopping-intelligence/services/smart-purchase-basket.service.ts`.
Problem: currency is taken from the first candidate and totals are simple numeric multiplication; candidate currencies are not required to match.
Impact: a basket containing USD and IRR prices can be treated as one numeric currency and judged against the wrong budget.

### PB-069 — PurchasePlanService does not enforce item currency == budget currency
Status: OPEN — DATA INTEGRITY HIGH
Location: `apps/backend/src/modules/shopping-intelligence/services/purchase-plan.service.ts`.
Problem: `PurchasePlanInput.currency` is never compared against each `PurchasePlanItem.currency` before spending arithmetic.
Impact: mixed-currency items can enter a single budget selection algorithm.

### PB-070 — Shopping base module has no direct automated service test
Status: OPEN — TEST GAP
Location: `apps/backend/src/modules/shopping/`.
Problem: directory contains `shopping.controller.ts`, `shopping.module.ts`, `shopping.service.ts` but no `*.spec.ts`.
Impact: ownership, recipe-source, basket increment and completion behavior are not directly regression-tested.

### PB-071 — Price Intelligence controller lacks a direct controller test
Status: OPEN — TEST GAP
Location: `apps/backend/src/modules/price-intelligence/controllers/price-intelligence.controller.ts`.
Impact: auth absence, body handling and internal collection exposure are not covered at controller level.

### PB-072 — Automatic price scheduler lacks a direct service test
Status: OPEN — TEST GAP
Location: `apps/backend/src/modules/price-intelligence/services/automatic-price-scheduler.service.ts`.
Impact: timezone/next-occurrence, bootstrap catch-up and timer lifecycle are not directly regression-tested.

## Next deterministic work

1. Finish remaining Shopping/Price file inventory and close BATCH-0005.
2. Update `docs/project-brain/deep-read/04-shopping.md`, `FILE_REVIEW_INDEX.md`, `CONTRACT_MATRIX.md`, `FEATURE_COMPLETENESS_MATRIX.md`, checkpoints and changelog.
3. Start Life/Health/Calendar/Daily/Goals/Habits/Life-Execution/Life-Tasks/Reminders/Notifications/Supplements/Health deep-read.
4. Continue Fitness, Platform/Tests/Scripts/CI and Mobile.
5. Complete repository-wide route/API/mobile/database reader-writer/transaction mapping, runtime validation, security/privacy and historical reconciliation.
6. Only after Master Prompt closure begin the separate repair phase using this catalog as the repair queue.
