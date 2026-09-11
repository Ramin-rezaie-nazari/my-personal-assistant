# Open Work / Issue Catalog

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: baseline; complete Core source scope; complete Assistant TypeScript source/test scope; final Prisma schema; all 39 migration SQL files; complete enumerated Brain file-level scope; Food base, Recipe, Nutrition, Meals, Recommendation Intelligence and Budget Intelligence files read as enumerated so far.
Scope not yet read: remaining Food-adjacent scripts/import/data contracts not yet enumerated; Shopping; Life/Health; Fitness outside Brain integrations; Platform/Tests; Mobile; repository-wide route/consumer/database matrices; runtime validation; full security/privacy; historical docs/branches.
Evidence roots: `apps/backend/src/modules/`; `apps/backend/prisma/`; `docs/project-brain/`.
Confidence level: HIGH for issues below whose exact source locations are listed; MEDIUM for cross-module impact until remaining data/scripts/runtime consumers are reconciled.
Open questions: complete Food file inventory including scripts/media contracts, exact FoodItem nutrition basis, complete country dataset validation, price/cost data consumers.

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
Location: `apps/backend/src/modules/personal-brain/services/decision-outcome-learning.service.ts`; migration history; `schema.prisma`.

### PB-005 — ConversationTurn raw SQL runtime contract absent from final Prisma model
Status: OPEN
Location: `apps/backend/src/modules/assistant/services/conversation-history.service.ts`; `20260812193000_add_conversation_turns`; `schema.prisma`.

### PB-006 — WorkoutPerformance raw SQL runtime contract absent from final Prisma model
Status: OPEN
Location: `apps/backend/src/modules/personal-brain/services/workout-performance-memory.service.ts`; workout-performance migration; `schema.prisma`.

### PB-007 — Other migration-only tables need reconciliation
Status: OPEN
Locations: `apps/backend/prisma/migrations/`, `schema.prisma`.
Examples: Price Intelligence, RecipeStep, RecipeMedia, legacy Life Execution tables.

### PB-008 — Notification intelligence can select unsupported channels
Status: OPEN
Locations: `notification-channel-intelligence.service.ts`, `notification-delivery-provider.service.ts`.

### PB-009 — Notification dedupe is process-local and approved decisions are not marked sent in observed controller path
Status: OPEN
Locations: `notification-deduplication.service.ts`, `personal-brain.controller.ts`.

### PB-010 — Device disable endpoint lacks ownership check
Status: OPEN — SECURITY HIGH
Locations: `personal-brain.controller.ts` `POST coach/device/disable`; `notification-device-registry.service.ts`.

### PB-011 — Multiple adaptive/decision/notification stores are process-local
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
Locations: `apps/backend/src/modules/recipes/services/recipes.service.ts`; `apps/backend/src/modules/foods/services/foods.service.ts`; `apps/backend/prisma/schema.prisma` (`FoodItem`).
Problem: recipe creation multiplies FoodItem nutrition directly by ingredient quantity without a stored base quantity/unit contract.
Impact: recipe totals can be materially wrong when FoodItem values are per-100g/per-serving rather than per one ingredient quantity.

### PB-031 — Food Operating Loop and RecipeInventoryMatcher use incompatible inventory unit semantics
Status: OPEN — DATA INTEGRITY HIGH
Locations: `food-operating-loop.service.ts`; `recipe-inventory-matcher.service.ts`.
Impact: different endpoints can disagree on inventory coverage/missing quantities.

### PB-032 — Package/unitless inventory cannot be meaningfully compared in FoodOperatingLoop
Status: OPEN
Location: `food-operating-loop.service.ts` (`normalizeUnit`).
Impact: valid package-based ingredients may be falsely reported missing.

### PB-033 — Recipe meal-plan endpoint assigns breakfast/lunch/dinner without consulting recipe meal types
Status: OPEN
Location: `recipes.controller.ts` `GET /recipes/meal-plan`.
Impact: snack/dessert/drink/dinner-only recipes can be assigned to breakfast etc.

### PB-034 — Country code input lacks explicit validation against supported set
Status: OPEN
Locations: `recipes.controller.ts`, `global-country-food.service.ts`.
Impact: invalid codes silently disable localization/ranking rather than failing validation.

### PB-035 — Controller serving-count contract is looser than DTO/service contract
Status: OPEN
Locations: `recipes.controller.ts` `parseRequiredServings`; `create-recipe.dto.ts`; `recipes.service.ts`.
Impact: different request paths enforce different serving ranges.

### PB-036 — Recipe presentation reads migration-only RecipeStep with raw SQL
Status: OPEN
Location: `recipe-presentation.service.ts`; RecipeStep migration; final Prisma schema.

### PB-037 — Recipe create/update does not manage RecipeStep/RecipeMedia
Status: OPEN
Locations: `recipes.service.ts`, `recipe-presentation.service.ts`, RecipeStep/RecipeMedia migrations.
Impact: content completeness has no coupled authoring/version lifecycle.

