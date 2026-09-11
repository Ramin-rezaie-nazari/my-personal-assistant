# Reading Checkpoints

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: current-main manifests, AppModule, complete Auth source tree.
Scope not yet read: all other source and validation scope in the master prompt.
Evidence roots: `package.json`; `apps/backend/package.json`; `apps/mobile/package.json`; `apps/backend/src/app.module.ts`; `apps/backend/src/modules/auth/`.
Confidence level: MEDIUM for Batch 0001; LOW globally.
Open questions: deterministic source inventory and next core reads.

## BATCH-0001
Status: IN_PROGRESS
Start: 2026-09-11
Target ref: `main`
Target commit: `e38d4d16b0cf6e6ea714fa0bcc048e80187bcb3b`

### Files read successfully
All 11 current-`main` Auth source files were retrieved and read completely: module, service, controller, four DTOs, guard, session service, JWT strategy and token utilities.

### Findings
- Registration rejects an existing email, hashes passwords with Argon2 and creates an auth response.
- Login verifies Argon2 passwords and returns the same auth response shape.
- `/auth/me` is protected by `JwtAuthGuard` and returns `req.user`.
- Refresh verifies the refresh secret and `type === 'refresh'`, checks the persisted session, resolves the user, then issues a new token pair and new persisted session.
- Logout calls session revocation by refresh token.
- SessionService uses Prisma create/findFirst/deleteMany patterns.

Evidence: `apps/backend/src/modules/auth/auth.service.ts:21-112`; `apps/backend/src/modules/auth/controllers/auth.controller.ts:14-42`; `apps/backend/src/modules/auth/services/session.service.ts:8-45`; `apps/backend/src/modules/auth/utils/token.utils.ts:4-28`.

### Not yet resolved
- Whether old refresh sessions are removed/rotated when a refresh succeeds.
- Whether the hard-coded 30-day session `expiresAt` should mirror configured JWT refresh expiry.
- Whether logout should require JWT authentication at the controller layer.
- Full user/database/mobile contracts.

### Next batch
`BATCH-0002`: deterministic enumeration + complete current-`main` read of the remaining Core deep-read scope.
