# Food Taxonomy Design — Canonical Ingredient, Region and Cuisine Normalization

## Purpose

Create one canonical vocabulary for food intelligence so recommendation, allergy/diet filtering, inventory matching, substitutions, recipe discovery and future price intelligence do not each invent their own aliases or heuristics.

## Two-pass architecture review

### Pass 1 — boundaries

- Keep normalization deterministic and provider-independent.
- Preserve the user's original ingredient/recipe text for display and audit.
- Store canonical IDs separately from display names.
- Treat country, region and cuisine as structured context rather than string matching.
- Keep allergy and dietary safety data explicit and provenance-backed.
- Do not infer hard dietary/allergen safety from recipe titles, cuisine names or weak keywords.
- Do not make country equal to cuisine; one country can contain many regional and cultural cuisines.

### Pass 2 — persistence and compatibility

The durable schema now supports the required relationship boundaries without changing existing user-facing text:

```text
IngredientCanonical
  id
  canonicalKey
  canonicalName
  scientificName?
  foodGroup?
  confidence
  provenance
  version
  └─ IngredientCanonicalAlias[]

RegionCanonical
  id
  countryCode
  regionCode
  canonicalName
  provenance
  version

CuisineCanonical
  id
  canonicalKey
  canonicalName
  parentCuisineId?
  provenance
  version

Recipe
  ingredients → RecipeIngredient
  cuisines → RecipeCuisine → CuisineCanonical
  regions → RecipeRegion → RegionCanonical
  safetyAssertions → RecipeSafetyAssertion

FoodItem
  canonicalIngredientId? → IngredientCanonical

RecipeIngredient
  canonicalIngredientId? → IngredientCanonical

RecipeSafetyAssertion
  assertionType
  value
  effect
  confidence
  provenance
  verified
  version
```

Indexes and uniqueness rules were deliberately chosen around lookup paths and duplicate prevention: canonical keys are unique, ingredient aliases are unique per canonical entity and indexed for lookup, country/region pairs are unique, cuisine hierarchy parents are indexed, recipe join pairs are composite primary keys, and safety assertions are unique per recipe/type/value with a verified lookup index.

The migration is additive: both ingredient canonical foreign keys are nullable, existing rows require no synthetic identity, and deleting a canonical entity clears nullable references rather than deleting food or recipe data. No historical free-text field is rewritten.

## Compatibility strategy

During rollout, existing free-text recipe and inventory names remain valid. Normalization adds canonical linkage; it does not silently rewrite historical user-facing text.

```text
raw user/provider text
        ↓
normalization candidates
        ↓
confidence + provenance
        ↓
canonical entity when verified
        ↓
matching / recommendation / safety logic
```

Low-confidence matches remain unresolved instead of becoming unsafe hard filters.

## First implementation slice

The first code slice is a pure deterministic normalization service plus fixtures/tests for:

- common Persian/English ingredient aliases;
- spelling/spacing/punctuation normalization;
- common unit-independent ingredient identity;
- country/region aliases;
- cuisine aliases and hierarchy;
- explicit unresolved/ambiguous results;
- confidence and provenance preservation.

No production dietary/allergen hard filtering should depend on this first slice until the canonical dataset and provenance meet the safety bar.

## Dependency order

1. Define canonical contracts and IDs.
2. Build deterministic normalization service + tests.
3. Add verified seed data with provenance.
4. Review Prisma relations/indexes.
5. Add migration only after the model has been reviewed twice.
6. Integrate recipe/inventory/recommendation matching.
7. Add true hard dietary/allergen filtering only after verified metadata exists.

## Current implementation checkpoint — 2026-09-05

### Completed

- `IngredientTaxonomyService` added as a deterministic provider-independent foundation.
- Trusted starter aliases cover a small verified seed set rather than pretending to be a complete global corpus.
- Persian/Arabic orthography, zero-width-joiner, punctuation and spacing normalization are handled consistently.
- Unknown ingredients remain explicit unresolved values instead of being fuzzy-matched into a canonical identity.
- Canonical results expose `confidence` and `provenance` so downstream safety logic can distinguish trusted mappings from unresolved input.
- `canonicalizeMany(...)` provides deterministic batch normalization without introducing shared mutable result state.
- `FoodContextNormalizationService` provides conservative country-code and cuisine-family normalization for routing/context.
- `RecipesModule` owns both normalization services without creating a second food-calculation engine.
- Focused tests cover trusted aliases, Persian normalization, unknown/empty behavior, provenance, batch normalization, cuisine aliases and country-code validation.

### Durable schema checkpoint

- Two-pass Prisma review completed for additive canonical metadata persistence.
- `IngredientCanonical` and `IngredientCanonicalAlias` added with provenance/version fields.
- `FoodItem.canonicalIngredientId` and `RecipeIngredient.canonicalIngredientId` are nullable and indexed.
- `CuisineCanonical` supports an explicit parent hierarchy.
- `RegionCanonical` preserves country/region separation.
- `RecipeCuisine` and `RecipeRegion` model many-to-many associations without collapsing a recipe to one cuisine or one region.
- `RecipeSafetyAssertion` stores explicit, provenance-backed safety assertions but does not enable hard filtering by itself.
- Migration `20260905160000_add_food_taxonomy_relations` is additive and has no backfill or destructive rewrite.

### Explicit non-goals

- No fuzzy matching or machine-learned guessing is used for canonical safety decisions.
- No attempt is made to claim full global ingredient coverage.
- No hard allergy/dietary filter is enabled until verified metadata exists.
- No automatic backfill assigns canonical IDs to historical rows.

### Next checkpoint

Validate Prisma schema generation and migration deployment/idempotence on the user runtime and CI. Then add a small verified canonical seed set with explicit provenance, followed by integration of canonical linkage into recipe/inventory/recommendation matching.

## Current status

**Durable schema foundation implemented after two-pass review; runtime/CI migration validation and verified seed data remain before this workstream can be marked fully green.**
