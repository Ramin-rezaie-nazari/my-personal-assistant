# Security and Privacy

Last updated: 2026-09-13
Review status: FINAL VERIFICATION / EVIDENCE-LIMITED DEPLOYMENT ITEMS REMAIN

This document reflects current-main source and the remediation evidence recorded in `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md`. Historical findings that were remediated are not repeated here as active defects.

## Verified mechanisms

- Argon2 is used for password hashing and verification.
- Access and refresh JWTs use separate configured secrets and refresh tokens carry an explicit refresh type.
- `JwtStrategy.validate()` resolves the authenticated user through `UsersService.findById()`.
- Global `ValidationPipe` enables whitelist/forbid-non-whitelisted validation with transformation.
- Authentication/session hardening includes refresh-session invalidation/rotation and one-way persisted refresh-token hashes.
- Persisted refresh-session expiry is derived from the configured refresh-token lifetime.
- Application bootstrap includes authentication rate limiting and security headers.
- Device Intelligence and fitness boundaries use authenticated user identity.
- Destructive image reset and related operational flows require explicit confirmation where applicable; storage enumeration is paginated.
- Mobile auth credentials are stored with `expo-secure-store`; the independent brain-execution refresh path also uses secure storage and clears both credentials on refresh failure.
- Mobile TTS model preparation pins revisions and verifies SHA-256 checksums.
- Mobile CI executes source tests, committed Jest specs, typecheck/config/export validation and Android JS bundling.
- Backend CI verifies dependency installation, Prisma schema generation, migrations/idempotence, food-intelligence self-test, build, unit tests and API E2E on the verified remediation line; newer commits must retain their own green CI evidence.

## Current verification boundary

Repository-level authentication, validation, ownership, persistence and CI-covered security behavior are substantially remediated. The canonical current finding status is maintained in `15_AUDIT_FINDINGS_APPENDIX.md`.

The remaining security/privacy work is evidence collection rather than an assumed production pass:

1. Verify the latest Backend CI after the newest test fix through API E2E.
2. Verify the latest canonical Android APK/native build against the latest `main`.
3. Confirm deployed Supabase/Postgres RLS, Storage and service-role boundaries in the actual environment.
4. Validate production edge rate limiting, CORS/security headers and abuse controls.
5. Exercise real-device notification, microphone/location/speech behavior and privacy-sensitive UX.
6. Perform production/runtime logging and exception-path review for accidental disclosure of credentials or private user context.

## Completion rule

Security/privacy is green only where source evidence and relevant automated/runtime/deployment evidence agree. Physical-device and production controls remain explicitly unvalidated until exercised in those environments.
