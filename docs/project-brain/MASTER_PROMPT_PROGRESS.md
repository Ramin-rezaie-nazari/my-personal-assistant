# MYPA Master Prompt Progress

Last updated: 2026-09-12
Review status: IN_PROGRESS — SOURCE AUDIT RECONCILED; ACTIVE VERTICAL HARDENING CONTINUING

## Purpose

This document tracks post-Appendix product-development work against the MYPA Master Prompt vision. It does not override `docs/05_CURRENT_STATE.md` or the canonical findings register.

## Current progress

Overall engineering/product completion estimate: **~95%** for the repository source scope plus implemented Master Prompt vertical work reviewed so far. This is an evidence-weighted engineering index, not a claim of production/device readiness or 100% feature completeness.

MASTER-0004 completion estimate: **~96%** for the reviewed Nutrition/Food → Pantry/Inventory → Shopping → Budget/Price vertical; remaining work is primarily deeper lifecycle semantics, broader active feature coverage and environmental validation.

## Baseline

- Recoverable Appendix remediation is complete through PB-278; historical PB-001..PB-155 remains evidence-limited.
- Backend/Mobile CI has repeatedly passed through PB-274; latest PB-275..PB-278 head is awaiting its fresh CI completion.
- Project Brain source-level audit is reconciled to available repository evidence.
- Product readiness is not 100%; production database/configuration, physical-device validation, external provider health/quotas and store release remain environmental gates.

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
Status: CORE RECIPE→BUDGET→SHOPPING + PRICE-EVIDENCE PATH VERIFIED; HARDENING CONTINUES.

Completed in the continuation stream:
- active Shopping Intelligence facade delegates to canonical user-scoped ShoppingService and is JWT protected;
- shopping budget preserves explicit currency, sequential remaining-budget accounting, and committed `buy_now` semantics;
- Inventory intelligence is owned by Inventory, removing the real module cycle;
- deterministic FoodItem-name → PriceTrackedProduct product-key mapping is centralized;
- Budget quote engine enforces exact currency/unit compatibility, seven-day freshness, provenance and explicit blocked evidence states;
- multi-source selection chooses the freshest compatible evidence that is still fresh;
- deterministic `deriveBudgetStatus()` exposes `within_budget`, `over_budget`, `partial_price_evidence`, and `insufficient_price_data`;
- deterministic `deriveBudgetNextActions()` exposes safe remediation actions without fabricating price alternatives;
- canonical recipe scaling feeds inventory-gap calculation, budget costing and budget-qualified shopping insertion;
- authenticated recipe budget and budget-shopping endpoints have direct controller/API E2E coverage;
- Mobile Recipe Budget journey has servings/budget/currency inputs, evidence-aware result states, loading/error handling, RTL/i18n and Smart Basket handoff;
- Mobile Shopping/Price/basket clients reuse canonical authenticated transport;
- Shopping basket merges convert compatible units and reject incompatible units;
- Shopping completion synchronizes purchased quantities to Inventory transactionally and idempotently;
- Price history is durable, price analysis is canonicalized, source capabilities/health are explicit, quantity-aware product matching is enforced and incompatible currencies are rejected;
- obsolete Price Intelligence and Shopping Intelligence placeholder facades were retired after consumer review;
- PurchasePlan rejects cross-currency item evidence;
- Shopping invalid quantities map to Bad Request semantics;
- Shopping request bodies now use validated DTO classes with nested recipe-item validation;
- Recipe→Shopping requests reject invalid/non-recipe items rather than silently dropping them.

### BATCH-0032..0039
Status: COMPLETE FOR SOURCE/IMPLEMENTATION; LATEST-HEAD CI GATE IN PROGRESS.

Batches cover unit-safe Shopping merge, canonical Mobile basket transport, purchase→Inventory lifecycle, Price Intelligence hardening/canonicalization, placeholder cleanup, PurchasePlan currency integrity, and Shopping request DTO/input semantics. Each batch is recorded under `docs/project-brain/15_AUDIT_CONTINUATION_BATCH_*.md` and reconciled into the canonical Appendix.

## Remaining work inside MASTER-0004

- complete broader Pantry↔Shopping lifecycle semantics where current product behavior still has no explicit event/source contract;
- decide/implement the long-term durable household consumption-learning model before presenting that subsystem as persistent learning;
- broader live price-source coverage and external-provider reliability beyond in-process capability/health telemetry;
- richer end-user explanations/UX for blocked evidence and lifecycle actions;
- final cross-file consistency pass across all Project Brain documents;
- fresh latest-head CI after PB-275..PB-278 and current final reconciliation.

## Current architectural decisions

- Deterministic local Brain remains provider-independent and cloud-AI-free.
- Hard allergy/diet filtering is permitted only from canonical safety evidence; unknowns block constrained recommendations.
- Shopping Intelligence reuses canonical Shopping/Inventory data services rather than maintaining parallel persistence logic.
- Currency mismatch is fail-closed; no implicit FX conversion without an explicit fresh-rate contract.
- Inventory owns inventory intelligence; Shopping Intelligence must not introduce a reverse module dependency.
- Monetary estimates use deterministic FoodItem-name product-key mapping only; fuzzy matching is forbidden for money.
- Price freshness is bounded to seven days for Budget planning; stale snapshots do not become current costs.
- When multiple compatible price sources exist, the freshest source inside the freshness window is preferred; if none is fresh, the result is stale rather than fabricated.
- Recipe scaling is canonical and occurs before inventory-gap and budget calculation.
- Budget is the pricing/evidence engine; Food Operating Loop owns recipe orchestration and Shopping integration.
- Only verified `priced` recipe gaps may be automatically inserted into Shopping.
- Partial price evidence is surfaced explicitly rather than presented as a complete budget result.
- Next-action suggestions are deterministic remediation codes, not guessed alternatives.
- Request DTOs at Shopping boundaries are runtime-validated rather than represented only by TypeScript structural types.

## Evidence boundary

Repository/source and GitHub Actions evidence are verified where explicitly recorded. Production/deployed database/RLS/storage state, physical-device UX, push delivery, external provider quotas and store-release validation remain outside the available runtime boundary.
