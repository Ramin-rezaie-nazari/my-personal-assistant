# MYPA — Shopping + Inventory Core Roadmap

> C = temporary execution roadmap. A=`docs/05_CURRENT_STATE.md`; B=`docs/06_USER_EXPERIENCE_AND_MEMORY_CONTRACT.md`.
> Goal: take Shopping + Inventory from partial repository capability to a production-grade Personal Operating System subsystem without inventing progress.

## Workstream objective

Build a coherent household loop:

```text
Recipe / Meal Plan / User Request
        ↓
Ingredient normalization
        ↓
Household inventory
        ↓
Availability + quantity + freshness evaluation
        ↓
Missing / low-stock / expiring needs
        ↓
Purchase planning
        ↓
Shopping list
        ↓
Budget-aware alternatives
        ↓
Purchase / consumption events
        ↓
Inventory update
        ↓
Consumption learning + reorder forecasting
```

The subsystem must be multilingual-ready, country/currency/unit aware, deterministic-first, provider-agnostic and reusable by the future Food OS, Budget Intelligence and Local Brain.

## Completion gates

### C1 — Repository audit and domain contract
- [x] Audit existing shopping-intelligence, inventory, food, recipe, budget and ingredient models.
- [x] Define the canonical household/item identity boundary and avoid duplicate ingredient concepts.
- [x] Define quantity/unit normalization and conversion boundaries.
- [x] Define event semantics for add, consume, adjust, waste, purchase, transfer and correction.
- [x] Define source precedence and idempotency rules for inventory mutations.
- [x] Define expiry/freshness semantics and timezone/country boundaries.
- [ ] Define budget integration contract without coupling shopping to one price provider.

### C2 — Inventory core
- [x] Inventory item model is canonical and household scoped.
- [ ] Add / update / consume / adjust / remove operations are complete and validated.
- [x] Quantity arithmetic is unit-safe and deterministic.
- [x] Duplicate items merge safely using canonical identity.
- [x] Partial consumption works.
- [x] Waste/loss is represented separately from normal consumption.
- [x] Expiry and low-stock states are deterministic.
- [x] Inventory event/audit persistence contract exists with transactional idempotency.

### C3 — Shopping list core
- [ ] Create/update/delete/reorder shopping items persistently.
- [x] Group by canonical ingredient identity; source information is preserved.
- [x] Merge duplicate requirements.
- [x] Convert household requirements into missing quantities.
- [x] Preserve already-owned inventory quantities.
- [ ] Support explicit manual additions and removals persistently.
- [ ] Track planned/purchased/skipped states persistently.
- [x] Shopping list generation remains useful without live prices.

### C4 — Recipe → Inventory → Shopping bridge
- [ ] Ingredient identity mapping from recipe data to inventory identity.
- [x] Accurate required-vs-owned calculation at the canonical shopping layer.
- [ ] Scaling aware of serving count and ingredient policy.
- [ ] Household-size aware aggregation across multiple meals.
- [x] No duplicate shopping lines for equivalent normalized ingredients.
- [x] Multi-source consolidation into one shopping plan at the deterministic layer.

### C5 — Purchase planning + budget awareness
- [ ] Purchase planner ranks what should be bought now vs later with expiry-aware priorities.
- [x] Low-stock and expiry priorities influence deterministic purchase planning.
- [ ] Existing household budget intelligence is consumed through a stable contract.
- [x] Price estimates are optional inputs and unavailable prices remain non-fatal.
- [x] Budget limits can reduce purchase quantity instead of silently overspending.
- [x] Purchase plan exposes deterministic reasons.

### C6 — Consumption learning + reorder forecasting
- [x] Consumption history is represented as an explicit event stream for persistence.
- [x] Historical consumption can feed deterministic forecasting.
- [x] Forecasting handles sparse data safely.
- [x] Reorder thresholds/expected depletion are explainable.
- [x] Forecast confidence is represented explicitly.
- [x] Forecast services do not silently mutate inventory.
- [ ] Hydrate learning forecasts from persisted InventoryEvent data in production runtime.

