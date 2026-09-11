# Contract Matrix

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: Auth routes.
Scope not yet read: all non-Auth API/database/mobile contracts.
Evidence roots: `apps/backend/src/modules/auth/controllers/auth.controller.ts`; `apps/backend/src/modules/auth/dto/`; `apps/backend/src/modules/auth/auth.service.ts`.
Confidence level: MEDIUM for Auth.
Open questions: global validation/error behavior; persistence schema; mobile consumers.

| Contract | Input | Output | Auth | DB effect | Test evidence | Consumer |
|---|---|---|---|---|---|---|
| POST `/auth/register` | `RegisterDto` | auth token pair + user summary | Public | User create + Session create | Not found on current main at expected service-test path | Mobile consumer not yet read |
| POST `/auth/login` | `LoginDto` | auth token pair + user summary | Public | Session create | Not found on current main at expected service-test path | Mobile consumer not yet read |
| GET `/auth/me` | bearer access token | `req.user` from JWT strategy | JWT | User lookup | No route test read | Mobile consumer not yet read |
| POST `/auth/refresh` | `RefreshTokenDto` | new auth token pair + user summary | Refresh JWT/session | Session lookup + new Session create | No route test read | Mobile consumer not yet read |
| POST `/auth/logout` | `LogoutDto` | success message | No controller guard | Session deleteMany | No route test read | Mobile consumer not yet read |

Evidence: `apps/backend/src/modules/auth/controllers/auth.controller.ts:14-42`; `apps/backend/src/modules/auth/auth.service.ts:21-112`.
