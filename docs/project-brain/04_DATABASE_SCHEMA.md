# Database Schema

Last updated: 2026-09-18
Review status: SCHEMA/MIGRATION RECONCILED / LOCAL RUNTIME VERIFIED / DEVICE VERIFICATION PENDING
Scope actually read: current-`main` `apps/backend/prisma/schema.prisma` completely; all 39 migration directories' `migration.sql` files identified and read; `migration_lock.toml` identified. Migration history and final schema reconciled at the structural level.
Historical reader/writer and seed/import read boundaries are retained as audit notes. Current Prisma schema validation, client generation, migration deployment and migration idempotence are covered by Backend CI; the user's laptop validator also completed local PostgreSQL startup and migration deployment.
Evidence roots: `apps/backend/prisma/schema.prisma`; `apps/backend/prisma/migrations/`.
Confidence level: HIGH for migration inventory and final Prisma model shape; MEDIUM for runtime DB parity because no live database validation has been executed.
Remaining database evidence questions are operational/production only: long-lived VPS drift monitoring and release deployment state.

## Final schema observed in current main

The current main `schema.prisma` defines 43 models, and the supplemental `exercise-content.prisma` adds 3 canonical exercise-content models, for 46 Prisma models across the configured schema directory. Evidence: `apps/backend/prisma/schema.prisma`; `apps/backend/prisma/exercise-content.prisma`.

`User` owns the user-scoped lifestyle, nutrition, food, fitness, intelligence and execution records through direct relations, generally with `ON DELETE CASCADE`. One-to-one records are protected by unique `userId` in Prisma. Evidence: `apps/backend/prisma/schema.prisma`.

`DailyLog` is keyed by `(userId,dateKey)` and `NutritionLog` has `dateKey` plus `(userId,dateKey)` index. Evidence: `apps/backend/prisma/schema.prisma`; `20260811122000_make_daily_logs_date_aware/migration.sql`; `20260811123000_make_nutrition_logs_date_aware/migration.sql`.

Recipe persistence includes `servings` and ingredient scaling metadata. Evidence: `20260818073500_add_recipe_servings/migration.sql`; `20260818113000_add_recipe_ingredient_scaling_metadata/migration.sql`; `apps/backend/prisma/schema.prisma`.

Recipe execution/content persistence also includes `RecipeStep` and `RecipeMedia` tables in migration history, including media provenance fields such as source URL/provider, license, attribution, status and checksum. Evidence: `20260906120000_add_recipe_steps/migration.sql`; `20260906123000_add_recipe_media/migration.sql`.

## Migration reconciliation summary

The migration inventory contains 39 migration directories plus `migration_lock.toml` on current `main`. The migration names cover auth/profile foundations, health/nutrition, daily tracking, food/meal/recipe/workout, reminders/habits/supplements/notifications, goals/life execution, conversation/plan/decision auditing, fitness state/performance, shopping/inventory/price intelligence, and later recipe serving/scaling/steps/media work. Evidence: `apps/backend/prisma/migrations/`.

### Important reconciled changes

- `20260805072640_add_daily_tracking` initially created a one-row-per-user `DailyLog`; `20260811122000_make_daily_logs_date_aware` adds `dateKey`, drops the old unique user-only index, and creates the `(userId,dateKey)` unique index. Evidence: the two migration files.
- `20260805075011_add_nutrition_engine_foundation` created `NutritionLog`; `20260811123000_make_nutrition_logs_date_aware` added `dateKey` and a `(userId,dateKey)` index. Evidence: the two migration files.
- `20260812104500_smart_notifications` adds mandatory `dedupeKey` and `priority`, backfills legacy rows, and creates unique `(userId,dedupeKey)`. Evidence: migration file.
- `20260812130000_add_life_execution` creates `LifeTask`, `LifeTaskDependency`, and `LifeTaskEvent`. Evidence: migration file.
- `20260812130000_add_life_execution_engine` is an explicit no-op compatibility migration documenting an earlier duplicate creation attempt. Evidence: migration file.
- `20260812133000_harden_life_execution_compatibility` creates legacy-named `TaskDependency` and `TaskEvent` tables with `IF NOT EXISTS` and adds compatibility column `energy` to `LifeTask`. These artifacts are intentionally not represented as active Prisma models. The canonical planning service now uses `LifeTaskDependency`, `LifeTaskEvent` and `energyLevel`; PB-276 records and tests this boundary.
- `20260812160500_add_conversation_action_reference` is an explicit no-op compatibility migration. Evidence: migration file.
- `ConversationTurn` is represented in the current Prisma schema and has active assistant conversation consumers. Evidence: migration file; `apps/backend/prisma/schema.prisma`; assistant conversation services.
- `20260813090000_add_plan_execution_state` creates `PlanExecutionState`, represented in final Prisma. Evidence: migration file; `schema.prisma`.
- `20260813093000_add_decision_audit`, `20260813113000_add_decision_outcomes`, and `20260813120000_add_decision_outcome_source` are represented in the current Prisma schema as `DecisionAuditEntry` and `DecisionOutcome` structures. Backend CI validates the resulting schema/migrations.
- `20260814000100_add_shopping_items` and `20260814030000_add_inventory` create the final `ShoppingItem` and `InventoryItem` structures represented in Prisma. Evidence: migration files; `schema.prisma`.
- `20260815120000_add_price_intelligence` and the later global-source migration are represented in the current Prisma schema as `PriceTrackedProduct`, `PriceSource`, `PriceSnapshot` and `PriceCollectionRun`. Backend CI validates the configured schema and migrations.
- `20260815190000_add_reminder_end_time` adds `Reminder.endsAt`, represented in final Prisma. Evidence: migration file; `schema.prisma`.
- `20260818073500_add_recipe_servings` adds positive `Recipe.servings`; `20260818113000_add_recipe_ingredient_scaling_metadata` adds scaling controls, all represented in final Prisma. Evidence: migration files; `schema.prisma`.
- `RecipeStep` and `RecipeMedia` are represented in the current configured Prisma schema and are used by the recipe content layer. Evidence: migration files; `schema.prisma`.

## Current audit conclusion

The canonical Prisma schema and migration history are reconciled at source level. Backend CI validates schema generation, migration deployment and idempotence; the user's laptop validator also completed local PostgreSQL startup and migration deployment. `TaskDependency` and `TaskEvent` remain historical compatibility artifacts from the life-execution transition and are no longer active canonical planning tables. Production/VPS drift monitoring remains a release-phase concern.