### C7 — Globalization
- [x] Units are locale-aware but internally canonical at the deterministic domain layer.
- [ ] Currency is separated from item identity across the full shopping domain.
- [ ] Country/region/store context is supported without hard-coding Iran behavior.
- [x] Persian/Arabic labels can normalize to stable canonical identity without changing business logic.
- [ ] RTL-safe API/UX payload semantics are complete end-to-end.

### C8 — Assistant / Brain integration
- [ ] Natural commands can inspect inventory.
- [ ] Natural commands can add/remove shopping items.
- [ ] Natural commands can consume/adjust inventory.
- [ ] Natural commands can ask what is missing for a recipe/meal plan.
- [ ] Context-aware follow-ups bind correctly to the active list/item/recipe.
- [ ] Ambiguous item identity refuses to guess.
- [ ] Tool contracts remain deterministic-first and vendor agnostic.

### C9 — Mobile UX
- [ ] Inventory surface follows the premium product language.
- [ ] Shopping list is fast, glanceable and voice-first.
- [ ] Common operations require minimal navigation.
- [ ] Empty/loading/error states are intentional.
- [ ] Accessibility and RTL behavior are preserved.
- [ ] Optimistic UI is used only where mutation semantics remain safe.

### C10 — Tests and verification
- [x] Unit tests cover canonical identity, quantities, units, expiry and core events.
- [ ] Integration tests cover Recipe → Inventory → Shopping.
- [ ] Budget/price integration tests cover fallback behavior.
- [ ] Assistant tool/semantic integration tests cover natural-language commands.
- [ ] Mobile typecheck passes for the workstream changes.
- [ ] Backend typecheck passes for the workstream changes.
- [ ] Backend lint passes for the workstream changes.
- [ ] Relevant backend suites pass in the user's environment.
- [ ] Relevant mobile quality contracts pass after UI changes.
- [ ] Full backend Jest passes after the workstream stabilizes.

### C11 — Architecture review / closure
- [ ] Review data ownership and DB mutation boundaries twice.
- [ ] Review future Food OS / Budget / Brain compatibility twice.
- [ ] Confirm no vendor-specific dependency leaked into core shopping logic.
- [ ] Confirm subscription-ready boundaries remain intact.
- [ ] Record exact evidence in A/B.
- [ ] Calculate honest progress against the whole MYPA vision.
- [ ] Clear this C file after closure and prepare a fresh C for the next workstream.

## Parallel task batches

### Batch 1 — low-risk foundations ✅ CODED
Inventory contract audit; canonical identity/unit normalization; deterministic mutation semantics; focused tests.

### Batch 2 — core household loop 🟡 CODED / NEEDS EXECUTION
Inventory expiry-aware prioritization; durable InventoryEvent schema + transaction persistence; inventory-aware shopping consolidation; real shopping-list generation; history-driven consumption forecasting; focused tests.

### Batch 3 — recipe bridge
Recipe-to-shopping conversion; multi-recipe consolidation; serving-aware aggregation; regression tests.

### Batch 4 — planning intelligence
Purchase planner; expiry/low-stock priority; budget-aware choices; explainable alternatives.

### Batch 5 — learning
Persistent-event hydration; reorder forecasting from DB history; sparse-data safety; confidence semantics.

### Batch 6 — global + assistant
Locale/currency/unit contracts; multilingual tool integration; ambiguity handling; voice/text command coverage.

### Batch 7 — mobile + verification
Premium surfaces; accessibility/RTL; contracts; full verification; architecture review; closure.

## Definition of done

The workstream is 100% only when a user can naturally say things such as:

- «چه چیزهایی برای شام‌های این هفته نداریم؟»
- «دو تا شیر دارم، یکی هم بخر.»
- «این مرغ را مصرف کردم.»
- «برای این سه غذا یک لیست خرید واحد درست کن.»
- «این هفته خرید را زیر بودجه نگه دار.»

and the system can execute the safe deterministic portions correctly, explain what it did, preserve household state, and remain compatible with the broader Food OS, Budget Intelligence, Personal Brain and future Local AI architecture.

## Current honest state

Repository design/implementation is partway through the workstream. No 100% claim is allowed until the persisted CRUD loop, recipe bridge, assistant integration, mobile UX and full verification are all green.
