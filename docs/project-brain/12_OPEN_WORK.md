# Open Work / Issue Catalog

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: baseline; complete Core source scope; complete Assistant TypeScript source/test scope; final Prisma schema; all 39 migration SQL files; complete enumerated Brain file-level scope; Food base module and active Recipe service/controller/data/scaling files started.
Scope not yet read: remaining Food/Nutrition/Meals/Recommendation/Budget files; Shopping; Life/Health; Fitness outside Brain integrations; Platform/Tests; Mobile; repository-wide route/consumer/database matrices; runtime validation; full security/privacy; historical docs/branches.
Evidence roots: `apps/backend/src/modules/`; `apps/backend/prisma/`; `docs/project-brain/`.
Confidence level: HIGH for issues below whose exact source locations are listed; MEDIUM for cross-module impact until remaining food/data/runtime consumers are reconciled.
Open questions: FoodItem nutrient units, RecipeStep/Media persistence contract, inventory unit semantics, country data completeness/ownership, nutrition targets and meal recommendation consumers.

## Issue catalog — evidence-backed

### PB-001 — Memory governance metadata is not persisted
Status: OPEN
Location: `apps/backend/src/modules/memory-intelligence/models/memory.model.ts`, `models/memory-governance.model.ts`, `repositories/prisma-memory.repository.ts`, `apps/backend/prisma/schema.prisma` (`UserFact`).
Problem: domain Memory has richer governance fields than durable UserFact persistence.
Impact: persisted memories cannot fully round-trip governance semantics.

### PB-002 — Brain memory integration does not satisfy required user-id contract
Status: OPEN
Location: `apps/backend/src/modules/brain-integration/services/brain-memory.service.ts`, Memory Intelligence service/repository.
Problem: retrieval delegation omits user identity required by the persistence layer.
Impact: runtime failure risk or incomplete user-scoped memory context.

### PB-003 — Personal Brain MemoryManager is placeholder-level
Status: OPEN
Location: `apps/backend/src/modules/personal-brain/services/memory-manager.service.ts`.
Impact: duplicate façade beside actual Memory Intelligence persistence.

### PB-004 — DecisionOutcome raw SQL runtime contract absent from final Prisma model
Status: OPEN
Location: `apps/backend/src/modules/personal-brain/services/decision-outcome-learning.service.ts`; migration history; `schema.prisma`.
Impact: schema/client/runtime drift.

### PB-005 — ConversationTurn raw SQL runtime contract absent from final Prisma model
Status: OPEN
Location: `apps/backend/src/modules/assistant/services/conversation-history.service.ts`; `20260812193000_add_conversation_turns`; `schema.prisma`.
Impact: hidden DB contract outside Prisma model graph.

### PB-006 — WorkoutPerformance raw SQL runtime contract absent from final Prisma model
Status: OPEN
Location: `apps/backend/src/modules/personal-brain/services/workout-performance-memory.service.ts`; workout-performance migration; `schema.prisma`.
Impact: fitness performance persistence drift.

### PB-007 — Other migration-only tables need reconciliation
Status: OPEN
Locations: `apps/backend/prisma/migrations/`, `schema.prisma`.
Examples: Price Intelligence tables, RecipeStep, RecipeMedia, legacy Life Execution compatibility tables.

### PB-008 — Notification intelligence can select unsupported channels
Status: OPEN
Locations: `notification-channel-intelligence.service.ts`, `notification-delivery-provider.service.ts`.
Impact: decision layer can recommend a channel that delivery cannot fulfill.

### PB-009 — Notification dedupe is process-local and approved decisions are not marked sent in observed controller path
Status: OPEN
Locations: `notification-deduplication.service.ts`, `personal-brain.controller.ts`.
Impact: restart/scale-out duplication risk and incomplete delivery lifecycle.

### PB-010 — Device disable endpoint lacks ownership check
Status: OPEN — SECURITY HIGH
Locations: `personal-brain.controller.ts` `POST coach/device/disable`; `notification-device-registry.service.ts`.
Impact: possible cross-user device disabling if another device ID is known.

### PB-011 — Multiple adaptive/decision/notification stores are process-local
Status: OPEN
Locations: notification feedback/device/queue/experiment/dedupe; decision idempotency/rate-limit/execution state/history; personalization engine.
Impact: lost state and inconsistent multi-instance behavior.

### PB-012 — Personal Brain controller bodies are frequently inline/any rather than validated DTOs
Status: OPEN
Locations: `personal-brain.controller.ts`, `decision-feedback.controller.ts`, `decision-execution.controller.ts`.
Impact: malformed inputs can reach decision/execution services.

### PB-013 — Coach cue explanation accepts empty/unbounded message semantics
Status: OPEN
Location: `personal-brain.controller.ts` + `coach-cue-engine.service.ts`.

### PB-014 — Workout implicit date can use UTC instead of user-local date
Status: OPEN
Location: `workout-action-adapter.ts`.

### PB-015 — Decision execution dependency graph is broader than semantic predecessors
Status: OPEN
Location: `decision-execution-planner.service.ts`.
Impact: unnecessary serialization/failure coupling.

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
Locations: `apps/backend/src/modules/decision-engine/services/decision-engine.service.ts` and related rule/scoring services.

