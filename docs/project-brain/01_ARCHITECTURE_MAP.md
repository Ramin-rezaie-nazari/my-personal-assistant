# Architecture Map

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: root module wiring, package manifests and complete current-`main` Core source read.
Scope not yet read: non-Core backend internals, mobile internals, DB/migrations, CI/runtime.
Evidence roots: `apps/backend/src/app.module.ts`; manifests; Core module paths.
Confidence level: MEDIUM for Core.
Open questions: global middleware/prefix/guards; provider graph outside Core; DB relations; mobile consumers.

## Backend root

`AppModule` imports config and Prisma infrastructure plus domain modules for auth/users/profile/settings/onboarding, assistant/brain, nutrition/food/recipes, shopping/inventory, reminders/calendar/notifications/habits/goals/life execution, fitness disciplines, intelligence engines, dashboard/command center and content. Evidence: `apps/backend/src/app.module.ts:4-86`.

## Core dependency shape

Auth imports UsersModule, ConfigModule, PassportModule and JwtModule; it exports AuthService. Evidence: `apps/backend/src/modules/auth/auth.module.ts:1-31`.

Users imports Prisma and registers only `controllers/users.controller.ts`; the sibling `users/users.controller.ts` is present but is not referenced by `UsersModule`. Evidence: `apps/backend/src/modules/users/users.module.ts:1-12`; `apps/backend/src/modules/users/controllers/users.controller.ts:1-24`; `apps/backend/src/modules/users/users.controller.ts:1-23`.

Profile, Preferences, Onboarding and Settings are thin Prisma-backed modules with JWT-guarded controllers. Evidence: their respective module/controller/service files under `apps/backend/src/modules/profile/`, `preferences/`, `onboarding/`, `settings/`.

Context Engine composes `LifeContextFusionService` and `ContextPriorityResolverService`. Fusion normalizes ten domains, freshness and confidence; priority ranks by freshness-weighted confidence. Evidence: `apps/backend/src/modules/context-engine/services/life-context-fusion.service.ts:1-72`; `apps/backend/src/modules/context-engine/services/context-priority-resolver.service.ts:1-57`.

Device Intelligence has no observed persistence in its current services; it returns placeholder values/messages. User Intelligence persists behavior/insight records through Prisma and builds deterministic adaptive profiles. Evidence: `apps/backend/src/modules/device-intelligence/services/device-intelligence.service.ts:1-15`; `apps/backend/src/modules/user-intelligence/services/learning.service.ts:15-120`.
