# Database Schema

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: current-`main` `apps/backend/prisma/schema.prisma` through its final `FitnessProfileState` model; selected migrations: init, user preferences, user profile, user onboarding, assistant profile, health/nutrition profiles, daily tracking, nutrition foundation, and later date-aware DailyLog/NutritionLog migrations.
Scope not yet read: complete migration directory, remaining migration SQL, schema-to-every-migration reconciliation, seeds/imports, all model readers/writers, transaction boundaries and runtime drift validation.
Evidence roots: `apps/backend/prisma/schema.prisma`; `apps/backend/prisma/migrations/` selected files.
Confidence level: MEDIUM for the final schema model list; LOW for migration completeness.
Open questions: exact total migration count; whether every final-schema field/index is represented by migration history; DB runtime state; all readers/writers.

## Final schema observed in current main

The current Prisma schema defines 32 models: `User`, `AuthAccount`, `Session`, `UserSettings`, `UserPreference`, `UserProfile`, `UserOnboarding`, `AssistantProfile`, `HealthProfile`, `NutritionProfile`, `DailyLog`, `NutritionLog`, `FoodItem`, `Meal`, `MealItem`, `RecipeIngredient`, `Recipe`, `InventoryItem`, `ShoppingItem`, `Workout`, `Reminder`, `Habit`, `HabitLog`, `Supplement`, `SupplementLog`, `Notification`, `UserFact`, `UserBehavior`, `UserInsight`, `PlanExecutionState`, `DecisionAuditEntry`, and `FitnessProfileState`. Evidence: `apps/backend/prisma/schema.prisma` through the final model at the end of the file.

Important relations include broad `User` ownership/cascade relationships across account, lifestyle, food, fitness, intelligence and execution records. `UserSettings`, `UserPreference`, `UserProfile`, `UserOnboarding`, `AssistantProfile`, `HealthProfile`, `NutritionProfile` and `FitnessProfileState` are one-to-one by unique `userId`. Evidence: `apps/backend/prisma/schema.prisma`.

`DailyLog` is now keyed by `(userId,dateKey)` and `NutritionLog` has `dateKey` plus an index on `(userId,dateKey)` in the final schema. Evidence: `apps/backend/prisma/schema.prisma`; `apps/backend/prisma/migrations/20260811122000_make_daily_logs_date_aware/migration.sql`; `apps/backend/prisma/migrations/20260811123000_make_nutrition_logs_date_aware/migration.sql`.

## Migrations read so far

- `20260804044934_init`: creates `User`, `AuthAccount`, `Session`, `UserSettings` and their initial indexes/foreign keys. Evidence: `apps/backend/prisma/migrations/20260804044934_init/migration.sql`.
- `20260805052906_add_user_preferences`: creates `UserPreference`. Evidence: corresponding `migration.sql`.
- `20260805065044_add_user_profile`: creates `UserProfile`. Evidence: corresponding `migration.sql`.
- `20260805065755_add_user_onboarding`: creates `UserOnboarding`. Evidence: corresponding `migration.sql`.
- `20260805070346_add_assistant_profile`: creates `AssistantProfile`. Evidence: corresponding `migration.sql`.
- `20260805070938_add_health_nutrition_profiles`: creates `HealthProfile` and `NutritionProfile`. Evidence: corresponding `migration.sql`.
- `20260805072640_add_daily_tracking`: initially creates `DailyLog` with one-row-per-user unique index; a later migration changes that contract. Evidence: corresponding `migration.sql`; `20260811122000_make_daily_logs_date_aware/migration.sql`.
- `20260805075011_add_nutrition_engine_foundation`: creates `NutritionLog`. Evidence: corresponding `migration.sql`.
- `20260811122000_make_daily_logs_date_aware`: adds `dateKey`, drops the old `DailyLog_userId_key` and creates `DailyLog_userId_dateKey_key`. Evidence: corresponding `migration.sql`.
- `20260811123000_make_nutrition_logs_date_aware`: adds `dateKey` and an index to `NutritionLog`. Evidence: corresponding `migration.sql`.

## Current migration finding

The first migration for `DailyLog` does not match the final Prisma model, but the known later migration explains the change. Therefore this difference is currently `EXPLAINED_BY_LATER_MIGRATION`, not an unexplained drift. The migration chain remains incomplete until all migrations are read.
