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

## Implementation status

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
- [x] Final repository-side multilingual/contextual integration verification.

### C9 — Mobile UX
- [x] Premium inventory surface connected to live state.
- [x] Premium shopping/basket surface and lifecycle APIs.
- [x] Common operations require minimal navigation.
- [x] Empty/loading/error states.
- [x] Accessibility labels on core actions.
- [ ] Final physical-device / RTL runtime verification.

## Verification — green in user's VS Code environment

- [x] Prisma generate + schema consistency.
- [x] Targeted Shopping/Inventory/Recipe/Assistant Jest suites.
- [x] Backend typecheck.
- [x] Backend lint.
- [x] Backend build.
- [x] Full backend Jest / repository D1 gate.
- [x] Mobile typecheck.
- [x] Mobile quality contracts.
- [x] Final D1 verification.

### Verification evidence

- Backend full Jest: **162/162 suites, 475/475 tests, 0 snapshots**.
- Targeted multilingual regression: **3 suites, 20/20 tests**.
- Recipe image pipeline: **2/2 tests**.
- Mobile Voice Quality Contract: PASS.
- Mobile UI Quality Contract: PASS.
- D1 Voice Readiness Contract: PASS.
- Backend typecheck: PASS.
- Backend ESLint: PASS.
- Prisma generation: PASS.
- Backend build: PASS.
- `D1 FINAL REPOSITORY VERIFICATION PASS` was observed in the user's environment.

## Architecture closure review

- [x] Architecture review #1: canonical item identity, inventory events, shopping persistence, recipe bridge and assistant boundaries remain domain-separated and reusable by Food OS / Budget / Brain.
- [x] Architecture review #2: provider independence, transactional event history, ambiguity refusal and subscription-ready boundaries reviewed for side effects and future extensibility.
- [x] Vendor-agnostic core confirmed; live-price providers are optional adapters.
- [x] Subscription-ready boundaries remain intact.
- [x] Exact verification evidence recorded in A/B.
- [ ] Physical-device / RTL runtime evidence required before claiming 100% workstream closure.

## Honest progress

**Shopping + Inventory Core:** approximately **90–95% complete**.

The repository-side implementation and automated verification are green. The remaining gap is deliberately limited to real-device / RTL runtime validation; it is not being counted as complete without evidence.

**Whole MYPA product:** the Shopping + Inventory workstream produced a meaningful additional step from the previous ~27% whole-product estimate, but the global product percentage should only be recalibrated in A after this workstream's architecture/evidence is recorded.

## Definition of Done

The workstream is 100% only when the system can safely execute examples such as:

- «چه چیزهایی برای شام‌های این هفته نداریم؟»
- «دو تا شیر دارم، یکی هم بخر.»
- «این مرغ را مصرف کردم.»
- «برای این سه غذا یک لیست خرید واحد درست کن.»
- «این هفته خرید را زیر بودجه نگه دار.»

with durable state, explainable deterministic decisions, ambiguity refusal and compatibility with Food OS, Budget Intelligence, Personal Brain and future Local AI.

The final unchecked gate is the user's physical-device / RTL runtime validation. Until that happens, this C remains intentionally open and is **not cleared or reused as the next roadmap**.