# Food Operating Loop

## Purpose

Connect the existing recipe, nutrition, inventory, shopping and country-intelligence foundations into one deterministic food workflow without requiring an external recipe API at runtime.

## Current flow

```text
Recipe
  ↓
Target servings
  ↓
Deterministic scaling
  ↓
Scaled ingredient quantities
  ↓
Inventory comparison
  ↓
Unit normalization (g/kg/mg/oz/lb, ml/l, count)
  ↓
Available + missing ingredients
  ↓
Shopping-ready missing items
  ↓
Country food context + local currency context
```

A deterministic recommendation path is also available:

```text
Recipes + Inventory + Nutrition Profile + Country
  ↓
Coverage score + nutrition fit + local relevance
  ↓
Top meal recommendations
```

## API

- `GET /recipes/recommendations?servings=2&countryCode=JP`
- `GET /recipes/:id/food-plan?servings=50&countryCode=JP`
- `POST /recipes/:id/food-plan/shopping?servings=50`

## Guarantees

- Serving count is explicit and bounded to `1..10000`.
- Inventory is compared against the quantities required for the requested serving count, not the recipe's base serving count.
- Compatible units are normalized before comparison.
- Incompatible/unknown units are treated conservatively as not safely comparable.
- Missing quantities are returned in the recipe's requested unit.
- Shopping conversion uses the exact computed missing quantities and the recipe as the source.
- Country context never silently replaces an explicit recipe request.
- Recommendation logic is deterministic and can operate without an external AI provider.

## Deliberate boundary

Live price estimation is not fabricated here. The current price and food-cost foundations do not yet guarantee global, verified, source-native coverage for every ingredient/market. Price integration will be added when that trust boundary is production-ready.

## Validation required

After checkout of the latest `main`:

1. Run the focused Food Operating Loop suite.
2. Run full Jest, E2E, typecheck and build.
3. Confirm the recipe endpoints boot in E2E.
4. Keep the non-fatal E2E worker teardown warning tracked separately.
