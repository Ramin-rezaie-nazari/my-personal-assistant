# Recipe and Food System

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: complete identified `foods` module source/test files; complete identified `recipes` module source/controller/DTO/data/service/test files; complete identified `nutrition` module source/controller/DTO/service/test plus `recipe-intelligence` source/test files; complete identified `meals` module source/controller/DTO/service/test files; complete identified `recommendation-intelligence` module source/controller/DTO/service files; complete identified `budget-intelligence` module/data/controller/DTO/service/test files; relevant `apps/backend/scripts/recipe-nutrition-estimate.mjs`.
Scope not yet read: image/media/import scripts beyond the identified nutrition-estimate script; repository-wide consumers of these modules; full route/mobile/DB reader-writer mapping; runtime test execution.
Evidence roots: `apps/backend/src/modules/foods/`; `apps/backend/src/modules/recipes/`; `apps/backend/src/modules/nutrition/`; `apps/backend/src/modules/meals/`; `apps/backend/src/modules/recommendation-intelligence/`; `apps/backend/src/modules/budget-intelligence/`; `apps/backend/scripts/recipe-nutrition-estimate.mjs`; `apps/backend/prisma/`.
Confidence level: HIGH for the file-level code behavior documented here; MEDIUM for end-to-end semantics because runtime execution and repository-wide consumers are not yet validated.
Open questions: authoritative FoodItem nutrient basis; canonical unit-conversion system; actual deployed RecipeStep/RecipeMedia/price-intelligence structures; country-data maintenance and governance; downstream mobile contract.

## Foods

`FoodsController` is JWT guarded and user-scopes listing and creation. `CreateFoodDto` validates name and non-negative nutrition fields, and `FoodsService` protects global/user ownership and rejects blank values. Food creation produces user-owned, unverified entries. Evidence: `apps/backend/src/modules/foods/controllers/foods.controller.ts`, `dto/create-food.dto.ts`, `services/foods.service.ts`, `services/foods.service.spec.ts`.

## Recipes

`RecipesService` creates/updates/deletes recipes with ingredient ownership checks inside Prisma transactions. Recipe totals are calculated by multiplying FoodItem nutrition fields by raw ingredient quantity. Recipe ingredients carry measurement/scaling metadata and `getScaledRecipe` delegates all serving math to the shared Recipe Intelligence scaler.

`RecipesController` exposes create/list/local/countries/match/recommendations/meal-plan/food-plan/get/scaled/update/delete surfaces. It manually parses servings and numeric filters for query endpoints; `create-recipe.dto.ts` and service enforce stronger serving constraints. The meal-plan endpoint assigns the top three recommendations to breakfast/lunch/dinner without checking recipe mealTypes.

`RecipePresentationService` combines Prisma Recipe/RecipeIngredient data with raw-SQL `RecipeStep` rows. This proves the migration-only `RecipeStep` contract is a live presentation dependency. Recipe create/update in `RecipesService` does not manage steps or media, leaving content authoring disconnected from presentation completeness.

Country food guidance is supplied by a static 195-country profile map with cuisine family, staple ingredients, signature recipes, common units and hard-to-source ingredients. The profile explicitly describes itself as cultural routing rather than an exhaustive cuisine model. Country ranking is deterministic and gives signature recipe and cuisine-family bonuses. Evidence: `recipes/data/global-country-food-profiles.ts`, `global-country-food.service.ts` and spec.

### Recipe Intelligence / serving scaling

`recipe-domain.types.ts` defines provider-agnostic RecipeContract, meal types, dietary tags, ingredient roles, scaling policies and nutrition contracts. `scaleRecipe` supports linear/sublinear/fixed/per-batch/manual-review ingredient policies, manual-review thresholds and kitchen-friendly rounding. Nutrition for the target serving count is intentionally scaled linearly from `nutritionPerServing`; the scaler itself is deterministic and tested.

## Meals

`MealsService` user-scopes reads and atomically creates `Meal`, `MealItem` and updates date-aware `DailyLog`. It validates labels, date-time strings, positive item quantities and global/user food ownership. Meal nutrition is again computed as FoodItem nutrition × raw quantity, with no unit attached to MealItem itself. This shares the same unresolved FoodItem base-unit assumption as Recipe nutrition.

