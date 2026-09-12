# MYPA Master Prompt Progress

Last updated: 2026-09-12
Review status: IN_PROGRESS

## Purpose

This document tracks post-Appendix product-development work against the MYPA Master Prompt vision. It does not override `docs/05_CURRENT_STATE.md` or the canonical findings register.

## Baseline

- Appendix remediation is complete for the recoverable PB-156..PB-257 catalog; new product-development findings are tracked in the same Appendix from PB-258 onward.
- Backend and Mobile CI have passed on the verified MASTER-0004 code tree.
- Project Brain source-level audit is reconciled to available repository evidence.
- Product readiness is not 100%; remaining work includes the rest of the Food OS vertical, deeper central/local Brain orchestration, full mobile journeys, offline behavior, voice/action UX, global intelligence depth, production validation and future integrations.

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

Completed:
- local Persian/English normalization;
- core intent classification;
- household size, budget amount/currency, protein, calorie, time/duration extraction;
- dietary preference and allergy detection;
- local/contextual entity merge into PlanningService and executable steps;
- central recommendation action registration;
- Brain → Food Operating Loop connection;
- fail-closed unsupported allergy/diet handling.

### MASTER-0003 — recipe/ingredient safety taxonomy
Status: VERIFIED_BY_TEST.

Completed:
- taxonomy-backed canonical ingredient safety resolver;
- explicit known/unknown semantics;
- supported hard filters where canonical evidence exists;
- fail-closed unknown behavior;
- safety filtering before scoring;
- deterministic build asset packaging;
- direct resolver/service coverage.

Validation:
- Backend CI `34686577253`: SUCCESS.
- Mobile CI `34686577182`: SUCCESS.

### MASTER-0004 — Nutrition/Food → Pantry/Inventory → Shopping → Budget
Status: BACKEND SLICE VERIFIED_BY_CI; FULL VERTICAL IN PROGRESS.

Verified code tree: `975cdf1ef8c51f33f34634a7f9cdbeec0e8c9651`.

Completed and verified:
- active Shopping Intelligence facade delegates to canonical user-scoped ShoppingService;
- `GET /shopping-intelligence` is JWT protected;
- direct Shopping Intelligence service/controller tests;
- currency-safe shopping budget semantics;
- sequential remaining-budget accounting;
- only committed `buy_now` selections consume committed basket cost;
- Inventory intelligence owned by Inventory domain, removing the real module cycle;
- canonical `PriceProductKeyService` for deterministic `FoodItem.name → PriceTrackedProduct.productKey` mapping using the existing locale-aware contract;
- deterministic `BudgetIntelligenceService.createPlan()` using user-scoped inventory and compatible price snapshots;
- exact unit/currency compatibility checks;
- seven-day price freshness boundary;
- explicit price provenance (`priceSourceId`, `priceObservedAt`);
- explicit `price_unavailable`, `currency_mismatch`, `unit_mismatch`, `stale_price`, and `over_budget` states;
- authenticated `/budget-intelligence/plan` route;
- local `PLAN_FOOD_BUDGET` intent and Brain execution action wiring through the Assistant/local provider path;
- authenticated and unauthenticated API E2E coverage for Shopping Intelligence and Budget Plan;
- regression coverage for the budget status semantics and canonical price-key normalization.

Validation on the verified code tree:
- Backend CI `34688334661`: SUCCESS — dependency install, Prisma validate/generate, migrations/idempotence, food self-test, backend build, unit tests, API E2E.
- Mobile CI `34688334655`: SUCCESS — dependency install, typecheck, source tests, committed Jest specs, Expo validation, Android JS bundle.

Post-verification documentation reconciliation is intentionally tracked separately; code readiness remains tied to the verified code tree above until the documentation-only HEAD receives its normal CI validation.

Current remaining work inside MASTER-0004:
- connect recipe scaled/missing ingredients directly to deterministic budget costing;
- connect budget results to shopping generation as one coherent domain journey;
- broaden price coverage and multi-source freshness handling;
- remove remaining stale/placeholder-level Budget/Shopping artifacts where they are not active consumers;
- complete Mobile Budget/Shopping UX and offline states;
- add richer end-user explanations and actionable alternatives when price evidence is missing or budget is insufficient.

## Current architectural decisions

- Deterministic local Brain remains provider-independent and cloud-AI-free.
- Hard allergy/diet filtering is permitted only from canonical safety evidence; unknowns block constrained recommendations.
- Shopping Intelligence reuses canonical Shopping/Inventory data services rather than maintaining parallel persistence logic.
- Currency mismatch is fail-closed; no implicit FX conversion without an explicit fresh-rate contract.
- Inventory owns inventory intelligence; Shopping Intelligence depends on Inventory and must not create a reverse module dependency.
- Monetary estimates use deterministic FoodItem-name product-key mapping only; fuzzy matching is forbidden for money.
- Price freshness is bounded to seven days for Budget planning; stale snapshots do not become current costs.
- `PLAN_FOOD_BUDGET` is an executable local Brain action, not merely a parser label.
- Budget/Shopping HTTP routes must pass both unauthenticated security checks and authenticated user-scoped E2E checks.

## Next

`MASTER-0004` next slice: recipe missing-ingredient → verified price → budget impact → shopping generation, then the corresponding mobile user journey.

## Evidence boundary

Repository/source and the cited GitHub Actions runs are verified. Production/deployed database/RLS/storage state, physical-device UX, push delivery, external provider quotas and store-release validation remain outside the current runtime boundary.
