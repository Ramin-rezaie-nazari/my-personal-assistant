# Remediation Batch 0035 — Auth abuse protection and mobile notification lifecycle

Date: 2026-09-11
Branch: `audit/project-brain-2026-09-11`

## Source remediation

### Backend auth abuse protection
- Added a dependency-free `AuthRateLimitGuard` for register/login/refresh/logout endpoints.
- Policy is 10 requests per minute per client IP and route, with `429 Too Many Requests` after the threshold.
- The guard is deliberately dependency-free because the workspace lockfile is currently mismatched; multi-instance production deployments must additionally enforce an equivalent shared/edge policy (Redis/API gateway) before this is considered a distributed runtime PASS.
- JWT refresh verification errors are still a source-level follow-up target because the current AuthService contract predates this batch; runtime verification remains required.

### Mobile notifications
- Root mobile layout now registers authenticated devices for push notifications after successful boot.
- Expo project ID is read from the app configuration rather than duplicated in source.
- Push-token refresh listener is attached for the authenticated session and cleaned up on unmount.
- Notification registration is fail-open: permission/network/config failures do not block app startup.

## Verification boundary

The source contracts are updated, but this batch is not a runtime PASS. Mobile permission prompts, Expo token issuance, backend device registration, logout/disable lifecycle, and multi-instance rate-limit behavior require executable/device/environment validation.

## Remaining critical work

1. Secure mobile access/refresh token persistence without weakening lockfile integrity.
2. Consolidate all mobile auth/401 refresh paths around the canonical API session layer.
3. Complete backend authorization/IDOR sweep and remaining security middleware/header/CORS checks.
4. Close operational recipe script reliability findings.
5. Regenerate/validate lockfile with pnpm and rerun CI.
6. Run backend/mobile test suites, Prisma migration/query-plan checks, and targeted security regressions.
7. Final canonical findings reconciliation and closure gate.

## Status

**Not 100% yet.** This batch materially closes source-level gaps but intentionally leaves runtime/environment gates open until they are actually executed.
