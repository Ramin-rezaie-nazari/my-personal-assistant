# Current State — My Personal Assistant

> Operational source of truth for progress, validated checkpoints, completed slices, unfinished work, and the test ledger.
>
> Latest fully validated locally: 2026-08-21. Food Decision Brain + Weekly Food Budget Optimizer + ingredient reuse/unit-aware pricing hardening are fully green on `work/canonical-ingredient-intelligence`.

## Executive status

**Overall project completion: ~67%**

This is a weighted engineering/product-completion index, not a claim that 67% of every file is written. Backend foundations are strong, the 195-country food/currency layer is real, and the connected food loop now spans canonical food intelligence, scaling, inventory, shopping handoff, recommendations, daily planning, and weekly budget optimization. Major unfinished product work remains in the verified global recipe corpus, full live market coverage, mobile UX, production hardening, voice/local AI integration, and monetization.

## Latest workstream — Food Decision Brain + Weekly Budget Optimizer

A deterministic **Food Decision Brain** is wired into recommendation-intelligence and a **Weekly Food Budget Optimizer** is layered on top of the existing recipe, inventory and price-intelligence systems rather than creating a parallel data model.

### Food Decision pipeline

```text
Natural request context
  ↓
Food-theme / cuisine-intent inference
  ↓
Hard dietary + allergy filters
  ↓
Serving-aware recipe + inventory evaluation
  ↓
Nutrition fit
  ↓
Explicit ingredient/style preference
  ↓
Ingredient-aware cuisine/theme evidence
  ↓
Country/cuisine context
  ↓
Novelty / recent-meal rotation
  ↓
Verification + missing-ingredient quality
  ↓
Weighted decision score
  ↓
Diverse top-N ranking
  ↓
Reasons + score breakdown + rejected candidates
```

### Weekly budget decision pipeline

```text
Monthly / weekly food budget
  ↓
Household size + planning horizon
  ↓
Recipe serving scaling
  ↓
Current household inventory
  ↓
Verified latest unit-price observations
  ↓
Unit-aware ingredient → price conversion
  ↓
Recipe ingredient cost estimation (only where evidence exists)
  ↓
Nutrition / affordability / inventory / verification / simplicity scoring
  ↓
Ingredient reuse + family-repeat diversification
  ↓
7-day meal selection
  ↓
Budget envelope + confidence
  ↓
Aggregated shopping summary
```

### Current decision signals

- target servings
- daily nutrition goals with deterministic per-serving targets
- current household inventory coverage
- missing ingredients
- dietary preferences
- allergy signals
- disliked ingredients
- explicit preferred ingredients
- food-theme intent inferred from category/goal/context
- ingredient-aware cuisine evidence
- country/cuisine context
- recent-meal novelty
- verified recipe state
- diversity/family de-duplication
- monthly or explicit weekly food budget
- planning horizon up to 7 days
- meals per day up to 3
- current price evidence where available
- price coverage and budget confidence
- ingredient reuse / shared-shopping value

### Important design boundaries

- Canonical ingredient identity remains upstream. The decision engine consumes stable food entities rather than creating a second synonym/taxonomy layer.
- The budget optimizer never fabricates a price. A recipe can remain selectable when price coverage is incomplete, but budget confidence exposes the missing evidence.
- Inventory reduces estimated purchase cost only for quantities already present in the user's household inventory.
- Ingredient quantities and price units must belong to compatible unit families before cost is calculated; mass/volume/count are never silently mixed.
- An explicitly requested currency filters price evidence to that currency; no hidden FX conversion is performed in the optimizer.
- Country context is a relevance signal, not a cuisine restriction. A user in Iran can ask for Indian food; a user in Spain can ask for seafood.
- Allergy/diet checks are candidate safety signals, not medical clearance.
- Budget selection is deterministic and explainable rather than an opaque optimization black box.
- Real leftovers/batch-cooking reuse is not fabricated without yield/batch/storage metadata; current reuse optimization is ingredient/shopping reuse.

### Current API surface

```text
POST /recommendation-intelligence/food
GET  /recipes/recommendations
GET  /recipes/meal-plan
GET  /recipes/:id/food-plan
POST /recipes/:id/food-plan/shopping
POST /budget-intelligence/weekly-plan
GET  /budget-intelligence/meal-plan
GET  /budget-intelligence/country
GET  /budget-intelligence/countries
```

### Weekly budget request contract

The current controller accepts:

```text
monthlyBudget
familySize
goal
countryCode
weeklyBudget?
days? (1..7)
mealsPerDay? (1..3)
currency?
```

Example intent:

```text
monthlyBudget = 15000000
familySize = 4
goal = healthy affordable meals
countryCode = IR
weeklyBudget = 3450000   # optional override
```

### Current limitations

