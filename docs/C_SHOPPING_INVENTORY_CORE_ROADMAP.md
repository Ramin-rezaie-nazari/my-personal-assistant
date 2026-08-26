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
- [ ] Audit existing shopping-intelligence, inventory, food, recipe, budget and ingredient models.
- [ ] Define the canonical household/item identity boundary and avoid duplicate ingredient concepts.
- [ ] Define quantity/unit normalization and conversion boundaries.
- [ ] Define event semantics for add, consume, adjust, waste, purchase, transfer and correction.
- [ ] Define source precedence and idempotency rules for inventory mutations.
- [ ] Define expiry/freshness semantics and timezone/country boundaries.
- [ ] Define budget integration contract without coupling shopping to one price provider.

### C2 — Inventory core
- [ ] Inventory item model is canonical and household scoped.
- [ ] Add / update / consume / adjust / remove operations are complete and validated.
- [ ] Quantity arithmetic is unit-safe and deterministic.
- [ ] Duplicate items merge safely using canonical identity.
- [ ] Partial consumption works.
- [ ] Waste/loss is represented separately from normal consumption.
- [ ] Expiry and low-stock states are deterministic.
- [ ] Inventory history/audit semantics are durable.

### C3 — Shopping list core
- [ ] Create/update/delete/reorder shopping items.
- [ ] Group by canonical ingredient/category/store context.
- [ ] Merge duplicate requirements.
- [ ] Convert recipe requirements into missing quantities.
- [ ] Preserve already-owned inventory quantities.
- [ ] Support explicit manual additions and removals.
- [ ] Track planned/purchased/skipped states.
- [ ] Shopping list remains useful without live prices.

### C4 — Recipe → Inventory → Shopping bridge
- [ ] Ingredient identity mapping from recipe data to inventory identity.
- [ ] Accurate required-vs-owned calculation.
- [ ] Scaling aware of serving count and ingredient policy.
- [ ] Household-size aware aggregation across multiple meals.
- [ ] No duplicate recommendation/purchase lines for equivalent ingredients.
- [ ] Multi-recipe consolidation into one shopping plan.

### C5 — Purchase planning + budget awareness
- [ ] Purchase planner ranks what should be bought now vs later.
- [ ] Low-stock and expiry priorities influence planning.
- [ ] Existing household budget intelligence is consumed through a stable contract.
- [ ] Price estimates are optional inputs, never a single point of failure.
- [ ] Budget overflow produces deterministic alternatives.
- [ ] Purchase plan exposes explainable reasoning.

### C6 — Consumption learning + reorder forecasting
- [ ] Consumption events update inventory safely.
- [ ] Historical consumption feeds forecast inputs.
- [ ] Forecasting handles sparse data safely.
- [ ] Reorder thresholds/expected depletion are explainable.
- [ ] Forecast confidence is represented explicitly.
- [ ] Forecast never silently mutates inventory.

### C7 — Globalization
- [ ] Units are locale-aware but internally canonical.
- [ ] Currency is separated from item identity.
- [ ] Country/region/store context is supported without hard-coding Iran behavior.
- [ ] Persian/Arabic digits and localized item labels remain compatible with canonical identity.
- [ ] RTL-safe API/UX payload semantics.

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
- [ ] Unit tests cover canonical identity, quantities, units and events.
- [ ] Integration tests cover Recipe → Inventory → Shopping.
- [ ] Budget/price integration tests cover fallback behavior.
- [ ] Assistant tool/semantic integration tests cover natural-language commands.
- [ ] Mobile typecheck passes.
- [ ] Backend typecheck passes.
- [ ] Backend lint passes.
- [ ] Relevant backend suites pass.
- [ ] Relevant mobile quality contracts pass.
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

### Batch 1 — low-risk foundations
Inventory contract audit; unit/identity normalization; mutation semantics; focused unit tests.

### Batch 2 — core household loop
Inventory operations; shopping list operations; duplicate merge; missing-quantity calculation.

### Batch 3 — recipe bridge
Recipe-to-shopping conversion; multi-recipe consolidation; serving-aware aggregation; regression tests.

### Batch 4 — planning intelligence
Purchase planner; expiry/low-stock priority; budget-aware choices; explainable alternatives.

### Batch 5 — learning
Consumption event learning; reorder forecasting; sparse-data safety; confidence semantics.

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
