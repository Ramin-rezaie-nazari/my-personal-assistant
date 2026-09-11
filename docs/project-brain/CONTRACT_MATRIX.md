# Contract Matrix

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: current-`main` Core routes and service contracts.
Scope not yet read: non-Core routes, DB schema, mobile consumers, global middleware.
Evidence roots: Core controllers/services/DTOs.
Confidence level: MEDIUM.
Open questions: response/error DTOs; global prefixes; mobile mappings; persistence details.

| Contract | Input | Output/Effect | Auth | Persistence | Consumer |
|---|---|---|---|---|---|
| `/auth/register` | RegisterDto | token pair + user summary | public | User create + Session create | mobile not yet read |
| `/auth/login` | LoginDto | token pair + user summary | public | Session create | mobile not yet read |
| `/auth/me` | bearer JWT | request user | JWT | User lookup | mobile not yet read |
| `/auth/refresh` | RefreshTokenDto | new token pair + new session | service-level refresh validation | Session lookup + Session create | mobile not yet read |
| `/auth/logout` | LogoutDto | success message | no controller guard | Session deleteMany | mobile not yet read |
| `/users/profile` GET/PATCH | JWT + UpdateProfileDto | user profile summary | JWT | User lookup/update | mobile not yet read |
| `/profile` GET/PATCH | JWT + UpdateProfileDto | UserProfile row | JWT | UserProfile read/upsert | mobile not yet read |
| `/preferences` GET/PATCH | JWT + UpdatePreferencesDto | UserPreference row | JWT | read/create/upsert | mobile not yet read |
| `/onboarding/status` GET | JWT | UserOnboarding row | JWT | read/create | mobile not yet read |
| `/onboarding/complete` POST | JWT + CompleteOnboardingDto | UserOnboarding row | JWT | update | mobile not yet read |
| `/settings` GET/PATCH | JWT + UpdateSettingsDto | UserSettings row | JWT | read/create/upsert | mobile not yet read |
| `/device-intelligence` GET | none | placeholder health object | no controller guard | none observed | mobile not yet read |
| `/user-intelligence` GET | JWT | facts + insights + adaptive behavior | JWT | reads UserFact/UserInsight/UserBehavior | mobile not yet read |
| `/user-intelligence/events` POST | JWT + body type | adaptive profile | JWT | UserBehavior create | mobile not yet read |
| `/user-intelligence/analyze` POST | JWT | refreshed intelligence profile | JWT | UserInsight create on conditions | mobile not yet read |
