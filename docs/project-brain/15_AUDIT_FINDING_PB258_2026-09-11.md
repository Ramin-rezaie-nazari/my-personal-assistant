# PB-258 — Notification device disable lacked authenticated-user ownership enforcement

Status: REMEDIATED — runtime verification pending

## Location
- `apps/backend/src/modules/personal-brain/controllers/personal-brain.controller.ts`
- `apps/backend/src/modules/personal-brain/services/notification-device-registry.service.ts`

## Problem
The authenticated `POST /personal-brain/coach/device/disable` endpoint previously accepted an arbitrary `deviceId` and called the registry's global `disable(id)` operation without checking that the target device belonged to the authenticated user.

## Evidence
The device registry stores `userId` on each device, but the previous controller call did not supply or verify that owner. The registry also exposes user-scoped listing, demonstrating that ownership is part of the device model. The remediation adds `disableForUser(id, userId)` and makes the controller pass `req.user.id`.

## Impact
An authenticated user who knew another device identifier could disable that device. Device IDs are sequential in the in-memory registry, so authorization must not rely on obscurity of the identifier.

## Remediation
- Added ownership-scoped `disableForUser()`.
- Updated the authenticated controller path to enforce `req.user.id` ownership.
- Preserved the unscoped `disable()` method for trusted infrastructure paths such as push-token health handling.
- Added a regression test covering cross-user disable rejection.

## Verification boundary
Tests were added but not executed in this environment because the local pnpm/toolchain installation is unavailable and network access is blocked. CI/runtime verification remains required.