### PB-021 — Adaptive Learning write path incomplete
Status: OPEN
Locations: `apps/backend/src/modules/adaptive-learning/`.

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
Problem: recipe creation multiplies `FoodItem.calories/protein/carbs/fat` directly by ingredient quantity, while the `FoodItem` persistence contract inspected so far does not expose a base quantity/unit field tying those nutrition values to a specific amount (for example per-100g, per-piece, or per-serving).
Impact: unless all stored FoodItem nutrition values are guaranteed to mean "per one unit of ingredient quantity", recipe totals can be materially wrong. The ambiguity also propagates into scaling, recommendation calorie/protein filters, inventory planning and meal plans.
Action later: define one authoritative nutrition basis for FoodItem and enforce ingredient-unit conversion before aggregation.

### PB-031 — Food Operating Loop and RecipeInventoryMatcher use incompatible inventory unit semantics
Status: OPEN — DATA INTEGRITY HIGH
Locations: `apps/backend/src/modules/recipes/services/food-operating-loop.service.ts`; `recipe-inventory-matcher.service.ts`.
Problem: `FoodOperatingLoopService` normalizes mass/volume/count units before comparing inventory; `RecipeInventoryMatcherService` compares raw numeric quantities directly without unit conversion.
Impact: the same recipe can produce different availability/missing-ingredient results depending on which endpoint is used (`/recipes/match` vs recommendation/food-plan path), e.g. 1 kg inventory vs 500 g recipe is not equivalent to the direct matcher comparison.
Action later: centralize unit normalization/comparison into one shared domain service.

### PB-032 — Package/unitless inventory cannot be meaningfully compared in FoodOperatingLoop
Status: OPEN
Location: `apps/backend/src/modules/recipes/services/food-operating-loop.service.ts` (`normalizeUnit`/`matchScaledIngredients`).
Problem: package/unitless units return null from the comparable-unit normalizer, so the algorithm falls back to treating the entire scaled quantity as missing even when inventory may contain the same food and same unit.
Impact: valid package-based ingredients can be falsely reported missing and added to shopping.
Action later: define package/count/unitless equivalence rules with explicit conversion metadata where possible.

### PB-033 — Recipe meal-plan endpoint assigns breakfast/lunch/dinner without consulting recipe meal types
Status: OPEN
Location: `apps/backend/src/modules/recipes/controllers/recipes.controller.ts` `GET /recipes/meal-plan`.
Problem: controller takes the top ranked recommendations and assigns them sequentially to breakfast, lunch and dinner; `RecipeContract` has a mealTypes field but this endpoint does not use it.
Impact: a dessert/snack/drink or dinner-only recipe can be placed into breakfast, producing semantically incorrect meal plans.
Action later: rank/filter by requested meal type, with fallback rules and explicit reasons.

### PB-034 — Country code input lacks explicit validation against supported set
Status: OPEN
Locations: `recipes.controller.ts`, `global-country-food.service.ts`.
Problem: endpoints accept arbitrary strings for `countryCode`; the service returns null/falls back for unknown values instead of rejecting invalid codes.
Impact: typo/invalid country codes silently disable localization/ranking rather than producing deterministic validation feedback.
Action later: validate ISO code format and supported set at the API boundary.

### PB-035 — Controller serving-count contract is looser than DTO/service contract
Status: OPEN
Locations: `recipes.controller.ts` `parseRequiredServings`; `create-recipe.dto.ts`; `recipes.service.ts`.
Problem: DTO and service bound servings to 1..10000, while controller parser only checks positive integer and does not enforce the 10000 maximum.
Impact: API layer and domain layer accept different ranges and return inconsistent validation behavior depending on entry path.
Action later: centralize shared serving validation.

### PB-036 — Recipe presentation reads migration-only RecipeStep with raw SQL
Status: OPEN
Location: `apps/backend/src/modules/recipes/services/recipe-presentation.service.ts`; RecipeStep migration; final Prisma schema.
Problem: `RecipeStep` is consumed directly through raw SQL and is absent from final Prisma model graph.
Impact: recipe instructions depend on hidden schema contract and cannot be safely managed through the same Prisma lifecycle as Recipe/RecipeIngredient.
Action later: reconcile RecipeStep persistence and lifecycle with recipe writes/versioning.

### PB-037 — Recipe create/update does not manage RecipeStep/RecipeMedia, leaving presentation completeness disconnected from recipe lifecycle
Status: OPEN
Locations: `recipes.service.ts`, `recipe-presentation.service.ts`, RecipeStep/RecipeMedia migrations.
Problem: recipe create/update persists recipe + ingredients only; presentation reads steps from a separate migration-created table and the controller exposes no step/media write path in this scope.
Impact: recipes can be created with zero instructions/media even though presentation supports those fields, producing structurally incomplete recipes.
Action later: define explicit recipe content authoring/import contract and transactionally manage steps/media/versioning.

## Next deterministic work

1. Continue BATCH-0005 through remaining Recipe services/specs/data, then Nutrition, Meals, Recommendation Intelligence and Budget Intelligence.
2. Freeze Food issue IDs after complete Food deep-read.
3. Update `deep-read/03-food.md`, `FEATURE_COMPLETENESS_MATRIX.md`, `CONTRACT_MATRIX.md`, `FILE_REVIEW_INDEX.md` after each closed Food sub-batch.
4. After all deep-read scopes, perform full route/API/mobile/database/security validation before correction phase.
