# Recipe Serving & Quantity Scaling Contract

## Global product rule

Every recipe in the global food knowledge base must support serving-aware quantities.

This rule applies to:

- every supported country (target: the full 195-country catalog)
- every cuisine and region
- every recipe and recipe variant
- every meal type
- recipes created internally, imported under license, or created by a user

A recipe must never be rendered as a final cookable ingredient list without a known target serving count.

## User experience

When the user requests a recipe and the number of people is unknown, the assistant must ask:

> "برای چند نفر می‌خوای درستش کنی؟"

The answer becomes `targetServings` and is passed to the backend scaling engine. The mobile UI must not implement independent scaling math.

## Base recipe vs target recipe

Each recipe stores a canonical base yield, for example:

```text
Base yield: 2 servings
```

The user may request:

```text
1, 2, 3, 4, 5, ... 50, ... N servings
```

The engine calculates a deterministic scale factor:

```text
scaleFactor = targetServings / baseServings
```

For ordinary linear ingredients:

```text
scaledQuantity = baseQuantity × scaleFactor
```

## Culinary reality: not every ingredient is linear

Ingredients carry a scaling policy:

- `linear` — normal quantity scaling
- `sublinear` — quantity grows less than linearly (common for salt, some spices, oils, flavor concentrates)
- `fixed` — remains constant within the cooking method/batch
- `per_batch` — multiplied by the number of cooking batches
- `manual_review` — scale may be calculated, but the result must be flagged for review

Optional safeguards can define `maxLinearMultiplier` for ingredients where a very large batch should not be treated as a simple multiplication problem.

This prevents a 2-serving recipe from becoming an absurd 50-serving ingredient list just because every number was multiplied by 25.

## Large-batch / catering behavior

The engine must support quantities much larger than household recipes.

For example:

```text
Recipe base: 2 servings
Target: 50 servings
Scale factor: 25
```

The engine returns:

- final quantities for all ingredients
- full-batch nutrition
- per-serving nutrition
- estimated cooking batches
- any ingredients requiring manual review
- notes explaining non-linear or batch-specific adjustments

For technique-sensitive recipes, large-scale production may require multiple cooking batches rather than one giant vessel. The data model therefore supports `per_batch` ingredients and explicit batch sizing.

## Nutrition scaling

Nutrition stored as `nutritionPerServing` remains stable.

For a requested target serving count:

```text
fullBatchCalories = caloriesPerServing × targetServings
fullBatchProtein  = proteinPerServing × targetServings
...
```

The user can therefore see both:

- nutrition per serving
- nutrition for the entire requested batch

## Canonical data requirement for the 195-country catalog

Every recipe imported into the global knowledge base must have, at minimum:

1. canonical recipe identity
2. base serving yield
3. ingredient quantities
4. explicit units / measurement kind
5. ingredient scaling policy
6. nutrition per serving
7. cultural / cuisine metadata
8. verification status

The scaling engine is shared globally; countries do not receive different implementations. Country-specific recipe knowledge is data, while serving arithmetic is platform logic.

## Architectural invariant

```text
User request
   ↓
Target servings known?
   ├── no  → ask user
   └── yes
         ↓
Recipe knowledge base
         ↓
Global serving scaling engine
         ↓
Scaled ingredients + nutrition + batch guidance
         ↓
Inventory / shopping / meal planning / cooking UI
```

This keeps the same rule consistent across the entire food system and avoids duplicate scaling logic in mobile screens or external integrations.
