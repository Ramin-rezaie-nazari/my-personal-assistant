# MYPA Master Prompt Progress

Last updated: 2026-09-12
Review status: IN_PROGRESS

## Purpose

This document tracks the post-Appendix product-development work against the MYPA Master Prompt vision. It must not override `docs/05_CURRENT_STATE.md` or the canonical findings register.

## Baseline

- Appendix remediation: complete for the recoverable PB-156..PB-257 catalog.
- Backend CI: previously verified green on the remediation tree; a fresh verification run is in progress for the current product changes.
- Mobile CI: previously verified green on the remediation tree.
- Project Brain source-level audit: reconciled to available repository evidence.
- Product readiness is not 100%; remaining work is primarily integrated mobile journeys, central/local brain depth, global food intelligence depth, offline behavior, voice/action UX, production validation and future integrations.

## Product workstream order

1. Auth → onboarding → home/command-center vertical journey
2. Assistant Brain: intent/entity/context → decision/planning → tool execution → explanation → memory
3. Nutrition/Food → recipes → pantry → shopping → budget loop
4. Fitness/health → plans → tracking → reminders/notifications
5. Globalization/localization/currency/timezone/locale consistency
6. Offline/local-first capabilities
7. Voice and local TTS/STT consumer journey
8. Production hardening, observability, device/store validation
9. Subscription-ready commercial boundaries

## Current batches

### MASTER-0001 — baseline reconciliation
Status: COMPLETE.

### MASTER-0002 — deterministic local Brain context
Status: IMPLEMENTED — VALIDATION IN PROGRESS.

Changes:
- `LocalLanguageUnderstandingService` now extracts household size, budget amount/currency, protein target, dietary preferences and allergy context in addition to existing intent/entity parsing.
- Persian label-first numeric targets such as `پروتئین 120 گرم` and `کالری 1800` are supported.
- `PlanningService` accepts and carries structured local entities into actionable plan steps.
- `AssistantService` merges contextual-command entities with local-understanding entities before planning, so local constraints become planning context rather than metadata-only decoration.
- Added direct tests for local constraint extraction and planner entity propagation.

Validation:
- Backend CI for the latest product-change tree is running through PR #70.
- Build, Prisma validation/generation, migrations/idempotence and food self-test have already passed in the currently observed Backend CI run before the remaining unit/E2E gates.
- Fresh unit/E2E result for the latest commit is still pending and must not be called green early.

## Next

After MASTER-0002 is fully verified, continue the Brain vertical journey by connecting structured local constraints to domain recommendation/planning decisions and then exposing the resulting capabilities coherently through the Mobile Assistant/Command Center flow.

## Evidence boundary

The repository is being modified on `audit/project-brain-2026-09-11`. No automatic merge to `main` is performed. Production/deployed infrastructure and physical-device behavior remain outside the available runtime unless explicitly validated there.
