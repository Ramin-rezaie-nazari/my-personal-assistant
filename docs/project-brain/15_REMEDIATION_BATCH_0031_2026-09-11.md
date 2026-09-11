# Remediation Batch 0031 — Security, Integrity, Timezone, API Contracts

Date: 2026-09-11
Branch: `audit/project-brain-2026-09-11`

## Completed source remediation

### Authentication/session hardening
- Session persistence now stores only SHA-256 refresh-token hashes.
- Refresh lookup enforces persisted `expiresAt`.
- Refresh rotation atomically deletes the presented session and creates the replacement; replay of the previous token is rejected.
- Session model uses `refreshTokenHash` as the unique persisted credential identifier.
- Auth E2E coverage includes rotation/replay behavior.

### Database integrity
- Goal check-in child/parent writes are now wrapped in one Prisma transaction.
- Shopping recipe-missing batch is now transactional so a mid-batch failure cannot leave partial basket mutations.
- Composite indexes were added for `Workout(userId, performedAt)` and `UserBehavior(userId, createdAt)`.

### Device ownership
- Authenticated notification-device disable route uses `disableForUser(deviceId, userId)`.
- Provider push-token invalidation now resolves the device owner and performs the ownership-explicit disable path.

### API validation
- `CreateGoalDto`, `UpdateGoalDto`, and `CheckinGoalDto` now contain class-validator metadata compatible with the global whitelist/forbidNonWhitelisted ValidationPipe.
- `CreateCalendarEventDto` now has runtime validation metadata.

### Timezone foundation
- Added shared `user-time.ts` helpers for user-local date keys and IANA timezone validation/local datetime conversion.
- Settings updates now reject invalid IANA timezone values.
- Goal check-in default `dateKey` now derives from the persisted user timezone rather than UTC.

## Finding reconciliation for this batch

- PB-172 / PB-208 / PB-209 / PB-187: source remediation implemented; runtime/auth integration verification remains required before final PASS.
- PB-235: source remediation implemented; runtime failure-injection verification remains required.
- PB-241: source remediation implemented; runtime transaction verification remains required.
- PB-257: source remediation implemented by schema + migration indexes; production query-plan/row-count validation remains required.
- PB-233: DTO contract remediation implemented; runtime HTTP verification remains required.
- PB-234: create DTO validation remediation implemented; runtime HTTP verification remains required.
- PB-247 / PB-168 / PB-221 / PB-238 remain broader timezone findings and are not falsely marked closed by the shared utility alone. Their individual service semantics still require migration to the user-timezone helper and tests.

## Verification boundary

This environment can inspect and modify repository source but cannot run the project's pnpm/Node dependency graph because pnpm/network installation is unavailable. GitHub Actions run `34613481370` remains evidence of the pre-remediation frozen-lockfile failure. Therefore source remediation is recorded separately from runtime PASS.

## Next priority

1. Finish timezone migration across daily/dashboard/adaptive-learning/workout/nutrition/habits/supplements/notifications/Smart Planning.
2. Finish high-risk auth/authorization findings and mobile secure-token transport.
3. Close account-erasure/retention workflow design and implementation.
4. Repair CI lockfile and release workflow contracts.
5. Close mobile notification lifecycle, API refresh/retry, localization/RTL, hook-order, and test-gate findings.
6. Re-run source-level reconciliation, then perform all available CI/runtime/database validation gates.

## Status

This batch is **source-remediated where listed, but not globally verified**. The project is intentionally not labeled 100% until runtime, CI, database, mobile-device, and external-service gates that are applicable can be executed and pass.
