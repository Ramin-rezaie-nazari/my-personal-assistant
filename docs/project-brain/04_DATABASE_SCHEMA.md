# Database Schema

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: current-`main` `apps/backend/prisma/schema.prisma` completely; all 39 migration directories' `migration.sql` files identified and read; `migration_lock.toml` identified. Migration history and final schema reconciled at the structural level.
Scope not yet read: all model readers/writers, transaction boundaries, seeds/imports, runtime database state, live drift validation.
Evidence roots: `apps/backend/prisma/schema.prisma`; `apps/backend/prisma/migrations/`.
Confidence level: HIGH for migration inventory and final Prisma model shape; MEDIUM for runtime DB parity because no live database validation has been executed.
Open questions: runtime migration table/state, all runtime readers/writers, seed/import behavior.

## Final schema observed in current main

The current Prisma schema defines 32 models: `User`, `AuthAccount`, `Session`, `UserSettings`, `UserPreference`, `UserProfile`, `UserOnboarding`, `AssistantProfile`, `HealthProfile`, `NutritionProfile`, `DailyLog`, `NutritionLog`, `FoodItem`, `Meal`, `MealItem`, `RecipeIngredient`, `Recipe`, `InventoryItem`, `ShoppingItem`, `Workout`, `Reminder`, `Habit`, `HabitLog`, `Supplement`, `SupplementLog`, `Notification`, `UserFact`, `UserBehavior`, `UserInsight`, `PlanExecutionState`, `DecisionAuditEntry`, and `FitnessProfileState`. Evidence: `apps/backend/prisma/schema.prisma`.

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
- `20260812133000_harden_life_execution_compatibility` creates legacy-named `TaskDependency` and `TaskEvent` tables with `IF NOT EXISTS` and adds `energy` to `LifeTask`. These tables are not represented as Prisma models in the final `schema.prisma` and therefore remain a schema-history compatibility anomaly requiring runtime/operational review. Evidence: migration file; `apps/backend/prisma/schema.prisma`.
- `20260812160500_add_conversation_action_reference` is an explicit no-op compatibility migration. Evidence: migration file.
- `20260812193000_add_conversation_turns` creates `ConversationTurn` with action/execution/resource reference fields. This table is not represented in the final Prisma schema shown on current `main`, so it remains a significant migration-vs-schema anomaly requiring code/runtime reconciliation. Evidence: migration file; `apps/backend/prisma/schema.prisma`.
- `20260813090000_add_plan_execution_state` creates `PlanExecutionState`, represented in final Prisma. Evidence: migration file; `schema.prisma`.
- `20260813093000_add_decision_audit`, `20260813113000_add_decision_outcomes`, and `20260813120000_add_decision_outcome_source` evolve decision provenance. `DecisionOutcome` is not represented in final Prisma schema, while `DecisionAuditEntry` is. This is another migration-vs-schema anomaly requiring runtime/code reconciliation. Evidence: migration files; `schema.prisma`.
- `20260814000100_add_shopping_items` and `20260814030000_add_inventory` create the final `ShoppingItem` and `InventoryItem` structures represented in Prisma. Evidence: migration files; `schema.prisma`.
- `20260815120000_add_price_intelligence` creates `PriceTrackedProduct`, `PriceSource`, `PriceSnapshot`, and `PriceCollectionRun`. These tables are not represented in final Prisma schema and therefore are migration-vs-schema anomalies requiring reconciliation. Evidence: migration file; `schema.prisma`.
- `20260815190000_add_reminder_end_time` adds `Reminder.endsAt`, represented in final Prisma. Evidence: migration file; `schema.prisma`.
- `20260818073500_add_recipe_servings` adds positive `Recipe.servings`; `20260818113000_add_recipe_ingredient_scaling_metadata` adds scaling controls, all represented in final Prisma. Evidence: migration files; `schema.prisma`.
- `20260906120000_add_recipe_steps` creates `RecipeStep`, and `20260906123000_add_recipe_media` creates `RecipeMedia`. Neither appears as a final Prisma model in `schema.prisma`, making both current migration-vs-schema anomalies requiring reconciliation before considering the database contract closed. Evidence: migration files; `schema.prisma`.

## Current audit conclusion

Migration history is now completely read at the file level, but the database contract is **not yet complete** because several migration-created tables (`ConversationTurn`, `DecisionOutcome`, `PriceTrackedProduct`, `PriceSource`, `PriceSnapshot`, `PriceCollectionRun`, `RecipeStep`, `RecipeMedia`, plus compatibility `TaskDependency`/`TaskEvent`) do not appear in the final Prisma schema. These are explicitly tracked as unresolved migration-vs-schema compatibility/runtime questions, not silently ignored.
