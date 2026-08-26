# MYPA — Shopping + Inventory Core Roadmap

> Temporary execution roadmap for the Shopping + Inventory workstream.
> A=`docs/05_CURRENT_STATE.md`; B=`docs/06_USER_EXPERIENCE_AND_MEMORY_CONTRACT.md`.
>
> **Rule:** `[x]` means implementation exists in the repository; it is **not Green** until the consolidated verification run passes.

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
  → assistant / mobile execution
```

## Implementation status before verification

### C1 — Domain contract
- [x] Shopping/inventory/recipe/budget domains audited.
- [x] Canonical household item identity boundary.
- [x] Canonical unit normalization/conversion boundary.
- [x] Purchase/consume/waste/adjust/correction semantics.
- [x] Inventory event idempotency/audit contract.
- [x] Expiry/freshness semantics.
- [x] Country/currency/locale/timezone/RTL context contract.
- [x] Provider-agnostic price provider interface + refresh orchestration.

### C2 — Inventory core
- [x] Household-scoped inventory persistence.
- [x] Create/update/adjust/remove.
- [x] Purchase/consume/waste.
- [x] Unit-safe deterministic quantity arithmetic.
- [x] Expiry + low-stock prioritization.
- [x] Durable `InventoryEvent` persistence model.
- [x] Mobile inventory lifecycle UI/API.

### C3 — Shopping list core
- [x] Persistent CRUD.
- [x] Complete/reopen/delete/reorder.
- [x] Canonical merge + compatible-unit quantity consolidation.
- [x] Recipe provenance.
- [x] Authenticated user scoping.
- [x] Mobile lifecycle API and premium surface integration.

### C4 — Recipe → Inventory → Shopping
- [x] Serving-aware Food Operating Loop.
- [x] Inventory-aware missing calculation.
- [x] Missing recipe requirements route into persistent shopping.
- [x] Multi-recipe deterministic consolidation.
- [x] Unit-safe RecipeInventoryMatcher refactor.

### C5 — Purchase planning + budget
- [x] Expiry-aware priority.
- [x] Budget-limited quantity planning.
- [x] Explainable reasons.
- [x] Missing-price fallback.
- [x] Deterministic budget overflow policy.
- [x] Provider registry + safe fallback aggregation.
- [x] Scheduled refresh orchestration contract.

### C6 — Consumption learning + reorder
- [x] Explicit inventory event history.
- [x] Sparse-data-safe forecasting.
- [x] Confidence semantics.
- [x] Reorder thresholds.
- [x] Persistence-aware forecast facade.

### C7 — Globalization
- [x] Canonical units separated from localized labels.
- [x] Currency separated from item identity.
- [x] Country/region/locale/timezone context.
- [x] RTL direction context.
- [x] Persian/Arabic normalization compatibility.

### C8 — Assistant / Brain
- [x] Canonical shopping/inventory mutation services.
- [x] Ambiguity-safe item resolver.
- [x] Deterministic household read service.
- [x] Deterministic household natural command path for inspect/add/remove/consume/purchase.
- [x] Assistant module/controller wiring for household path.
- [x] Canonical basket adapter path.
- [ ] Final multilingual/contextual integration verification.

### C9 — Mobile UX
- [x] Premium inventory surface connected to live state.
- [x] Premium shopping/basket surface and lifecycle APIs.
- [x] Common operations require minimal navigation.
- [x] Empty/loading/error states.
- [x] Accessibility labels on core actions.
- [ ] Final physical-device / RTL runtime verification.

## Verification gates — all intentionally pending

- [ ] Prisma generate + schema consistency.
- [ ] Targeted Shopping/Inventory/Recipe/Assistant Jest suites.
- [ ] Backend typecheck.
- [ ] Backend lint.
- [ ] Backend build.
- [ ] Full backend Jest.
- [ ] Mobile typecheck.
- [ ] Mobile quality contracts.
- [ ] Final D1 verification.

## Closure

Only after every relevant gate is green:

- [ ] Architecture review #1.
- [ ] Architecture review #2.
- [ ] Confirm vendor-agnostic core.
- [ ] Confirm subscription-ready boundaries.
- [ ] Record exact evidence in A/B.
- [ ] Calculate honest whole-product progress.
- [ ] Clear this C and create the next workstream C.

## Definition of Done

The workstream is 100% only when the system can safely execute examples such as:

- «چه چیزهایی برای شام‌های این هفته نداریم؟»
- «دو تا شیر دارم، یکی هم بخر.»
- «این مرغ را مصرف کردم.»
- «برای این سه غذا یک لیست خرید واحد درست کن.»
- «این هفته خرید را زیر بودجه نگه دار.»

with durable state, explainable deterministic decisions, ambiguity refusal and compatibility with Food OS, Budget Intelligence, Personal Brain and future Local AI.
