# CI/runtime verification findings — 2026-09-12

## CI-RUNTIME-001 — UserBehavior schema/migration drift

- Status: REMEDIATED / RUNTIME VERIFIED
- Location: Prisma schema, historical migration chain, `20260911123000_add_user_time_indexes`, `20260912070000_add_user_behavior_table`
- Evidence: clean GitHub Actions backend migration run first failed with PostgreSQL `42P01 relation "UserBehavior" does not exist`; the repaired follow-up run applied all migrations successfully and the idempotency pass reported no pending migrations.

## CI-RUNTIME-002 — Backend build contract drift

- Status: REMEDIATED / RUNTIME VERIFIED
- Evidence: real backend CI build exposed six TypeScript contract errors: unsupported Nest exception class, optional fitness duration mismatch, missing fitness unlock list contract, missing workout recent/record contract, missing coach message build contract.
- Remediation: source fixes applied and the backend build subsequently passed on the audit branch.

## CI-RUNTIME-003 — Mobile dependency/API/typecheck drift

- Status: REMEDIATED / RUNTIME VERIFIED
- Evidence: earlier mobile CI exposed missing native dependencies/APIs and TTS/voice typing issues.
- Remediation: voice-language, native dependency declarations and remaining Expo/API/type issues were reconciled; the latest Mobile CI run completed successfully.

## CI-RUNTIME-004 — Refresh-token rotation generated an identical JWT

- Status: REMEDIATION APPLIED / RERUN PENDING
- Severity: HIGH
- Location: `apps/backend/src/modules/auth/utils/token.utils.ts`, refresh-token rotation E2E (`apps/backend/test/auth.e2e-spec.ts`).
- Evidence: Backend CI run `34683988209` passed dependency installation, Prisma validation/generation, all 42 migrations plus idempotence, food-intelligence self-test, build, and all 157 unit suites / 421 tests, but the auth E2E rotation case failed because `rotated.refreshToken` was identical to the original token.
- Root cause: the refresh JWT payload contained only stable `sub`/`type` claims plus the same expiration window, allowing two refresh tokens generated in the same second to be byte-for-byte identical.
- Remediation: `createRefreshToken()` now includes a per-token random `jti` generated with `randomUUID()`, guaranteeing token uniqueness while preserving normal JWT verification semantics.
- Verification: a new CI cycle must confirm the auth E2E rotation test passes after commit `cc0ade393c25e6212b6b9ce91c8b849bb1b05ec1`.
