# Remediation Batch 0034 — Timezone semantics, privacy, and stale API surfaces

Date: 2026-09-11
Branch: `audit/project-brain-2026-09-11`

## Completed source remediation

### User-timezone semantics
- Daily implicit date keys now resolve through persisted `UserSettings.timezone`.
- Dashboard meal/workout day boundaries now use user-local midnight converted to UTC; workout active days use user-local date keys.
- Daily Command Center now derives its date and UTC day bounds from the user timezone.
- Workout weekly summaries now use user-local week boundaries and local active-day keys.
- Adaptive Learning now uses the user timezone for its seven-day window and workout-day aggregation.
- Habits current-day completion, weekly windows, and streaks now use the user timezone.
- Nutrition implicit date keys now use the user timezone.
- Supplements current-day reads/writes now use the user timezone.
- Smart Notifications now resolve the current local day and workout window using the user timezone.
- Personal Brain daily status and life-context weekly windows now use user-local date semantics.
- Smart Planning and Full Day Scheduler now interpret day/hour scheduling in the user timezone.
- Workout action date/time parsing now interprets explicit times in the user's timezone instead of treating them as UTC.
- Meal creation now derives an implicit `dateKey` from the meal instant in the user's timezone.
- Shared `user-time.ts` now exposes user-local hour/weekday conversion in addition to date-key and zoned datetime helpers.

### Account erasure
- Added authenticated `DELETE /users/me` account-erasure endpoint.
- Added canonical `UsersService.deleteAccount()` using the Prisma `User` deletion graph.
- Existing modeled user relations use database cascades; the final migration/external-storage coverage still requires runtime/database verification before PASS.
- Removed the obsolete duplicate `UsersController` source.

### Health/API hygiene
- Restored a public `GET /health` liveness endpoint on the active Health controller.
- Kept health/nutrition profile mutations and reads behind `JwtAuthGuard`.
- Removed obsolete duplicate root Health controller/service/specs.
- Added active Health controller unit coverage and E2E liveness coverage.
- Removed the empty Context Engine HTTP controller and its module registration; the context engine remains available as an internal provider surface.
- Removed the obsolete root Hello World controller/service and test in the previous batch.

### Recipe workflow contract
- Added missing `recipe:content:import` and `recipe:content:audit` package scripts pointing to the existing recipe-content scripts used by `recipe-content-release.yml`.
- This closes the package-script/workflow contract mismatch at source level; the frozen-lockfile CI gate remains separate and still needs execution.

## Verification boundary

No claim of global PASS is made. Current connector access can modify/read GitHub source but cannot install the repository dependency graph or execute the deployed PostgreSQL/Supabase/mobile runtime. The relevant runtime gates remain pending.

## Remaining high-priority work

1. Complete remaining authorization/rate-limit/ownership findings and security middleware review.
2. Complete mobile auth token storage, refresh/retry path, notifications, localization/RTL, hook-order, and test-runner remediation.
3. Complete remaining recipe operational script correctness/restartability/idempotency findings.
4. Repair/regenerate the workspace lockfile and run CI.
5. Execute Prisma migrations/query-plan validation and targeted runtime failure-injection tests.
6. Reconcile the canonical findings Appendix and final closure ledger after runtime gates.

## Status

This batch is **source-remediated but not globally verified**. The project is not labeled 100% until applicable source, CI, database, HTTP, mobile-device, and external-service gates pass or are explicitly closed as genuine external boundaries.
