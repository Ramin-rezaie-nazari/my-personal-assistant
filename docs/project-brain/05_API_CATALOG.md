# API Catalog

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: all routes in the current-`main` Core controllers.
Scope not yet read: non-Core controllers, global prefix/middleware and mobile consumers.
Evidence roots: Core `controllers/*.ts` files.
Confidence level: MEDIUM for Core route paths and guard placement.
Open questions: global API prefix; all non-Core routes; response/error DTOs; mobile mapping.

| Method | Path | Guard | Controller/service |
|---|---|---|---|
| POST | `/auth/register` | Public | AuthController -> AuthService.register |
| POST | `/auth/login` | Public | AuthController -> AuthService.login |
| GET | `/auth/me` | JWT | AuthController -> request user |
| POST | `/auth/refresh` | Controller-unprotected; refresh JWT/session checked in service | AuthController -> AuthService.refreshToken |
| POST | `/auth/logout` | Controller-unprotected | AuthController -> AuthService.logout |
| GET | `/users/profile` | JWT | UsersController -> UsersService.getProfile |
| PATCH | `/users/profile` | JWT | UsersController -> UsersService.updateProfile |
| GET | `/profile` | JWT | ProfileController -> ProfileService.getProfile |
| PATCH | `/profile` | JWT | ProfileController -> ProfileService.updateProfile |
| GET | `/preferences` | JWT | PreferencesController -> PreferencesService.getPreferences |
| PATCH | `/preferences` | JWT | PreferencesController -> PreferencesService.updatePreferences |
| GET | `/onboarding/status` | JWT | OnboardingController -> OnboardingService.getStatus |
| POST | `/onboarding/complete` | JWT | OnboardingController -> OnboardingService.complete |
| GET | `/settings` | JWT | SettingsController -> SettingsService.getSettings |
| PATCH | `/settings` | JWT | SettingsController -> SettingsService.updateSettings |
| GET | `/device-intelligence` | No controller guard | DeviceIntelligenceController -> DeviceIntelligenceService.getHealthData |
| GET | `/user-intelligence` | JWT | UserIntelligenceController -> UserIntelligenceService.getProfile |
| POST | `/user-intelligence/events` | JWT | UserIntelligenceController -> LearningService.learnFromAction |
| POST | `/user-intelligence/analyze` | JWT | UserIntelligenceController -> UserIntelligenceService.analyzeBehavior |
| GET/other | `/context-engine` | No exposed method currently | Empty ContextEngineController |

Evidence: controller files under `apps/backend/src/modules/auth/controllers/`, `users/controllers/`, `profile/controllers/`, `preferences/controllers/`, `onboarding/controllers/`, `settings/controllers/`, `context-engine/controllers/`, `device-intelligence/controllers/`, `user-intelligence/controllers/`.
