# Core Deep Read

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: complete identified current-`main` source files under Auth, Users, Profile, Preferences, Onboarding, Settings, Context Engine, Device Intelligence and User Intelligence: 47 files.
Scope not yet read: any additional Core files not surfaced by deterministic enumeration, plus all non-Core dependencies/tests and schema/migrations.
Evidence roots: `apps/backend/src/modules/auth/`; `users/`; `profile/`; `preferences/`; `onboarding/`; `settings/`; `context-engine/`; `device-intelligence/`; `user-intelligence/`.
Confidence level: MEDIUM for the 47 read files; LOW for completeness until automated inventory is available.
Open questions: exact line counts; hidden/additional files; global validation/middleware; DB schema contracts; mobile consumers.

## Auth

Argon2 hashes passwords; registration rejects an existing email; login rejects absent/invalid credentials. Evidence: `apps/backend/src/modules/auth/auth.service.ts:21-61`.

Access and refresh tokens use separate configured secrets; refresh tokens carry `type: 'refresh'`. Evidence: `apps/backend/src/modules/auth/utils/token.utils.ts:4-28`.

Refresh checks the JWT, refresh type and persisted session before resolving the user and issuing a new token pair. A previous session is not explicitly revoked in `AuthService.refreshToken`. Evidence: `apps/backend/src/modules/auth/auth.service.ts:63-89`.

## Users / account foundation

The registered controller exposes `/users/profile` GET/PATCH and requires JWT auth. A sibling `/users/me` controller file exists at the module root but is not registered by `UsersModule`. Evidence: `apps/backend/src/modules/users/controllers/users.controller.ts:1-24`; `apps/backend/src/modules/users/users.module.ts:1-12`; `apps/backend/src/modules/users/users.controller.ts:1-23`.

User profile updates constrain first/last names to 100 chars but do not constrain `avatarUrl`. Evidence: `apps/backend/src/modules/users/dto/update-profile.dto.ts:1-17`.

## Profile

Profile GET reads `userProfile` by `userId`; update uses `upsert` and converts `birthDate` to a Date. The DTO validates basic types only, with no domain bounds for height/weight or gender/goal values. Evidence: `apps/backend/src/modules/profile/services/profile.service.ts:1-33`; `apps/backend/src/modules/profile/dto/update-profile.dto.ts:1-21`.

## Preferences / Onboarding / Settings

Preferences GET auto-creates a row when missing; PATCH upserts the user preference. `theme` is only constrained to string. Evidence: `apps/backend/src/modules/preferences/services/preferences.service.ts:1-48`; `apps/backend/src/modules/preferences/dto/update-preferences.dto.ts:1-17`.

Onboarding GET also auto-creates state, while POST marks it completed with timestamp/current step. Evidence: `apps/backend/src/modules/onboarding/services/onboarding.service.ts:1-31`; `apps/backend/src/modules/onboarding/controllers/onboarding.controller.ts:1-26`.

Settings GET auto-creates settings; PATCH upserts language/timezone, with language constrained to `fa|en` and timezone length <=50. Evidence: `apps/backend/src/modules/settings/services/settings.service.ts:1-34`; `apps/backend/src/modules/settings/dto/update-settings.dto.ts:1-15`.

## Context Engine

`LifeContextFusionService` builds ten domains, marks sources missing/stale/fresh using a one-hour threshold, and clamps confidence to [0,1]. Evidence: `apps/backend/src/modules/context-engine/services/life-context-fusion.service.ts:1-72`.

`ContextPriorityResolverService` ranks domains by freshness-weighted confidence and marks sources usable when non-missing and confidence >=0.3. Evidence: `apps/backend/src/modules/context-engine/services/context-priority-resolver.service.ts:1-57`.

`ContextBuilderService` returns an empty `userState` snapshot and `ContextEngineController` has no HTTP method. Evidence: `apps/backend/src/modules/context-engine/services/context-builder.service.ts:1-14`; `apps/backend/src/modules/context-engine/controllers/context-engine.controller.ts:1-8`.

## Device Intelligence

`DeviceIntelligenceService.getHealthData()` and activity/health sync services currently return static placeholder messages/zero values. Evidence: `device-intelligence/services/device-intelligence.service.ts:1-15`; `activity-tracking.service.ts:1-14`; `health-sync.service.ts:1-14`.

`CreateDeviceSyncDto` contains provider/deviceId only and has no class-validator decorators. Evidence: `device-intelligence/dto/create-device-sync.dto.ts:1-4`.

## User Intelligence

`LearningService` persists behavior events and analyzes at most 1000 recent events, deriving completion rates, best hours, weekdays, acceptance/snooze rates and average estimated task minutes. Evidence: `apps/backend/src/modules/user-intelligence/services/learning.service.ts:15-120`.

`UserIntelligenceService.analyzeBehavior()` creates deterministic insight records for best focus window, high snooze rate and preferred task size. Evidence: `apps/backend/src/modules/user-intelligence/services/user-intelligence.service.ts:28-46`.

`UserProfileService` is a placeholder returning fixed messages. Evidence: `apps/backend/src/modules/user-intelligence/services/user-profile.service.ts:1-16`.

This document remains IN_PROGRESS until deterministic enumeration and non-Core reads are completed.
