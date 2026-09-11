# Architecture Map

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: backend root module wiring, root/backend/mobile manifests, complete Auth source tree.
Scope not yet read: backend common infrastructure, all domain modules, mobile source/navigation, database/migrations, CI/runtime.
Evidence roots: `apps/backend/src/app.module.ts`; `apps/backend/package.json`; `apps/mobile/package.json`; `apps/backend/src/modules/auth/`.
Confidence level: MEDIUM for module registration and Auth; LOW for end-to-end architecture.
Open questions: actual provider injection graph for every module; route exposure; mobile consumers; database effects; runtime topology.

## Current dependency shape

The root Nest module wires Prisma/config plus the domain modules. Evidence: `apps/backend/src/app.module.ts:1-89`.

Auth imports UsersModule, ConfigModule, PassportModule and JwtModule. It provides AuthService, JwtStrategy and SessionService and exports AuthService. Evidence: `apps/backend/src/modules/auth/auth.module.ts:1-31`.

Within Auth, controllers are thin route adapters; AuthService owns registration/login/refresh/logout orchestration; JwtStrategy resolves authenticated users through UsersService; SessionService persists refresh-token sessions through Prisma. Evidence: `apps/backend/src/modules/auth/controllers/auth.controller.ts:1-42`; `apps/backend/src/modules/auth/auth.service.ts:1-112`; `apps/backend/src/modules/auth/strategies/jwt.strategy.ts:1-25`; `apps/backend/src/modules/auth/services/session.service.ts:1-45`.

## Architectural risk signal from first batch

`UsersController` behavior is not part of this batch, so authorization and user-lookup contracts will be cross-checked when the Users module is audited. No end-to-end architecture claim is closed yet.
