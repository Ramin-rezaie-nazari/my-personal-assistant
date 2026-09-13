# Backend Module Catalog

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: `AppModule` plus complete current-`main` Core modules.
Scope not yet read: all non-Core module internals and common/shared infrastructure.
Evidence roots: `apps/backend/src/app.module.ts`; Core paths.
Confidence level: MEDIUM for registered modules/Core implementation.
Open questions: non-Core providers/routes/read-write contracts.

## Registered modules

`AppModule` currently registers 39 entries/modules including Health, Daily, Nutrition, Foods, Meals, Recipes, Inventory, Shopping, Workout, Supplements, Reminders, Calendar, Notifications, Habits, Goals, LifeExecution, Config, Prisma, Auth, Users, Settings, Profile, Onboarding, Assistant, UserIntelligence, BudgetIntelligence, PriceIntelligence, ShoppingIntelligence, DeviceIntelligence, DecisionEngine, AdaptiveLearning, ContextEngine, Preferences, PersonalBrain, Dashboard, DailyCommandCenter, Yoga, Calisthenics, Fitness and Content. Evidence: `apps/backend/src/app.module.ts:4-86`.

## Core status

- Auth: READ_COMPLETELY for all 11 identified source files.
- Users: READ_COMPLETELY for all 5 identified source files; duplicate inactive controller path remains a cleanup/audit question.
- Profile: READ_COMPLETELY for all 4 identified source files.
- Preferences: READ_COMPLETELY for all 4 identified source files.
- Onboarding: READ_COMPLETELY for all 4 identified source files.
- Settings: READ_COMPLETELY for all 4 identified source files.
- Context Engine: READ_COMPLETELY for all 7 identified source files.
- Device Intelligence: READ_COMPLETELY for all 6 identified source files.
- User Intelligence: READ_COMPLETELY for all 6 identified source files.

The per-file index remains conservative because exact automated line counts are not available without a local clone.
