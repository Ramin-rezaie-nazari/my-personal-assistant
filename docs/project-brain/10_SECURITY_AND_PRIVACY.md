# Security and Privacy

Last updated: 2026-09-11
Review status: IN_PROGRESS
Scope actually read: current-`main` Core auth/account/controller/DTO source.
Scope not yet read: global validation pipe, rate limiting, all authorization, config/secret handling, logs, retention, mobile storage and device privacy boundaries.
Evidence roots: `apps/backend/src/modules/auth/`; `users/`; `profile/`; `preferences/`; `onboarding/`; `settings/`; device intelligence.
Confidence level: MEDIUM for password/JWT/guard observations; LOW globally.
Open questions: refresh-session rotation; controller guards for device/logout/refresh; global auth/rate limiting; secret management; privacy/retention.

## Verified mechanisms

Argon2 is used for password hashing and verification. Evidence: `apps/backend/src/modules/auth/auth.service.ts:29-37`, `49-57`.

Access and refresh tokens use separate configured secrets. Refresh tokens carry `type: 'refresh'`. Evidence: `apps/backend/src/modules/auth/utils/token.utils.ts:4-28`.

JWT bearer authentication resolves the user through `UsersService.findById`. Evidence: `apps/backend/src/modules/auth/guards/jwt-auth.guard.ts:1-5`; `apps/backend/src/modules/auth/strategies/jwt.strategy.ts:1-25`.

## Audit findings

`POST /auth/refresh` and `POST /auth/logout` are not decorated with the JWT guard. Refresh does validate the refresh token and persisted session in the service; logout revokes by presented refresh token. Whether this is intentional and safe depends on the token model and global abuse controls, which remain unreviewed. Evidence: `apps/backend/src/modules/auth/controllers/auth.controller.ts:30-42`; `apps/backend/src/modules/auth/auth.service.ts:63-98`.

`DeviceIntelligenceController` exposes health-like data with no controller guard in the current source. The service currently returns placeholders, but authorization remains an open contract issue for any future real device data. Evidence: `apps/backend/src/modules/device-intelligence/controllers/device-intelligence.controller.ts:1-11`.

`CreateDeviceSyncDto` has no validation decorators. Evidence: `apps/backend/src/modules/device-intelligence/dto/create-device-sync.dto.ts:1-4`.

`AuthService.createAuthResponse()` computes a 30-day session `expiresAt` independently of configured JWT refresh expiry. This is a potential contract mismatch to verify, not yet classified as a bug. Evidence: `apps/backend/src/modules/auth/auth.service.ts:103-112`.