### PB-038 — Meal nutrition calculations repeat the same undefined FoodItem base-unit assumption
Status: OPEN — DATA INTEGRITY HIGH
Locations: `apps/backend/src/modules/meals/services/meals.service.ts`; `apps/backend/prisma/schema.prisma` (`FoodItem`, `MealItem`).
Problem: Meal creation multiplies FoodItem nutrition by bare quantity, while `CreateMealItemDto` contains no unit and FoodItem exposes no explicit nutrition basis in the inspected contract.
Impact: meal totals can differ from intended real-world quantities and from Recipe nutrition semantics; the same quantity can be interpreted differently across domains.
Action later: share one nutrition/unit domain model between Recipe, Meal and NutritionLog ingestion.

### PB-039 — Budget MealPlanningService ignores countryCode and inventory/cuisine constraints
Status: OPEN
Location: `apps/backend/src/modules/budget-intelligence/services/meal-planning.service.ts`.
Problem: method accepts `countryCode` but only echoes it; ranking uses calories/protein distance and verification, with no country ranking, inventory coverage, dietary constraints or meal-type suitability.
Impact: country-aware/budget-aware naming overstates actual recommendation behavior and can produce impractical plans.
Action later: define explicit constraints and reuse Recipe/Food recommendation ranking instead of a parallel heuristic.

### PB-040 — Recommendation Intelligence is placeholder-level and not connected to Recipe recommendation flow
Status: OPEN
Locations: `apps/backend/src/modules/recommendation-intelligence/services/recommendation-engine.service.ts`, `recommendation-ranking.service.ts`, `personalization.service.ts`; `recipes/services/food-operating-loop.service.ts`.
Problem: the Recommendation Intelligence services return empty/minimal placeholder results, while actual recipe recommendations are implemented inside FoodOperatingLoopService.
Impact: duplicated ownership and misleading module boundary; future clients may call the wrong service and receive empty recommendations.
Action later: designate one canonical recommendation engine and route Recipe/Food consumers through it.

### PB-041 — Budget Intelligence top-level plan/cost services are placeholders
Status: OPEN
Locations: `apps/backend/src/modules/budget-intelligence/services/budget-intelligence.service.ts`, `food-cost.service.ts`.
Problem: both return fixed placeholder messages without budget/cost computation or persistence.
Impact: budget intelligence is not functionally implemented despite the module being exported and callable.
Action later: implement cost inputs, currency/base-price semantics, budget constraints and persistence or remove unused façade.

### PB-042 — Budget plan endpoint is public while its body DTO is unused and unvalidated
Status: OPEN — SECURITY / API CONTRACT
Locations: `apps/backend/src/modules/budget-intelligence/controllers/budget-intelligence.controller.ts`, `dto/create-budget-plan.dto.ts`.
Problem: `GET /budget-intelligence` calls a plan-creation placeholder without authentication and without using the provided `CreateBudgetPlanDto` (which itself has no validation decorators).
Impact: public endpoint suggests user-specific budget functionality that is neither authenticated nor actually parameterized.
Action later: align endpoint method/auth/body with the actual budget contract.

### PB-043 — Nutrition and Meals default dateKey uses UTC calendar date without user-timezone context
Status: OPEN — TIMEZONE HIGH
Locations: `apps/backend/src/modules/nutrition/services/nutrition.service.ts`, `apps/backend/src/modules/meals/services/meals.service.ts`.
Problem: absent `dateKey` defaults to `new Date().toISOString().slice(0,10)`; Meal also derives default dateKey from `eatenAt.slice(0,10)`. Neither path threads an authenticated user timezone.
Impact: near-midnight events can be written into the wrong user's calendar day and diverge from local-day Brain/DailyLog expectations.
Action later: introduce one shared timezone-aware date-key service.

### PB-044 — Multiple meal-planning/recommendation implementations can diverge
Status: OPEN / DESIGN REVIEW
Locations: `recipes/controllers/recipes.controller.ts` (`mealPlan`), `budget-intelligence/services/meal-planning.service.ts`, `recipes/services/food-operating-loop.service.ts`, `recommendation-intelligence/services/*`.
Problem: four conceptual layers can generate meal/recommendation outputs with different ranking, inventory, country, and nutrition semantics.
Impact: identical user inputs can produce different plans depending on endpoint/module.
Action later: establish one canonical recommendation/meal-planning pipeline and expose module-specific adapters around it.

## Next deterministic work

1. Finish remaining Food-adjacent files/scripts/data/test inventory and create `deep-read/03-food.md` with exact evidence.
2. Update support matrices for Food contracts and all discovered issues.
3. Continue Shopping, then Life/Health, Fitness, Platform/Tests and Mobile.
4. After all deep-read scopes, complete route/API/mobile/database reader-writer/transaction mapping, runtime validation, security/privacy and historical reconciliation.
5. Only after Master Prompt closure begin the separate repair phase using this issue catalog.
