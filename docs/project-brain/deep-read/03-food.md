# Food Deep Read

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: complete enumerated file-level scope for Foods, Recipes, Nutrition, Meals, Recommendation Intelligence, Budget Intelligence and related recipe/nutrition scripts/tests; Prisma FoodItem/Meal/Recipe/RecipeIngredient/MealItem schema; migration evidence for RecipeStep/RecipeMedia; selected Shopping/Inventory consumers; current AppModule wiring and Recommendation Intelligence controller/module.
Scope not yet read: remaining Food/Recipe auxiliary scripts and unenumerated common/content files; complete repository-wide food route consumer matrix; full DB reader/writer/transaction reconciliation; runtime tests/execution; deployed data drift.
Evidence roots: `apps/backend/src/modules/foods/`; `recipes/`; `nutrition/`; `meals/`; `recommendation-intelligence/`; `budget-intelligence/`; `apps/backend/scripts/`; `apps/backend/prisma/`; `apps/backend/src/app.module.ts`; relevant Project Brain docs.
Confidence level: HIGH for inspected source-level findings; MEDIUM for cross-module runtime impact until final route/database reconciliation and runtime execution.
Open questions: exact production data units, legacy recipe ingestion reconciliation, complete recommendation consumer graph, runtime behavior.

## Findings

- Food/Meal/Recipe nutrition currently multiplies stored FoodItem nutrient values by raw numeric quantities without an explicit canonical base quantity/unit on FoodItem. This is a data-integrity risk because a quantity of `1` has no stable semantic basis.
- Food Operating Loop and RecipeInventoryMatcher use different unit semantics, and package/unitless inventory cannot be reliably compared.
- Recipe meal-plan assignment ignores RecipeContract mealTypes and can assign the first three ranked recipes sequentially to breakfast/lunch/dinner.
- Country code inputs lack a strict supported-set validator; invalid codes can silently fall back.
- Recipe controller serving parsing and DTO/service max constraints are inconsistent.
- Recipe presentation uses raw SQL against migration-only RecipeStep, while RecipeStep/RecipeMedia lifecycle is not fully connected to Recipe create/update.
- Budget MealPlanningService ignores parts of country/inventory/cuisine and targetServings in scoring/math, and multiple recommendation/meal-planning implementations can diverge.
- Recipe nutrition estimate script uses a separate Supabase/legacy schema contract from the canonical Prisma Recipe path.
- Recommendation Intelligence source services exist, but `RecommendationIntelligenceModule` is not imported by `AppModule` or another active module found by repository search, and `RecommendationIntelligenceController` is empty. Therefore the documented `POST /recommendation-intelligence/food` endpoint is not actually exposed by the audited runtime wiring despite being described as implemented in `apps/backend/docs/05_CURRENT_STATE.md`.

## Issue IDs introduced/confirmed

- PB-030, PB-031, PB-032, PB-033, PB-034, PB-035, PB-036, PB-037, PB-038, PB-039, PB-040, PB-041, PB-042, PB-043, PB-044, PB-045, PB-046, PB-047, PB-048: earlier Food/Recipe/Nutrition/Recommendation/Budget findings remain OPEN as recorded in the global issue catalog.
- PB-161: Recommendation Intelligence module is orphaned from active AppModule wiring; no active import consumer was found.
- PB-162: Recommendation Intelligence controller is an empty shell, so documented `POST /recommendation-intelligence/food` is not exposed by the controller.
- PB-163: `apps/backend/docs/05_CURRENT_STATE.md` claims `POST /recommendation-intelligence/food` is implemented while the audited controller is empty and the module is not wired; documentation/runtime state is inconsistent.

## Remaining work

Finish remaining Food/Recipe auxiliary files, reconcile all recommendation consumers, update the global API/feature/route matrices and issue catalog, and perform runtime execution only when actually available.
