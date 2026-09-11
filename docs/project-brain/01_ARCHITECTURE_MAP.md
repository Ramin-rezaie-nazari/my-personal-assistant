# Architecture Map

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: Existing architecture atlas excerpt, root workspace manifest, backend/mobile package manifests, initial Auth module files.
Scope not yet read: Complete module graph and all source files.
Evidence roots: apps/backend/docs/04_ARCHITECTURE_ATLAS.md; package.json; apps/backend/src/modules/auth/auth.module.ts; apps/backend/src/modules/auth/auth.service.ts; apps/backend/src/modules/auth/controllers/auth.controller.ts; apps/backend/src/modules/auth/services/session.service.ts; apps/mobile/package.json.
Confidence level: MEDIUM.
Open questions: full dependency graph, route map, mobile consumers, cross-domain data flows.

## Current verified shape

```text
Mobile (Expo/React Native)
        ↓ authenticated API
Backend (NestJS/TypeScript)
  ├─ Auth / Users
  ├─ Personal Brain + Assistant + Context/Memory/Decision systems
  ├─ Food/Nutrition/Recipe/Shopping/Inventory domains
  ├─ Fitness/Yoga/Calisthenics/Gym/Workout domains
  └─ Calendar/Daily/Habits/Reminders/Supplements/Notifications
        ↓
Prisma
        ↓
PostgreSQL
```

Auth is modularized through `AuthModule`, `UsersModule`, `JwtModule`, `PassportModule`, `AuthController`, `AuthService`, `JwtStrategy`, and `SessionService`. The service creates access/refresh tokens and persists session state; refresh consumes the previous session before issuing a new pair.

The detailed atlas remains a secondary semantic source until this audit finishes source-by-source verification.
