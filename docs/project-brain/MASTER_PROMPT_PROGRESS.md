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

### MASTER-0003 — recipe/ingredient safety taxonomy
Status: VERIFIED_BY_TEST.

### MASTER-0004 — Nutrition/Food → Pantry/Inventory → Shopping → Budget
Status: RECIPE→BUDGET→SHOPPING JOURNEY + PRICE EVIDENCE CORE VERIFIED_BY_CI; FULL VERTICAL IN PROGRESS.

Verified code tree: `83fb230d1491240743edded9716f69e8475bc23c`.

Completed and verified:
- active Shopping Intelligence facade delegates to canonical user-scoped ShoppingService and is JWT protected;
- shopping budget preserves explicit currency, sequential remaining-budget accounting, and committed `buy_now` semantics;
- Inventory intelligence is owned by Inventory, removing the real module cycle;
- deterministic FoodItem-name → PriceTrackedProduct product-key mapping is centralized;
- Budget quote engine enforces exact currency/unit compatibility, seven-day freshness, provenance and explicit blocked evidence states;
- multi-source selection chooses the freshest compatible evidence that is still fresh, so a stale provider cannot mask a fresh provider;
- deterministic `deriveBudgetStatus()` exposes `within_budget`, `over_budget`, `partial_price_evidence`, and `insufficient_price_data`;
- deterministic `deriveBudgetNextActions()` exposes safe remediation actions without fabricating price alternatives;
- canonical recipe scaling feeds inventory-gap calculation, budget costing and budget-qualified shopping insertion;
- authenticated recipe budget and budget-shopping endpoints have direct controller/API E2E coverage;
- Mobile Recipe Budget journey has servings/budget/currency inputs, evidence-aware result states, loading/error handling, RTL/i18n and Smart Basket handoff;
- Mobile Shopping/Price clients reuse canonical authenticated transport and backend-aligned Persian key normalization;
- Mobile Jest native-storage mocks and source smoke coverage protect the Budget transport/route contract.

Validation:
- Backend CI `34689696683`: SUCCESS — Prisma validation/generation, migrations/idempotence, food self-test, build, unit tests, API E2E and diagnostics.
- Mobile CI `34689696652`: SUCCESS — typecheck, source tests, committed Jest specs, Expo validation and Android JS bundle.

## Current remaining work inside MASTER-0004

- richer end-user rendering of deterministic `nextActions` on Mobile Budget UI;
- audit and remove any remaining stale non-consuming Budget/Shopping artifacts;
- broader Pantry↔Shopping lifecycle reconciliation and user-visible edits;
- offline/local-first cache and explicit stale/offline states for Budget/Shopping;
- broader price-source coverage beyond the current persistence/selection contract.

## Current architectural decisions

- Deterministic local Brain remains provider-independent and cloud-AI-free.
- Hard allergy/diet filtering is permitted only from canonical safety evidence; unknowns block constrained recommendations.
- Shopping Intelligence reuses canonical Shopping/Inventory data services rather than maintaining parallel persistence logic.
- Currency mismatch is fail-closed; no implicit FX conversion without an explicit fresh-rate contract.
- Inventory owns inventory intelligence; Shopping Intelligence depends on Inventory and must not create a reverse module dependency.
- Monetary estimates use deterministic FoodItem-name product-key mapping only; fuzzy matching is forbidden for money.
- Price freshness is bounded to seven days for Budget planning; stale snapshots do not become current costs.
- When multiple compatible price sources exist, the freshest source inside the freshness window is preferred; if none is fresh, the result is stale rather than fabricated.
- Recipe scaling is canonical and occurs before inventory-gap and budget calculation.
- Budget is the pricing/evidence engine; Food Operating Loop owns recipe orchestration and Shopping integration.
- Only verified `priced` recipe gaps may be automatically inserted into Shopping.
- Partial price evidence is surfaced explicitly rather than presented as a complete budget result.
- Next-action suggestions are deterministic remediation codes, not guessed alternatives.

## Next

`MASTER-0004` next slice: render deterministic next actions on Mobile, then implement offline/local-first Budget/Shopping state and Pantry↔Shopping reconciliation, followed by broader price-source coverage.

## Evidence boundary

Repository/source and the cited GitHub Actions runs are verified. Production/deployed database/RLS/storage state, physical-device UX, push delivery, external provider quotas and store-release validation remain outside the current runtime boundary.