# Remediation Batch 0031 — Auth/session + notification-device ownership

Date: 2026-09-11
Branch: `audit/project-brain-2026-09-11`

## Completed

### Notification device ownership
- Added an authenticated-user-scoped `disableForUser()` operation to `NotificationDeviceRegistryService`.
- Updated `POST /personal-brain/coach/device/disable` to pass `req.user.id` and use the ownership-scoped operation.
- Preserved the unscoped internal `disable()` operation for infrastructure-driven permanent token invalidation.
- Added a regression test proving a different user cannot disable another user's device.

### Refresh-session lifecycle
- `SessionService.findByRefreshToken()` now requires an unexpired session (`expiresAt > now`).
- Added atomic refresh-session rotation using a Prisma transaction: delete the current session for the authenticated user and create exactly one replacement session.
- `AuthService.refreshToken()` now verifies that the JWT subject matches the persisted session owner.
- Refresh now issues a new refresh token and invalidates the old token; concurrent/replayed use of the old token fails once rotation wins.
- Added an auth e2e regression covering rotation, replay rejection, and successful use of the rotated token.

## Verification boundary

The repository connector does not provide a working local pnpm install/network in this environment, so these tests were added but not executed here. Runtime/CI execution remains required before marking these changes fully verified.

## Remaining auth work

Refresh tokens are still persisted in plaintext in the current Prisma `Session` schema. This batch intentionally did not perform the storage-format migration without first designing a backward-compatible migration/lookup strategy. That remains an open remediation item.

## Status

- Notification-device ownership: **REMEDIATED — runtime verification pending**
- Refresh rotation + persisted expiry enforcement: **REMEDIATED — runtime verification pending**
- Refresh-token plaintext persistence: **OPEN**
