# MYPA Remediation Batch 0039 — 2026-09-12

## Scope
Continued the post-audit remediation/verification pass without treating source inspection as runtime proof.

## Project Brain documents re-read
The following canonical Project Brain documents were re-read before continuing:
- `docs/05_CURRENT_STATE.md`
- `docs/project-brain/00_PROJECT_OVERVIEW.md`
- `docs/project-brain/01_ARCHITECTURE_MAP.md`
- `docs/project-brain/02_BACKEND_MODULE_CATALOG.md`
- `docs/project-brain/03_MOBILE_FEATURE_CATALOG.md`
- `docs/project-brain/04_DATABASE_SCHEMA.md`
- `docs/project-brain/05_API_CATALOG.md`
- `docs/project-brain/06_DATA_FLOW_MAP.md`
- `docs/project-brain/07_AI_AND_DECISION_SYSTEM.md`
- `docs/project-brain/08_RECIPE_FOOD_SYSTEM.md`
- `docs/project-brain/09_TEST_AND_VALIDATION_MATRIX.md`
- `docs/project-brain/10_SECURITY_AND_PRIVACY.md`
- `docs/project-brain/11_REPOSITORY_AUDIT.md`
- `docs/project-brain/12_OPEN_WORK.md`
- `docs/project-brain/13_DECISION_LOG.md`
- `docs/project-brain/14_CHANGELOG.md`
- `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md`

The older documents contain stale audit-era statuses that must not override newer source/runtime evidence. The Appendix remains canonical for finding identity; remediation status must be reconciled explicitly before final closure.

## Source remediations completed in this batch

1. **PB-160 / LifeTasks completion timestamp**
   - Fixed `LifeTasksService.update()` so metadata-only edits to an already-completed task preserve the existing `completedAt` instead of replacing it with `new Date()`.
   - Transition into `completed` gets a fresh timestamp; transition away from `completed` clears it.

2. **PB-057/PB-240 / Price Intelligence authorization boundary**
   - Added `JwtAuthGuard` to the Price Intelligence controller.
   - Operational collection, preview and product matching endpoints are no longer anonymously reachable at the controller boundary.

3. **PB-058/PB-059 / Price currency integrity**
   - HTTP price normalization now preserves explicitly supplied non-IRR currencies instead of forcing every source observation to IRT.
   - IRR is still normalized to IRT by the existing 10:1 rial/toman conversion rule.
   - Price analysis now scopes calculations to the currency of the latest observation and does not mix incompatible currencies in numeric averages/trends.

4. **PB-049/PB-066 / Shopping ownership**
   - `addToBasket()` now accepts only global FoodItems or FoodItems owned by the authenticated user.
   - `addRecipeMissing()` now accepts only global recipes or recipes owned by the authenticated user.
   - Its ingredient FoodItem lookup applies the same ownership boundary.
   - Existing transactional batch behavior is preserved.

5. **Backend CI test invocation**
   - Added `test:ci: jest --runInBand` to the backend package.
   - Backend CI now calls `pnpm test:ci` rather than passing an extra separator that Jest interpreted as a test-pattern argument.
   - Backend E2E workflow invocation was simplified to the package's already-configured `test:e2e` command.

6. **Mobile TTS type hardening**
   - `getAvailableVoices()` now normalizes the nullable Expo Speech result to `Voice[]`.
   - The Speech `onError` callback no longer introduces an implicit-`any` parameter.
   - Native/local TTS dependency availability remains an independent dependency/runtime issue; it is not falsely marked fixed here.

## Runtime/CI evidence obtained

Against the current remediation PR merge ref before the latest CI-command adjustment:
- Mobile dependency installation passed.
- Mobile typecheck failed on missing declared dependencies/API mismatches; no Expo bundle step ran.
- Backend dependency installation passed.
- Prisma schema validation passed.
- Prisma Client generation passed.
- All 42 migrations applied successfully to PostgreSQL 16.
- `prisma migrate status` reported the database up to date.
- A second `prisma migrate deploy` reported no pending migrations.
- Backend build passed.
- Backend unit-test gate reached Jest but failed because the workflow invocation caused Jest to receive `--` as a positional pattern and therefore reported no tests found. This is now source-remediated with the dedicated `test:ci` command.
- Backend E2E did not run in that attempt because the unit-test step failed first.

These are real CI observations, not source-level inference.

## Remaining verification blockers

- Re-run Backend CI after the test-command correction; unit and E2E results are not yet PASS.
- Mobile CI still needs dependency/API remediation before typecheck can pass.
- Mobile missing dependencies observed by CI include `expo-location`, `expo-speech`, and the local Persian TTS native dependency chain; `expo-av` is also obsolete for the project's Expo SDK generation and should not be blindly added back. This requires an intentional dependency/API migration rather than a fake type shim.
- Physical-device/native permission and push/TTS verification remains unavailable from the connector environment.
- Full historical PB-001..PB-155 Appendix prose reconciliation remains unresolved and must not be fabricated.

## Accuracy rule
No issue is marked PASS solely because a source edit exists. Runtime/test claims require corresponding execution evidence. No 100% completion claim is made in this batch.