- The price layer is only as complete as verified `PriceSnapshot.unitPrice` coverage. Missing prices are intentionally not synthesized.
- Ingredient quantity → price-unit semantics are now conservative and unit-aware, but complete global market unit normalization still needs broader verified source coverage.
- Cuisine intent is still deterministic/conservative; full multilingual intent/entity inference should eventually reuse the canonical food intelligence layer rather than relying on regex-only request parsing.
- Recommendation engine currently samples up to 500 latest recipes before ranking; production scale should move toward database-side candidate retrieval/filtering.
- Weekly optimizer currently uses deterministic scoring/greedy diversification plus ingredient reuse. A future phase can add constrained multi-day optimization with meal-pattern constraints, leftovers, batch cooking and explicit macro distribution once the necessary recipe metadata exists.
- Budget cost estimates remain confidence-scored rather than treated as exact financial truth.

## Latest fully green local checkpoint — 2026-08-21

```text
Backend typecheck:                    PASS
Backend build:                        PASS
Full backend Jest:                    156/156 suites — PASS
Tests:                                419/419 — PASS
Food Decision Brain focused tests:    PASS
Weekly Budget Optimizer tests:        PASS
```

The CPU-heavy recipe-image compression test previously required a higher Jest timeout; the assertion itself remains unchanged. The latest user-run validation completed fully green after the fix.

## New Slice — Weekly Food Budget Optimizer + Ingredient Reuse Hardening

### Implementation status

**Implementation and local validation: complete for the current deterministic optimizer slice.**

Added / strengthened:

- `BudgetIntelligenceService.createWeeklyPlan(...)`
- Price-intelligence integration through `PricePersistenceService`
- Inventory-aware purchase-cost estimation
- Unit-aware price conversion (mass / volume / count families)
- Currency filtering without hidden FX conversion
- Budget envelope calculation
- Price coverage / budget confidence
- 1–7 day planning horizon
- 1–3 meals per day
- Family-size serving scaling
- Nutrition-aware affordability scoring
- Diversity/family-repeat penalty
- Ingredient reuse / shared-shopping signal
- Aggregated shopping summary with quantities and units
- `POST /budget-intelligence/weekly-plan`
- Focused optimizer tests for budget selection, unit conversion, missing prices and currency filtering
- Progress documentation and source-of-truth update

### Validation state

**Local validation: 100% green.**

```text
Typecheck:                  PASS
Build:                      PASS
Full backend Jest:          156/156 suites — PASS
Tests:                      419/419 — PASS
```

## Global Food Intelligence — major slice

### Completed in main / active branch

- 195-country country-code coverage for the food routing layer.
- Country food profile for each market.
- Cuisine-family context.
- Staple-ingredient context.
- Signature/local recipe discovery anchors.
- Common cooking units.
- Hard-to-source ingredient metadata.
- Deterministic local recipe ranking.
- Explicit global-recipe behavior preserved.
- Cuisine-preserving substitution policy.
- Country-aware recipe API endpoints.
- Canonical ingredient taxonomy and supplement chain through v9.
- Final food resolver chain with quantity normalization, source-part decomposition, alias handling and locale support.

### Still required for 100%

- Large verified recipe corpus with complete instructions and quantities.
- Nutrition provenance and quality controls.
- Allergens and dietary constraints coverage across the full corpus.
- Production-scale ingredient substitutions.
- Serving-scaling metadata population for the entire catalog.
- Inventory matching across the full catalog.
- Shopping conversion across the full catalog.
- Provenance/versioning.
- Duplicate/alias/cultural-metadata QA.
- Full multilingual entity normalization beyond the current deterministic layer.

## Global Currency / Finance Intelligence — major slice

### Completed

- 195-country local currency registry.
- Fraction-digit metadata.
- Country finance context.
- Source-native currency preservation policy.
- Comparison/normalization-only FX contract.
- Unknown-country rejection.
- Focused 195-country tests.

### Still required

- Full live-price coverage by country.
- Source verification per market.
- Recipe → ingredient price → budget integration at global production coverage.
- More robust unit-price semantics and market normalization.

## Global Market / Price Intelligence

A larger stacked workstream exists with 195-country market/source registry, routing, discovery-only fallbacks, cached FX, local-time scheduling, confidence scoring and price-source infrastructure.

It must be integrated deliberately after conflict/dependency review rather than force-merged.

## Immediate next priorities

1. Upgrade weekly optimization from greedy selection to constrained multi-day planning with leftovers/batch cooking once yield/storage metadata is available.
2. Expand verified recipe corpus with provenance, allergens and dietary constraints.
3. Improve canonical/global multilingual cuisine and ingredient inference.
4. Integrate verified live price coverage into Food Operating Loop and budget recommendations.
5. Build the real mobile food journey around these APIs.
6. Continue production hardening, observability and external-API cost controls.
7. Add voice/local AI orchestration and premium monetization after the core user journey is strong.

## Working rule

A slice is 100% only when architecture, implementation, database changes, focused tests, integration/E2E tests, documentation, and required environment validation are all green. Do not weaken assertions to obtain green tests.
