# Recipe & Food Intelligence Architecture

## Goal

Build a first-party, global recipe knowledge layer that remains useful without a third-party recipe API. External providers may enrich the dataset later, but they are never a runtime dependency for core recipe discovery or meal planning.

## Product principle

```text
Country / Region / Cuisine
        +
Recipe knowledge
        +
Canonical ingredients
        +
Nutrition
        +
User inventory
        +
User goals / restrictions
        +
Budget / time
        ↓
Recipe Intelligence
        ↓
Ranked personalized meals
        ↓
Meal plan / shopping list / nutrition log
```

## Why the current Recipe model is not enough

The current persistence model stores a recipe name, description, aggregate macros and a list of FoodItem references. That is sufficient for an early CRUD prototype, but not for a global food intelligence system.

The production direction therefore separates these concepts:

- canonical ingredient identity
- user-owned food/inventory state
- country and region attribution
- cuisine classification
- recipe versions and provenance
- serving-level nutrition
- dietary tags and allergens
- substitutions
- preparation metadata
- matching/ranking evidence

Do not solve this by making one giant JSON column. Core relationships need relational integrity and indexes; JSON should be reserved for genuinely variable metadata.

## Target knowledge model

```text
Country
  ├── Region
  └── Cuisine
          ↓
       Recipe
          ├── RecipeIngredient → Ingredient
          ├── NutritionProfile
          ├── DietaryTag
          ├── Allergen
          ├── Substitution
          └── RecipeVersion / Provenance

Ingredient
  ├── aliases / localized names
  ├── nutrition basis
  ├── unit conversions
  └── availability metadata

User Inventory
  └── references canonical Ingredient
```

## Global coverage strategy

Do not promise a finite list of every dish that exists. Food cultures are open-ended.

Instead build coverage in tiers:

1. **National signature coverage** — important dishes for all 195 countries.
2. **Regional coverage** — major regions, provinces and culinary traditions.
3. **Everyday coverage** — common home meals, not only tourist-famous dishes.
4. **Dietary coverage** — vegetarian, vegan, halal, gluten-free, dairy-free, high-protein, low-calorie and other supported tags.
5. **Personalization coverage** — substitutions and inventory-friendly variants.

The dataset can then grow continuously without changing the application architecture.

## Recipe ranking

Recipe discovery should be deterministic and explainable before any AI is involved.

Suggested ranking dimensions:

```text
country/cuisine fit
+ dietary compatibility
+ ingredient inventory coverage
+ nutrition target fit
+ preparation-time fit
+ user preference/history
+ budget fit
- excluded ingredients/allergens
- excessive missing ingredients
```

Every recommendation should retain structured reasons so the Brain can explain why it was selected.

## Inventory intelligence

The same canonical ingredient must connect:

```text
Recipe ingredient
      ↕
Canonical ingredient
      ↕
User inventory
      ↕
Shopping list
```

This enables:

- "What can I cook with what I have?"
- missing-ingredient calculation
- automatic shopping suggestions
- waste reduction
- expiry-aware recommendations
- budget-aware meal planning

## Nutrition rule

Recipe nutrition is a derived domain value, not an arbitrary number typed into the recipe record.

Prefer:

```text
canonical ingredient nutrition
        ×
recipe quantity
        ÷
servings
        ↓
per-serving nutrition
```

Stored nutrition snapshots may be used for performance and reproducibility, but the system must retain enough provenance to know how the value was produced.

## Provenance and trust

Every imported or curated knowledge record should carry provenance such as:

- internal
- licensed
- user-created
- imported

Verified/curated content must be distinguishable from unverified content. External APIs must never silently become the authoritative source of truth.

## API independence

Runtime core:

```text
Mobile → Backend → PostgreSQL / deterministic recipe intelligence
```

Optional enrichment:

```text
External provider → ingestion/validation → our database
```

Never:

```text
Mobile → external recipe provider → core product behavior
```

This protects cost, reliability, latency, privacy and long-term product independence.

## Implementation order

1. Freeze canonical domain contracts.
2. Introduce relational food geography/cuisine entities.
3. Introduce canonical ingredients and unit conversion.
4. Upgrade recipe persistence with provenance/versioning.
5. Build deterministic recipe matching/ranking.
6. Connect inventory and shopping-list intelligence.
7. Add nutrition derivation and validation.
8. Seed initial global coverage in batches.
9. Add quality checks and duplicate detection.
10. Only then consider optional external enrichment pipelines.

## Non-negotiable quality rules

- No fake completeness claims.
- No duplicate ingredient identities merely because names differ by language.
- No recipe recommendation that ignores explicit allergens/restrictions.
- No external API as a single point of failure.
- No post-hoc explanation that was not supported by ranking evidence.
- No irreversible schema shortcut that blocks regional cuisines, localized names or recipe variants later.
