# MYPA — Shopping + Inventory Core Roadmap

> Temporary execution roadmap for the Shopping + Inventory workstream.
> A=`docs/05_CURRENT_STATE.md`; B=`docs/06_USER_EXPERIENCE_AND_MEMORY_CONTRACT.md`.
>
> **Rule:** `[x]` means implementation exists in the repository; it is **not Green** until the final verification run passes.

## Goal

Build the household operating loop:

```text
Recipe / request
  → canonical ingredient identity
  → inventory + freshness
  → missing / low stock
  → purchase planning
  → persistent shopping list
  → budget-aware choices
  → purchase / consume / waste events
  → inventory update
  → consumption learning
  → reorder forecasting
```

The subsystem remains deterministic-first, multilingual-ready, country/currency/unit aware, vendor-agnostic and reusable by Food OS, Budget Intelligence and the Local Brain.

## C1 — Domain contract

- [x] Existing shopping/inventory/recipe/budget domains audited.
- [x] Canonical household item identity boundary defined.
- [x] Canonical unit normalization/conversion boundary defined.
- [x] Mutation semantics cover purchase, consume, waste, adjust and correction.
- [x] Inventory events support idempotency and audit history.
- [x] Expiry/freshness semantics are represented.
- [x] Global country/currency/RTL context contract exists.
- [x] Provider-agnostic price-provider contract exists.

## C2 — Inventory core

- [x] Household-scoped inventory persistence.
- [x] Create/update/adjust/remove operations.
- [x] Purchase / consume / waste operations.
- [x] Unit-safe deterministic quantity handling.
- [x] Duplicate merge at canonical identity boundaries.
- [x] Partial consumption.
- [x] Expiry + low-stock prioritization.
- [x] Durable `InventoryEvent` model and transaction/idempotency contract.
- [x] Premium mobile inventory surface exposes lifecycle actions.

## C3 — Shopping list core

- [x] Persistent CRUD.
- [x] Complete / reopen / delete / reorder.
- [x] Canonical merge and unit-compatible quantity consolidation.
- [x] Recipe source attribution.
- [x] User-scoped authenticated APIs.
- [x] Mobile API contract updated for lifecycle operations.
- [x] Shopping UI already uses premium surface + empty/loading/error states.

## C4 — Recipe → Inventory → Shopping

- [x] Food Operating Loop scales recipe requirements before matching inventory.
- [x] Missing requirements preserve already-owned inventory.
- [x] Missing recipe items route into canonical persistent shopping.
- [x] Multi-recipe deterministic consolidation service exists.
- [x] Consolidation merges compatible units and preserves recipe provenance.
- [ ] Final verification of RecipeInventoryMatcher against the new canonical path.

## C5 — Purchase planning + budget

- [x] Expiry-aware purchase priority.
- [x] Budget-limited quantity planning.
- [x] Explainable purchase reasons.
- [x] Unavailable price fallback.
- [x] Deterministic budget overflow policy with partial/skip/watch outcomes.
- [x] Provider registry with multiple-provider-safe aggregation.
- [x] Scheduled-refresh orchestration contract exists.
- [ ] Durable price snapshot persistence and live provider implementations remain future extension work; core logic does not depend on them.

## C6 — Consumption learning + reorder

- [x] Consumption history event stream.
- [x] Sparse-data-safe deterministic forecasting.
- [x] Explicit confidence score.
- [x] Explainable reorder thresholds.
- [x] Persistence-aware forecast facade reads `InventoryEvent` history.
- [x] Forecast does not mutate inventory.
- [ ] Final integration verification for persisted-history forecasts.

## C7 — Globalization

- [x] Canonical units independent from localized labels.
- [x] Persian/Arabic digit normalization in the assistant input path.
- [x] Currency separated from item identity through shopping context.
- [x] Country/region/timezone/locale context contract.
- [x] RTL direction encoded in global shopping context.
- [ ] Final end-to-end UI/runtime RTL validation.

## C8 — Assistant / Brain

- [x] Canonical shopping/inventory mutation services are available to assistant adapters.
- [x] Basket add/remove adapter uses the canonical shopping path.
- [x] Inventory consume/purchase adapter path exists.
- [x] Household action resolution layer is implemented in the natural execution path; final runtime validation remains.
- [ ] Natural-language “inspect inventory / what is missing” tool contract still needs final wiring verification.
- [ ] Ambiguity refusal / contextual follow-up verification remains.

## C9 — Mobile UX

- [x] Premium inventory surface connected to live inventory APIs.
- [x] Premium shopping surface connected to live basket APIs.
- [x] Common inventory operations are one-tap/low-navigation.
- [x] Shopping empty/loading/error states exist.
- [x] Accessibility labels exist on core inventory and shopping actions.
- [x] Existing premium RTL-aware foundations remain the UI base.
- [ ] Final RTL + device verification remains.

## C10 — Final verification

Implementation/test files have been added/updated, but **nothing here is claimed Green yet**.

- [ ] Targeted shopping/inventory unit suites.
- [ ] Recipe → inventory → shopping integration suites.
- [ ] Price/budget fallback suites.
- [ ] Assistant household action suites.
- [ ] Mobile typecheck.
- [ ] Backend typecheck.
- [ ] Backend lint.
- [ ] Backend build / Prisma generate.
- [ ] Full backend Jest.
- [ ] Mobile voice/UI quality contracts.
- [ ] Final D1 verification.

## C11 — Closure

- [ ] Architecture review #1: ownership, mutation boundaries, migrations, dependency direction.
- [ ] Architecture review #2: Food OS / Budget / Brain / Local AI compatibility.
- [ ] Confirm vendor-agnostic core.
- [ ] Confirm subscription-ready boundaries remain intact.
- [ ] Record exact evidence in A/B.
- [ ] Calculate honest whole-product progress.
- [ ] Only after all verification is green: clear C and prepare next workstream.

## Current status

**Implementation pass:** substantial core + integration work is now coded.

**Verification status:** intentionally pending. We are following the project rule to implement first and run the consolidated verification at the end.

**Important:** the workstream is not 100% until the Definition of Done examples actually execute safely and the final verification gates are green.
