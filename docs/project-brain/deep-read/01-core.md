# Core Deep Read

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: Authentication, users, profile, preferences, onboarding, settings, context-engine, device-intelligence, and user-intelligence files explicitly retrieved in the current audit batches.
Scope not yet read: Remaining files in these modules not yet deterministically enumerated/read, plus database/migration reconciliation and unreviewed dependencies/tests.
Evidence roots: `apps/backend/src/modules/auth/`; `apps/backend/src/modules/users/`; `apps/backend/src/modules/profile/`; `apps/backend/src/modules/preferences/`; `apps/backend/src/modules/onboarding/`; `apps/backend/src/modules/settings/`; `apps/backend/src/modules/context-engine/`; `apps/backend/src/modules/device-intelligence/`; `apps/backend/src/modules/user-intelligence/` on branch `agent/mypa-autonomous-control-plane`.
Confidence level: MEDIUM for retrieved implementation paths; LOW for completeness of module enumeration until directory inventories are fully reconciled.
Open questions: whether additional tests, DTOs, helpers, or nested files exist in these scopes; route-to-mobile consumer mapping; schema/migration contracts for all referenced models.

## Retrieved evidence

### Auth
- Previously read authentication implementation includes Argon2 password hashing, JWT access/refresh tokens, refresh-session consumption/rotation and logout/session revocation.
- `JwtAuthGuard` delegates to Passport's JWT strategy.
- `JwtStrategy` validates bearer JWTs and resolves the user through `UsersService.findById`.
- Login DTO requires a valid email and password with minimum length 8.

### Users / Profile / Preferences / Onboarding / Settings
- `UsersService` reads users by email/id, exposes a basic profile, updates user identity fields, and persists onboarding data in a Prisma transaction spanning `User`, `UserProfile`, `UserPreference`, `UserOnboarding`, and ten `UserFact` entries.
- There are two `users.controller.ts` source paths: a root-level controller with `me`/`PATCH me`, and `controllers/users.controller.ts` registered by `UsersModule`, exposing `/users/profile` and `/users/onboarding`.
- `ProfileService` upserts `UserProfile`; its DTO accepts unbounded string fields for gender/goal and numeric height/weight without domain constraints.
- `PreferencesService` upserts `UserPreference`; its DTO constrains only booleans/string values and does not constrain `theme`.
- `OnboardingService` creates default onboarding state on status read and marks it complete on POST; `UsersService.saveOnboarding` separately performs broader onboarding persistence.
- `SettingsService` auto-creates settings on read and upserts language/timezone on update; language is constrained to `fa` or `en` in the DTO.

### Context Engine
- `ContextEngineService` delegates context construction to `LifeContextFusionService`.
- `LifeContextFusionService` normalizes ten context domains, marks data fresh/stale/missing using a one-hour freshness window, and clamps confidence to `[0,1]`.
- `ContextPriorityResolverService` ranks domains by freshness-weighted confidence and marks sources usable when non-missing with confidence >= 0.3.
- `ContextBuilderService` currently returns an empty `userState` snapshot plus timestamp.
- `ContextEngineController` declares `/context-engine` but contains no HTTP methods.

### Device Intelligence
- Health integration reports HealthKit/Health Connect as not configured and exposes a normalized metrics contract including steps, energy, distance, heart rate, sleep, workouts, body weight/fat, blood pressure, glucose and oxygen saturation.
- Health sync returns `native_provider_required`; activity tracking currently returns a placeholder success message.
- A device-sync DTO exists with provider/deviceId fields but was retrieved without validation decorators.

### User Intelligence
- `LearningService` stores behavior events in `userBehavior`, analyzes the latest 1000 events, computes hourly/weekday completion, acceptance rate, snooze rate, preferred task duration and patterns, and writes insights through `UserInsight`.
- `UserIntelligenceService` combines facts, up to 20 insights and the adaptive behavior profile; `analyzeBehavior` writes rule-based insights for best focus windows, high snooze rate and preferred task size.
- `UserProfileService` is currently a placeholder returning fixed messages.

This document intentionally remains `IN_PROGRESS` until deterministic enumeration and complete reads for every file in the defined core scope are finished.
