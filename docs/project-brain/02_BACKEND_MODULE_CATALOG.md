# Backend Module Catalog

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: `apps/backend/src/app.module.ts` plus the complete Auth module source tree.
Scope not yet read: internals of all non-Auth modules; common/shared/config/database layers; module-level tests.
Evidence roots: `apps/backend/src/app.module.ts`; `apps/backend/src/modules/auth/`.
Confidence level: MEDIUM for registered module names; LOW for internal contracts.
Open questions: providers/controllers/services per module; route exposure; database readers/writers; mobile consumers.

## Registered backend modules (inventory-level)

The current `AppModule` registers: Health, Daily, Nutrition, Foods, Meals, Recipes, Inventory, Shopping, Workout, Supplements, Reminders, Calendar, Notifications, Habits, Goals, LifeExecution, Config, Prisma, Auth, Users, Settings, Profile, Onboarding, Assistant, UserIntelligence, BudgetIntelligence, PriceIntelligence, ShoppingIntelligence, DeviceIntelligence, DecisionEngine, AdaptiveLearning, ContextEngine, Preferences, PersonalBrain, Dashboard, DailyCommandCenter, Yoga, Calisthenics, Fitness and Content. Evidence: `apps/backend/src/app.module.ts:4-86`.

### Auth — READ_COMPLETELY for the first batch

Purpose: registration, login, authenticated self lookup, refresh and logout.
Evidence: `apps/backend/src/modules/auth/controllers/auth.controller.ts:1-42`.

Files read completely in this batch: `auth.module.ts`, `auth.service.ts`, `controllers/auth.controller.ts`, `dto/register.dto.ts`, `dto/login.dto.ts`, `dto/logout.dto.ts`, `dto/refresh-token.dto.ts`, `guards/jwt-auth.guard.ts`, `services/session.service.ts`, `strategies/jwt.strategy.ts`, `utils/token.utils.ts`.

Status for all listed Auth files: READ_COMPLETELY.
