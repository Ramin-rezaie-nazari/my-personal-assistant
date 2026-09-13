# Audit Findings Appendix

Last updated: 2026-09-13
Review status: FINAL VERIFICATION / EVIDENCE-LIMITED DEPLOYMENT ITEMS REMAIN

This file is the canonical current status of the findings catalog covered by the 2026-09-11 source audit. The original `OPEN` labels below represented the state at audit time. Where current source and CI evidence now disprove the original defect, the finding is marked `CLOSED — REMEDIATED`. Withdrawn/reclassified findings are preserved explicitly and are not counted as open work.

## Current status — PB-156 through PB-257

All findings in PB-156 through PB-257 are already reconciled in this appendix as CLOSED, NOT APPLICABLE, WITHDRAWN, RECLASSIFIED, or EVIDENCE-LIMITED historical-record items. None is an active code defect.

## New hardening findings — PB-258 through PB-267

| Finding | Current status | Resolution / current evidence |
|---|---|---|
| PB-258 | CLOSED — REMEDIATED | `DecisionExecutionController.confirm` now uses `DecisionConfirmDto` with runtime token validation. |
| PB-259 | CLOSED — REMEDIATED | Calisthenics session/coach request bodies now use bounded runtime DTOs. |
| PB-260 | CLOSED — REMEDIATED | Yoga session/coach/cue/motion request bodies now use runtime validation. |
| PB-261 | CLOSED — REMEDIATED | Calendar event PATCH now uses `UpdateCalendarEventDto` with bounded text and ISO timestamp validation. |
| PB-262 | CLOSED — REMEDIATED | Personal Brain and User Intelligence/Recommendation action endpoints now use dedicated runtime DTOs. |
| PB-263 | CLOSED — REMEDIATED | Mobile brain-execution access/refresh credentials now use `expo-secure-store` with device-only keychain accessibility and both credentials are cleared on refresh failure. |
| PB-264 | CLOSED — REMEDIATED | Recipe inventory matching now converts compatible metric mass/volume/count units and rejects incompatible dimensions. Regression coverage includes kg→g and incompatible ml→kg cases. |
| PB-265 | CLOSED — REMEDIATED | `PersonalBrainController` now uses a normal runtime import for `DecisionExecutionCoordinatorService`, restoring Nest runtime DI metadata and full application bootstrap. |
| PB-266 | CLOSED — REMEDIATED | `DecisionFeedbackController` now uses `DecisionFeedbackDto` with runtime validation for candidate, outcome, reward and note bounds. |
| PB-267 | CLOSED — REMEDIATED | `MemoryIntelligenceController` now uses `RememberMemoryDto` with runtime validation for memory type, key, value and importance. |

## Historical catalog boundary

The exact prose of PB-001 through PB-155 is not recoverable from the repository history exposed to the remediation environment. The missing historical text is not reconstructed or invented. This is an evidence limitation, not an active code defect.

## Verification boundary

The latest Backend CI verification line is GREEN through dependency installation, Prisma schema validation/generation, migration application/idempotence, food-intelligence self-test, backend build, unit tests and API E2E. The latest Mobile CI verification line is GREEN through frozen-lockfile installation, typecheck, source tests, committed Jest specs, Expo validation and Android JavaScript bundling.

The canonical Android APK workflow remains the native-build evidence path. It performs Expo native project generation and a real Gradle `assembleDebug` build, but the available successful native run predates the exact latest `main` verification commit. Therefore native latest-commit evidence remains explicitly open rather than being falsely marked green.

Local repository execution is unavailable because direct GitHub network access is blocked in the container environment. Production Supabase/Auth/Storage state, RLS configuration, push delivery and real-device UX remain outside the available runtime boundary.
