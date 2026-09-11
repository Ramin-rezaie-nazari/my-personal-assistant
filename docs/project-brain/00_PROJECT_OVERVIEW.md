# MYPA Project Brain — Overview

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: current `main` repository metadata, root/backend/mobile package manifests, `apps/backend/src/app.module.ts`, and 47 current-`main` source files across the defined Core scopes (Auth, Users, Profile, Preferences, Onboarding, Settings, Context Engine, Device Intelligence, User Intelligence).
Scope not yet read: complete repository source beyond Core; deterministic repository-wide inventory/line counts; Prisma schema/migrations; Brain/Food/Shopping/Life/Health/Fitness/Platform/Mobile internals; CI/runtime validation.
Evidence roots: `package.json`; `apps/backend/package.json`; `apps/mobile/package.json`; `apps/backend/src/app.module.ts`; `apps/backend/src/modules/auth/`; `users/`; `profile/`; `preferences/`; `onboarding/`; `settings/`; `context-engine/`; `device-intelligence/`; `user-intelligence/`.
Confidence level: MEDIUM for the read Core implementation; LOW for repository-wide completeness.
Open questions: exact source-file count/line counts; local dirty/process state; full route/mobile/DB mapping; all remaining scopes.

## Baseline architecture

The current `AppModule` wires a broad modular NestJS backend including authentication, user/account foundations, assistant/personal-brain, food/nutrition/recipes, shopping/inventory, life execution, fitness, device intelligence, decision/adaptive learning, dashboards/command centers and content. Evidence: `apps/backend/src/app.module.ts:4-86`.

The current mobile package is Expo/React Native with Expo Router, AsyncStorage and notifications and exposes a typecheck command. Evidence: `apps/mobile/package.json`.

## Core audit findings

Authentication is implemented as controller -> AuthService -> Users/Session services, with Argon2 password handling and separate access/refresh JWT secrets. Evidence: `apps/backend/src/modules/auth/auth.service.ts:21-112`; `apps/backend/src/modules/auth/utils/token.utils.ts:4-28`.

User/profile/settings/preferences/onboarding are separate Prisma-backed modules, but onboarding completion has two apparent responsibility paths (`OnboardingService` versus any broader user onboarding persistence if discovered later). This is kept as an open contract question until the rest of the repository is read.

Context Engine now has real fusion and priority logic, while `ContextBuilderService` returns a minimal empty snapshot and its controller exposes no HTTP methods. Evidence: `apps/backend/src/modules/context-engine/services/context-builder.service.ts:1-14`; `apps/backend/src/modules/context-engine/controllers/context-engine.controller.ts:1-8`.

Device Intelligence currently exposes placeholder values/messages rather than a native health provider bridge. Evidence: `apps/backend/src/modules/device-intelligence/services/device-intelligence.service.ts:1-15`; `apps/backend/src/modules/device-intelligence/services/activity-tracking.service.ts:1-14`; `apps/backend/src/modules/device-intelligence/services/health-sync.service.ts:1-14`.

User Intelligence contains deterministic behavior learning over up to 1000 recent events, but `UserProfileService` remains a placeholder. Evidence: `apps/backend/src/modules/user-intelligence/services/learning.service.ts:15-120`; `apps/backend/src/modules/user-intelligence/services/user-profile.service.ts:1-16`.
