# File Review Index

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: current-main baseline/Core; complete Prisma schema + all 39 migration SQL files; complete Assistant TypeScript source/test scope; complete enumerated Brain file-level scope; complete enumerated Food/Recipe/Nutrition/Meals/Recommendation/Budget file-level scope; relevant recipe nutrition script.
Scope not yet read: Shopping, Life/Health, Fitness outside Brain integrations, Platform/Tests, Mobile, remaining repository-wide scripts/media not yet discovered, full consumer/route/DB transaction map, runtime validation, full security/privacy, historical docs/branches.
Evidence roots: target `main` commit `e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b`; audit branch `audit/project-brain-2026-09-11`; `apps/backend/src/modules/`; `apps/backend/prisma/`; `apps/backend/scripts/`.
Confidence level: HIGH for closed file-level batches; MEDIUM for cross-module semantics; LOW for whole-repository completion.
Open questions: exact repo-wide file/line inventory; remaining scripts/media; live DB drift; route/mobile/database consumers; runtime tests.

## Closed file-level batches

| Batch | Scope | Status | Notes |
|---|---|---|---|
| BATCH-0001 | Baseline/Auth/manifests | READ_COMPLETELY | Isolated audit branch initialized |
| BATCH-0002 | Core | READ_COMPLETELY | Auth/Users/Profile/Preferences/Onboarding/Settings/Context/Device/User Intelligence |
| BATCH-0003 | Prisma/migrations | READ_COMPLETELY | `schema.prisma` + all 39 migration SQL + lock |
| BATCH-0004 | Brain | READ_COMPLETELY | Assistant + Personal Brain + Brain Integration + Conversation + Decision + Adaptive + Goal + Memory |
| BATCH-0005A | Food domain | READ_COMPLETELY | Foods/Recipes/Nutrition/Meals/Recommendation/Budget + relevant recipe nutrition script |

## Core

Auth, Users, Profile, Preferences, Onboarding, Settings, Context Engine, Device Intelligence and User Intelligence identified source files are closed at file-read level.

## Brain

Assistant is closed at file-read level. Personal Brain, Brain Integration, Conversation Engine, Decision Engine, Adaptive Learning, Goal Intelligence and Memory Intelligence are closed at enumerated file-read level. Runtime status remains unverified.

## Food / Recipe / Nutrition / Meals / Recommendation / Budget

### Foods
- `apps/backend/src/modules/foods/foods.module.ts`
- `apps/backend/src/modules/foods/controllers/foods.controller.ts`
- `apps/backend/src/modules/foods/dto/create-food.dto.ts`
- `apps/backend/src/modules/foods/services/foods.service.ts`
- `apps/backend/src/modules/foods/services/foods.service.spec.ts`

### Recipes
- `apps/backend/src/modules/recipes/recipes.module.ts`
- `apps/backend/src/modules/recipes/controllers/recipes.controller.ts`
- `apps/backend/src/modules/recipes/controllers/recipes.controller.spec.ts`
- `apps/backend/src/modules/recipes/dto/create-recipe.dto.ts`
- `apps/backend/src/modules/recipes/data/global-country-food-profiles.ts` (read in chunks)
- `apps/backend/src/modules/recipes/services/recipes.service.ts`
- `apps/backend/src/modules/recipes/services/food-operating-loop.service.ts`
- `apps/backend/src/modules/recipes/services/food-operating-loop.service.spec.ts`
- `apps/backend/src/modules/recipes/services/global-country-food.service.ts`
- `apps/backend/src/modules/recipes/services/global-country-food.service.spec.ts`
- `apps/backend/src/modules/recipes/services/recipe-inventory-matcher.service.ts`
- `apps/backend/src/modules/recipes/services/recipe-inventory-matcher.service.spec.ts`
- `apps/backend/src/modules/recipes/services/recipe-presentation.service.ts`
- `apps/backend/src/modules/recipes/services/recipes.service.scaling.spec.ts`

### Nutrition / Recipe Intelligence
- `apps/backend/src/modules/nutrition/nutrition.module.ts`
- `apps/backend/src/modules/nutrition/controllers/nutrition.controller.ts`
- `apps/backend/src/modules/nutrition/dto/create-nutrition.dto.ts`
- `apps/backend/src/modules/nutrition/services/nutrition.service.ts`
- `apps/backend/src/modules/nutrition/services/nutrition.service.spec.ts`
- `apps/backend/src/modules/nutrition/recipe-intelligence/recipe-domain.types.ts`
- `apps/backend/src/modules/nutrition/recipe-intelligence/recipe-serving-scaling.service.ts`
- `apps/backend/src/modules/nutrition/recipe-intelligence/recipe-serving-scaling.service.spec.ts`
- `apps/backend/src/modules/nutrition/recipe-intelligence/recipe-serving-scaling.spec.ts`

### Meals
- `apps/backend/src/modules/meals/meals.module.ts`
- `apps/backend/src/modules/meals/controllers/meals.controller.ts`
- `apps/backend/src/modules/meals/dto/create-meal.dto.ts`
- `apps/backend/src/modules/meals/services/meals.service.ts`
- `apps/backend/src/modules/meals/services/meals.service.spec.ts`

### Recommendation Intelligence
- `apps/backend/src/modules/recommendation-intelligence/recommendation-intelligence.module.ts`
- `apps/backend/src/modules/recommendation-intelligence/controllers/recommendation-intelligence.controller.ts`
- `apps/backend/src/modules/recommendation-intelligence/dto/create-recommendation.dto.ts`
- `apps/backend/src/modules/recommendation-intelligence/services/personalization.service.ts`
- `apps/backend/src/modules/recommendation-intelligence/services/recommendation-engine.service.ts`
- `apps/backend/src/modules/recommendation-intelligence/services/recommendation-ranking.service.ts`

### Budget Intelligence
- `apps/backend/src/modules/budget-intelligence/budget-intelligence.module.ts`
- `apps/backend/src/modules/budget-intelligence/controllers/budget-intelligence.controller.ts`
- `apps/backend/src/modules/budget-intelligence/dto/create-budget-plan.dto.ts`
- `apps/backend/src/modules/budget-intelligence/data/global-country-currency.ts`
- `apps/backend/src/modules/budget-intelligence/services/budget-intelligence.service.ts`
- `apps/backend/src/modules/budget-intelligence/services/food-cost.service.ts`
- `apps/backend/src/modules/budget-intelligence/services/global-country-finance.service.ts`
- `apps/backend/src/modules/budget-intelligence/services/global-country-finance.service.spec.ts`
- `apps/backend/src/modules/budget-intelligence/services/meal-planning.service.ts`
- `apps/backend/src/modules/budget-intelligence/services/meal-planning.service.spec.ts`

### Relevant script
- `apps/backend/scripts/recipe-nutrition-estimate.mjs`

## Database

| Scope | Status | Notes |
|---|---|---|
| `apps/backend/prisma/schema.prisma` | READ_COMPLETELY | 32 final Prisma models |
| `apps/backend/prisma/migrations/` | READ_COMPLETELY | All 39 migration SQL files |
| `migration_lock.toml` | READ_COMPLETELY / identified | Provider lock recorded |

Known runtime migration/schema anomalies remain open. Exact repository-wide line counts are not fabricated because there is no local repository clone available in this session.

## Important caveat

`READ_COMPLETELY` here means every file explicitly enumerated in the closed batch was read. It does not mean the whole repository has been read. Any file not in a closed batch remains unreviewed unless separately recorded in this index.