## Nutrition

`NutritionService` supports date-aware logs and daily summaries. Log creation atomically creates NutritionLog and increments DailyLog calories/protein. The service validates YYYY-MM-DD and calendar validity. When dateKey is omitted it uses the UTC ISO date, not an explicit user timezone.

## Recommendation Intelligence

The module is structurally present and exported, but its concrete services are placeholder-level: `RecommendationEngineService` returns an empty recommendations array, `RecommendationRankingService` returns an empty ranked array, and `PersonalizationService` returns `{ personalized: true }`. There is an empty controller and a non-validated DTO. Actual recipe recommendation behavior currently lives in `FoodOperatingLoopService`, creating duplicated conceptual ownership.

## Budget Intelligence

`BudgetIntelligenceService` and `FoodCostService` are placeholder-level. `MealPlanningService` is functional but deterministic: it loads all global/user recipes, divides daily nutrition targets by three, scores by calorie/protein distance and verification, and assigns the top distinct candidates to breakfast/lunch/dinner. It accepts `countryCode` but only echoes it; it does not use country food profiles, inventory, dietary constraints or mealTypes. Country finance mapping is static for a 195-country set and provides currency/fraction digits plus policy metadata; it does not itself retrieve prices or FX rates.

`BudgetIntelligenceController` exposes `GET /budget-intelligence` publicly even though the injected `CreateBudgetPlanDto` is not used by that endpoint; `GET /budget-intelligence/meal-plan` is JWT guarded and parses servings manually.

## Related script / migration contracts

`apps/backend/scripts/recipe-nutrition-estimate.mjs` performs an independent heuristic nutrition estimate from raw ingredient strings using an embedded food table and unit parser, then PATCHes `recipe_intelligence_profiles.evidence` through Supabase REST. It expects separate tables/columns (`recipes`, `recipe_source_raw`, `recipe_intelligence_profiles`, `kcal_per_serving`, etc.) and a service-role key. This is a separate persistence contract from the Prisma Recipe/RecipeIngredient model inspected in this audit and must be reconciled before being treated as an authoritative recipe nutrition pipeline.

## Evidence-backed open issues from this scope

See `docs/project-brain/12_OPEN_WORK.md`:
- PB-030: undefined FoodItem nutrition base quantity/unit.
- PB-031: inconsistent inventory unit comparison between RecipeInventoryMatcher and FoodOperatingLoop.
- PB-032: package/unitless inventory comparison gap.
- PB-033: recipe meal-plan ignores RecipeContract mealTypes.
- PB-034: country code not validated at API boundary.
- PB-035: controller serving range differs from DTO/service.
- PB-036: RecipeStep is raw-SQL/migration-only runtime contract.
- PB-037: recipe lifecycle does not manage RecipeStep/RecipeMedia.
- PB-038: Meal nutrition repeats undefined FoodItem base-unit semantics.
- PB-039: budget meal planner ignores country/inventory/cuisine constraints.
- PB-040: Recommendation Intelligence services are placeholders and disconnected from actual recipe recommendation flow.
- PB-041: Budget Intelligence top-level budget/cost services are placeholders.
- PB-042: public budget plan endpoint uses no user context and unused unvalidated DTO.
- PB-043: Nutrition/Meals default date keys are UTC-based instead of user-timezone-aware.
- PB-044: multiple meal/recommendation implementations can diverge.

## Batch status

### BATCH-0005A — Food/Recipe/Nutrition/Meals/Recommendation/Budget file read
Status: COMPLETE for the enumerated file-level scope.
Important: this is file-read completion only; no runtime test command has been executed in the current connector session.

### BATCH-0005B — Food support reconciliation
Status: IN_PROGRESS
Remaining: exact inventory consistency pass, support matrix synchronization, any additional relevant media/import script discovery, then continue to Shopping.

## Next
Continue BATCH-0005B and then move to Shopping/Inventory/Price/Budget deeper cross-contracts. After all deep-read domains are complete, perform route/mobile/database/security/validation/historical reconciliation before any repair work.
