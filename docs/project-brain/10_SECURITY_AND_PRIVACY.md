# Security and Privacy

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: Auth implementation and DTO validation decorators.
Scope not yet read: global validation pipe, rate limiting, authorization across all modules, secret/config handling, logging, retention, device data boundaries, mobile secure storage.
Evidence roots: `apps/backend/src/modules/auth/`; `apps/backend/package.json`.
Confidence level: MEDIUM for password/JWT mechanisms; LOW repository-wide.
Open questions: refresh-token rotation policy; token storage on client; rate limiting; logout semantics; auth endpoint protection; authorization beyond JWT identity.

## Findings from Auth

Passwords are hashed and verified with Argon2. Evidence: `apps/backend/src/modules/auth/auth.service.ts:29-37`, `apps/backend/src/modules/auth/auth.service.ts:49-57`.

Access and refresh tokens are signed with separate configured secrets; refresh tokens carry `type: 'refresh'`. Evidence: `apps/backend/src/modules/auth/utils/token.utils.ts:4-28`.

Refresh-token sessions are stored in Prisma and deleted on logout. Evidence: `apps/backend/src/modules/auth/services/session.service.ts:8-45`.

Potential audit question: `createAuthResponse()` stores a newly issued refresh token with a hard-coded 30-day session `expiresAt`, while JWT expiry itself is configuration-driven. Evidence: `apps/backend/src/modules/auth/auth.service.ts:103-112`. This mismatch must be compared with config and Prisma/session semantics before calling it a bug.
