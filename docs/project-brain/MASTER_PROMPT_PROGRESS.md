# MYPA Master Prompt Progress

Last updated: 2026-09-12
Review status: IN_PROGRESS

## Purpose

This document tracks the post-Appendix product-development work against the MYPA Master Prompt vision. It does not override `docs/05_CURRENT_STATE.md` or the canonical findings register.

## Baseline

- Appendix remediation: complete for the recoverable PB-156..PB-257 catalog.
- Backend CI: green on the verified Master-0002 tree.
- Mobile CI: green on the verified Master-0002 tree.
- Project Brain source-level audit: reconciled to available repository evidence.
- Product readiness is not 100%; remaining work is integrated mobile journeys, central/local brain depth, global food intelligence depth, offline behavior, voice/action UX, production validation and future integrations.

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
Status: VERIFIED_BY_TEST.

Changes:
- `LocalLanguageUnderstandingService` extracts household size, budget amount/currency, protein target, calorie target, dietary preferences, allergy context, time/duration, food and core assistant intents.
- Persian numeric normalization and label-first numeric target parsing are covered.
- `PlanningService` propagates structured local entities into actionable plan steps.
- `AssistantService` merges contextual-command and local-understanding entities before planning and passes local understanding/plan context into execution.
- `DecisionActionAdapter` now type-checks advertised action capability metadata.
- `LocalMealRecommendationActionAdapter` exposes `recommend_meal`, passes supported nutrition constraints into `FoodOperatingLoopService`, and fails closed when allergy/diet constraints lack verified canonical data support.
- Direct tests cover local parsing, planning propagation, action capability registration and recommendation safety behavior.

Validation:
- Backend CI `34686237627`: SUCCESS.
  - migrations + idempotence: PASS
  - food-intelligence self-test: PASS
  - backend build: PASS
  - 427/427 backend unit tests: PASS
  - API E2E: PASS
- Mobile CI `34686237631`: SUCCESS.
  - install/typecheck/source tests/Jest specs/Expo validation/Android JS bundle: PASS

## Current architectural decision

Do not claim allergy/diet hard-filtering is implemented merely because local language understanding recognizes those constraints. The recommendation engine must have verified recipe/ingredient safety semantics before it can return results under such constraints. Until then, execution fails closed.

## Next

`MASTER-0003`: create the verified recipe/ingredient safety-taxonomy contract. First inspect the existing ingredient taxonomy, resolver aliases and import pipeline to determine whether a deterministic mapping can be derived without a schema change. If the existing data cannot represent verified per-FoodItem safety flags, add the smallest backward-compatible model/migration needed, populate it only from trusted deterministic inputs, and add hard-filter integration tests.

## Evidence boundary

The repository is being modified on `audit/project-brain-2026-09-11`. No automatic merge to `main` is performed. Production/deployed infrastructure and physical-device behavior remain outside the available runtime unless explicitly validated.
