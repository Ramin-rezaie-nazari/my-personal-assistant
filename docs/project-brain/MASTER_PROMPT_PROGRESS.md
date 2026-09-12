# MYPA Master Prompt Progress

Last updated: 2026-09-12
Review status: IN_PROGRESS

## Purpose

This document tracks post-Appendix product-development work against the MYPA Master Prompt vision. It does not override `docs/05_CURRENT_STATE.md` or the canonical findings register.

## Baseline

- Appendix remediation: complete for the recoverable PB-156..PB-257 catalog.
- Backend CI: green on the current verified product tree.
- Mobile CI: green on the current verified product tree.
- Project Brain source-level audit: reconciled to available repository evidence.
- Product readiness is not 100%; remaining work is integrated mobile journeys, deeper central/local Brain behavior, global food-intelligence depth, offline behavior, voice/action UX, production validation and future integrations.

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
- `DecisionActionAdapter` type-checks advertised action capability metadata.
- `LocalMealRecommendationActionAdapter` exposes `recommend_meal`, passes supported nutrition constraints into `FoodOperatingLoopService`, and enforces fail-closed behavior where verified safety data is insufficient.

Validation:
- Backend CI `34686237627`: SUCCESS — migrations/idempotence, food-intelligence self-test, backend build, 427/427 unit tests and API E2E passed.
- Mobile CI `34686237631`: SUCCESS — install, typecheck, source tests, Jest specs, Expo validation and Android JS bundle passed.

### MASTER-0003 — recipe/ingredient safety taxonomy
Status: VERIFIED_BY_TEST.

Changes:
- Added `FoodSafetyTaxonomyService` backed by the canonical ingredient taxonomy's names, aliases and deterministic flags.
- Added explicit `known`/`unknown` resolution state and fail-closed evaluation when constrained recipes contain unknown safety ingredients.
- Implemented supported hard filters for milk/dairy, peanuts, tree nuts, fish, shellfish, vegan, vegetarian and gluten-free semantics where canonical flags exist.
- Integrated safety evaluation into `FoodOperatingLoopService.recommend()` before inventory/nutrition scoring so blocked recipes are not merely down-ranked.
- Connected the safety-aware recommendation path to the local Brain `recommend_meal` adapter.
- Added deterministic build packaging for the taxonomy asset and direct resolver/service test coverage.
- Preserved the boundary that this is not a claim of complete allergen coverage for every possible ingredient or production dataset.

Validation:
- Backend CI `34686577253`: SUCCESS — dependency installation, Prisma validation/generation, migrations/idempotence, food-intelligence self-test, build, unit tests and API E2E passed.
- Mobile CI `34686577182`: SUCCESS — dependency installation, typecheck, source tests, committed Jest specs, Expo validation and Android JS bundle passed.

## Current architectural decisions

- Deterministic local Brain context remains provider-independent and cloud-AI-free.
- Hard allergy/diet filtering is allowed only when canonical ingredient safety evidence exists; unknown ingredient safety remains a hard stop.
- Safety taxonomy is an ingredient-level evidence layer, not a substitute for complete regulatory/allergen coverage.

## Next

`MASTER-0004`: complete the Nutrition/Food → Pantry/Inventory → Shopping → Budget vertical journey. Connect recommendation results and missing-ingredient quantities into a user-scoped, provenance-preserving shopping/budget flow with deterministic currency semantics and explicit loading/empty/error/offline states.

## Evidence boundary

The repository is being modified on `audit/project-brain-2026-09-11`. No automatic merge to `main` is performed. Production/deployed infrastructure and physical-device behavior remain outside the available runtime unless explicitly validated.
