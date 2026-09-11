# MYPA — Master Remediation Execution Plan

Date: 2026-09-11
Branch: audit/project-brain-2026-09-11

## Purpose
This plan starts the post-audit remediation phase. The source-level audit is closed, but the product is not considered 100% complete until findings are remediated, tests/validation are run, and environmental blockers are explicitly closed or documented as external prerequisites.

## Rules
1. Preserve the canonical findings catalog and reconcile every status change.
2. Before changing architecture, database contracts, auth, or cross-module behavior, inspect consumers, migrations, tests, and API/mobile contracts.
3. Never claim runtime PASS from source inspection alone.
4. Prefer small, independently verifiable batches.
5. No production-source change is accepted without a verification path.
6. Security/data-integrity findings take precedence over cosmetic/design findings.
7. Withdrawn findings remain documented; they must not be silently deleted.

## Waves
### Wave 0 — Build/CI foundation
- Reconcile `apps/backend/package.json` and `pnpm-lock.yaml`.
- Verify all package scripts resolve to existing files.
- Re-run frozen install and applicable CI checks.
- Close PB-242 only after successful validation.

### Wave 1 — Authentication, authorization, privacy
- Refresh-session rotation/revocation/expiry.
- Secure refresh-token persistence and lifecycle.
- Ownership/IDOR/device authorization gaps.
- Account-erasure workflow and retention matrix.
- Rate limiting, public/debug/internal route exposure, and security middleware.

### Wave 2 — Data integrity and API contracts
- Transaction boundaries for coupled writes.
- DTO validation and ValidationPipe semantics.
- Prisma/migration-only model reconciliation where required.
- Inventory/unit/recipe/nutrition consistency.
- Meal/nutrition/daily-log consistency and deduplication.

### Wave 3 — Timezone/date semantics
- Establish user-local date/time contract.
- Repair UTC/server-local daily boundaries and schedulers.
- Verify persisted date keys and notification scheduling semantics.

### Wave 4 — Runtime architecture/wiring
- Runtime wiring of Intelligence modules.
- Context Engine and top-level controller artifacts.
- Duplicate/legacy execution paths.
- Placeholder services where required by the product contract.

### Wave 5 — Database performance and operational reliability
- Validate PB-257 with production-like row counts/query plans before index sizing.
- Repair restartability/checkpointing, pagination, idempotency, and destructive-script safeguards.
- Reconcile recipe intelligence/image/nutrition operational contracts.

### Wave 6 — Mobile/platform/test closure
- Auth token storage and refresh behavior.
- Notification/push runtime wiring.
- Voice/TTS dependency contracts.
- Localization/RTL.
- Mobile test runner/typecheck/test coverage.
- Onboarding persistence and route configuration.

### Final gate — Full verification
- Backend typecheck/lint/unit/e2e where executable.
- Mobile typecheck/tests/build where executable.
- CI frozen install and workflow verification.
- DB migration/schema validation.
- Security regression verification.
- Route↔DTO↔test↔mobile contract matrix refresh.
- Finding catalog: every item PASS/REMEDIATED, NOT_APPLICABLE, or explicitly BLOCKED with owner/prerequisite.
- Runtime/device/deployed Supabase/Postgres validation completed where access exists.
- Only then assess whether the project can truthfully be called 100% complete.

## Current starting point
Wave 0 is the first remediation gate. PB-242 has direct CI evidence: the main-branch workflow failed during `pnpm install --frozen-lockfile` because backend manifest specifiers diverge from the lockfile. No production-source remediation should be claimed until the lockfile is regenerated/validated by pnpm and CI succeeds.
