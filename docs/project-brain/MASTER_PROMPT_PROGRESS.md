# MYPA Master Prompt Progress

Last updated: 2026-09-12
Review status: IN_PROGRESS

## Purpose

This document tracks post-Appendix product-development work against the MYPA Master Prompt vision. It does not override `docs/05_CURRENT_STATE.md` or the canonical findings register.

## Baseline

- Appendix remediation: complete for the recoverable PB-156..PB-257 catalog; new product-development findings are now tracked in the Appendix as PB-258+.
- Backend and Mobile CI have repeatedly passed through the Master-0003 tree; the latest HEAD continues through fresh validation after subsequent changes.
- Project Brain source-level audit: reconciled to available repository evidence.
- Product readiness is not 100%; remaining work includes deeper mobile journeys, central/local Brain orchestration, full nutrition/food budget loop, global intelligence depth, offline behavior, voice/action UX, production validation and future integrations.

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

### MASTER-0004 — Nutrition/Food → Pantry/Inventory → Shopping → Budget
Status: IN_PROGRESS.

Completed in this slice:
- Shopping Intelligence facade is now connected to the canonical user-scoped `ShoppingService.smartList()` and `ShoppingService.listBasket()` instead of returning a placeholder empty plan.
- `GET /shopping-intelligence` is now protected by `JwtAuthGuard` and passes `req.user.id` into the service.
- Direct Shopping Intelligence service/controller tests were added.
- Shopping budget calculations now preserve a requested budget currency, ignore mismatched quotes, and keep incompatible prices out of returned budget values.
- Basket decisions now apply the remaining budget sequentially across items.
- `wait`/`compare_more` decisions do not consume committed basket budget; only `buy_now` selections become `selectedPrice`/cost.
- Inventory intelligence was moved to the Inventory domain to break a real module cycle; the old path remains a compatibility re-export.
- Canonical Inventory intelligence is registered/exported once and consumed by Shopping Intelligence through `InventoryModule`.

Current blocker / next contract:
- Price data is keyed by `PriceTrackedProduct.productKey` while recipe ingredients reference `FoodItem.id`; no persisted verified mapping currently exists between those domains. Budget estimation must not use fuzzy matching. A small explicit FoodItem→PriceTrackedProduct mapping contract is the next data-model step before end-to-end recipe-cost budgeting can be claimed complete.

Validation:
- Latest completed product validation before the newest documentation-only changes is recorded in the CI history above.
- Fresh CI for the current HEAD is required after the latest Shopping Intelligence/module-graph changes before this batch can be marked VERIFIED_BY_TEST.

## Current architectural decisions

- Deterministic local Brain context remains provider-independent and cloud-AI-free.
- Hard allergy/diet filtering is allowed only when canonical ingredient safety evidence exists; unknown ingredient safety remains a hard stop.
- Safety taxonomy is an ingredient-level evidence layer, not a substitute for complete regulatory/allergen coverage.
- Shopping Intelligence must reuse the canonical Shopping/Inventory domains rather than maintain a parallel user-data implementation.
- Currency mismatch is fail-closed for budget calculations; no implicit FX conversion occurs unless an explicit fresh-rate contract is present.
- Module ownership follows domain direction: Inventory owns inventory intelligence; Shopping Intelligence orchestrates shopping behavior and may depend on Inventory, but Inventory must not depend back on Shopping Intelligence.

## Next

`MASTER-0004` continues with an explicit FoodItem→PriceTrackedProduct mapping contract, then recipe missing-ingredient costing, budget planning, shopping generation, and finally the mobile user journey with loading/empty/error/offline states.

## Evidence boundary

The repository is being modified on `audit/project-brain-2026-09-11`. No automatic merge to `main` is performed. Production/deployed infrastructure and physical-device behavior remain outside the available runtime unless explicitly validated.
