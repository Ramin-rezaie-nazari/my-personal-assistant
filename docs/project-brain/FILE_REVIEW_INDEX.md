# File Review Index

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: current-main package manifests/AppModule, 47 Core source files, full current Prisma schema, selected migration files.
Scope not yet read: remaining source and migrations.
Evidence roots: `main` at `e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b`; audit branch Project Brain.
Confidence level: MEDIUM for listed read files, LOW for repository completeness.
Open questions: exact repository-wide source count and line counts; remaining files.

## Core source index

| Scope | Identified files | Language | Status |
|---|---:|---|---|
| Auth | 11 | TypeScript | READ_COMPLETELY |
| Users | 5 | TypeScript | READ_COMPLETELY |
| Profile | 4 | TypeScript | READ_COMPLETELY |
| Preferences | 4 | TypeScript | READ_COMPLETELY |
| Onboarding | 4 | TypeScript | READ_COMPLETELY |
| Settings | 4 | TypeScript | READ_COMPLETELY |
| Context Engine | 7 | TypeScript | READ_COMPLETELY |
| Device Intelligence | 6 | TypeScript | READ_COMPLETELY |
| User Intelligence | 6 | TypeScript | READ_COMPLETELY |
| **Core total** | **51** | mixed* | **READ_COMPLETELY for identified source files** |

* 47 are TypeScript source files; 4 are package/module support files counted separately from source in detailed notes.

## Database index

| Path | Status | Notes |
|---|---|---|
| `apps/backend/prisma/schema.prisma` | READ_COMPLETELY | Final model is `FitnessProfileState`; 32 models observed |
| `apps/backend/prisma/migrations/20260804044934_init/migration.sql` | READ_COMPLETELY | initial auth/settings schema |
| `.../20260805052906_add_user_preferences/migration.sql` | READ_COMPLETELY | UserPreference |
| `.../20260805065044_add_user_profile/migration.sql` | READ_COMPLETELY | UserProfile |
| `.../20260805065755_add_user_onboarding/migration.sql` | READ_COMPLETELY | UserOnboarding |
| `.../20260805070346_add_assistant_profile/migration.sql` | READ_COMPLETELY | AssistantProfile |
| `.../20260805070938_add_health_nutrition_profiles/migration.sql` | READ_COMPLETELY | HealthProfile/NutritionProfile |
| `.../20260805072640_add_daily_tracking/migration.sql` | READ_COMPLETELY | initial DailyLog contract |
| `.../20260805075011_add_nutrition_engine_foundation/migration.sql` | READ_COMPLETELY | NutritionLog |
| `.../20260811122000_make_daily_logs_date_aware/migration.sql` | READ_COMPLETELY | final DailyLog key change |
| `.../20260811123000_make_nutrition_logs_date_aware/migration.sql` | READ_COMPLETELY | final NutritionLog dateKey/index |

Exact repository-wide line counts are not fabricated because the runtime has no local clone.
