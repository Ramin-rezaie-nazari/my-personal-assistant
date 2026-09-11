# Data Flow Map

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: Auth registration/login/refresh/logout flow.
Scope not yet read: all domain and mobile flows; DB model map; async/background jobs.
Evidence roots: `apps/backend/src/modules/auth/`.
Confidence level: MEDIUM for Auth flow; LOW globally.
Open questions: full request middleware/validation pipeline; DB model details; mobile storage and refresh behavior.

## Auth flow

Registration/login -> AuthController -> AuthService -> UsersService lookup/create -> Argon2 verification/hash -> JWT access/refresh creation -> SessionService persistence -> Auth response. Evidence: `apps/backend/src/modules/auth/auth.service.ts:21-112`.

Refresh -> AuthController -> `JwtService.verify` with refresh secret -> require `payload.type === 'refresh'` -> SessionService lookup -> UsersService lookup -> create a new access/refresh pair and persist a new session. Evidence: `apps/backend/src/modules/auth/auth.service.ts:63-89`.

Logout -> AuthController -> SessionService.revokeSession -> Prisma `deleteMany` on the refresh token. Evidence: `apps/backend/src/modules/auth/auth.service.ts:91-98`; `apps/backend/src/modules/auth/services/session.service.ts:34-44`.

A later batch must verify whether old refresh sessions are intentionally retained during refresh or rotated/revoked.
