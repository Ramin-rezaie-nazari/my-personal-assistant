# API Catalog

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: Auth controller and Auth DTO/service stack.
Scope not yet read: all non-Auth controllers/routes, mobile API consumers and error contracts.
Evidence roots: `apps/backend/src/modules/auth/controllers/auth.controller.ts`; `apps/backend/src/modules/auth/dto/`.
Confidence level: MEDIUM for Auth route paths and request validation decorators; LOW for repository-wide API coverage.
Open questions: global prefix/versioning; all routes; response schemas; permission matrix; mobile consumers.

| Method | Path | Controller | Service | Input | Auth | Status |
|---|---|---|---|---|---|---|
| POST | `/auth/register` | `AuthController.register` | `AuthService.register` | `RegisterDto` | Public | READ_COMPLETELY |
| POST | `/auth/login` | `AuthController.login` | `AuthService.login` | `LoginDto` | Public | READ_COMPLETELY |
| GET | `/auth/me` | `AuthController.me` | none; returns `req.user` | bearer token | JWT | READ_COMPLETELY |
| POST | `/auth/refresh` | `AuthController.refresh` | `AuthService.refreshToken` | `RefreshTokenDto` | Public endpoint; validates refresh JWT/session | READ_COMPLETELY |
| POST | `/auth/logout` | `AuthController.logout` | `AuthService.logout` | `LogoutDto` | No controller guard; token revocation is service-level | READ_COMPLETELY |

Evidence: `apps/backend/src/modules/auth/controllers/auth.controller.ts:14-42`.
