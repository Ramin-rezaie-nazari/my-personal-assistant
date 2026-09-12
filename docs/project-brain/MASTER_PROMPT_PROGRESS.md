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
Status: CORE RECIPE→BUDGET→SHOPPING JOURNEY VERIFIED_BY_CI; FULL VERTICAL IN PROGRESS.

Verified code tree: `c493e3fb470f391d3b21cad28788046a57f5e570`.

Completed and verified:
- active Shopping Intelligence facade delegates to canonical user-scoped ShoppingService;
- JWT/user scoping for Shopping Intelligence and Budget Plan routes;
- currency-safe shopping budget semantics;
- sequential remaining-budget accounting and committed `buy_now` semantics;
- Inventory intelligence owned by Inventory domain, removing the module cycle;
- deterministic FoodItem-name → PriceTrackedProduct product-key normalization through `PriceProductKeyService`;
- deterministic Budget plan and arbitrary recipe-item quote engine;
- exact currency/unit compatibility, seven-day freshness, price provenance and explicit blocked evidence states;
- canonical `deriveBudgetStatus()` with `within_budget`, `over_budget`, `partial_price_evidence`, `insufficient_price_data` semantics;
- Food Operating Loop consumes canonical scaled recipe quantities, resolves inventory gaps, quotes missing ingredients deterministically, and sends only verified `priced` items into Shopping;
- authenticated recipe budget and budget-qualified-shopping endpoints with direct controller/API E2E coverage;
- Mobile Recipe Budget journey with servings/budget/currency inputs, evidence-aware result states, loading/error handling, RTL/i18n and Smart Basket handoff;
- Mobile Shopping/Price clients reuse canonical authenticated transport with locale-aligned product-key normalization;
- mobile source-smoke and Jest coverage for the new Budget route/transport contract.

Validation on the verified code tree:
- Backend CI `34689456388`: SUCCESS — dependency install, Prisma validate/generate, migrations/idempotence, food self-test, build, unit tests, API E2E and diagnostics.
- Mobile CI `34689456439`: SUCCESS — dependency install, typecheck, source tests, committed Jest specs, Expo validation, Android JS bundle.

Current remaining work inside MASTER-0004:
- broaden price coverage and deterministic multi-source freshness/selection;
- audit and remove any remaining stale non-consuming Budget/Shopping artifacts;
- richer end-user explanations and actionable alternatives for missing/stale/incompatible price evidence;
- complete offline/local-first behavior for Budget/Shopping and the broader Food OS journey;
- full Pantry↔Shopping lifecycle completion, including user-visible edits and reconciliation states.

## Current architectural decisions

- Deterministic local Brain remains provider-independent and cloud-AI-free.
- Hard allergy/diet filtering is permitted only from canonical safety evidence; unknowns block constrained recommendations.
- Shopping Intelligence reuses canonical Shopping/Inventory data services rather than maintaining parallel persistence logic.
- Currency mismatch is fail-closed; no implicit FX conversion without an explicit fresh-rate contract.
- Inventory owns inventory intelligence; Shopping Intelligence depends on Inventory and must not create a reverse module dependency.
- Monetary estimates use deterministic FoodItem-name product-key mapping only; fuzzy matching is forbidden for money.
- Price freshness is bounded to seven days for Budget planning; stale snapshots do not become current costs.
- Recipe scaling is canonical and occurs before inventory-gap and budget calculation.
- Budget is the pricing/evidence engine; Food Operating Loop owns recipe orchestration and Shopping integration.
- Only verified `priced` recipe gaps may be automatically inserted into Shopping.
- Partial price evidence is surfaced explicitly rather than presented as a complete budget result.

## Next

`MASTER-0004` next slice: price-source breadth + freshness/selection intelligence + actionable alternatives, followed by offline/local-first Budget/Shopping states and full Pantry↔Shopping reconciliation.

## Evidence boundary

Repository/source and the cited GitHub Actions runs are verified. Production/deployed database/RLS/storage state, physical-device UX, push delivery, external provider quotas and store-release validation remain outside the current runtime boundary.