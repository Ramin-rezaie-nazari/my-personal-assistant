# Remediation Batch 0033 — Root API cleanup + security verification

Date: 2026-09-11
Branch: `audit/project-brain-2026-09-11`

## Completed

### Obsolete root API cleanup
- Removed the legacy `AppController` / `AppService` Hello World endpoint from the Nest application module.
- Removed its obsolete unit test.
- Updated the API e2e suite so `/` is explicitly expected to return `404` while preserving authenticated recipe coverage.
- The dedicated `/health` route remains the health-check surface.

### Notification-device ownership
- Verified the user-facing `/personal-brain/coach/device/disable` route uses `disableForUser(deviceId, req.user.id)`.
- Preserved unscoped `disable()` for infrastructure/provider token invalidation, which is not a user-controlled resource mutation.

### Refresh-token storage
- Verified the `Session` model stores `refreshTokenHash`, not plaintext refresh tokens.
- Verified refresh lookup hashes the presented token and enforces persisted expiry.
- Verified rotation is transactional and removes the presented user-owned session before creating its replacement.
- Verified the migration explicitly revokes existing sessions before dropping plaintext token storage.

## Verification boundary

Source remediation is complete for this batch, but runtime execution is still unavailable in the current environment because the project's dependency installation requires pnpm/network access. CI, migration execution, query-plan validation, and device-level verification remain required before final PASS.

## Next priority

1. Continue the identified user-timezone semantic migrations.
2. Close account-erasure/retention workflow.
3. Repair the frozen-lockfile/CI contract and execute CI.
4. Remediate mobile token storage and notification lifecycle.
5. Continue authorization, rate-limit, ownership, and operational-script closure.
