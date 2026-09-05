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

The future schema should support at minimum:

```text
IngredientCanonical
  id
  canonicalName
  scientificName / optional reference name
  aliases[] / alias table
  foodGroup
  allergenFlags
  dietaryFlags
  confidence
  provenance
  version

RegionCanonical
  id
  countryCode
  regionCode
  canonicalName
  aliases
  provenance

CuisineCanonical
  id
  canonicalName
  parentCuisineId?
  regionIds[]
  country associations
  aliases
  provenance

Recipe
  ingredient links → IngredientCanonical
  cuisine links → CuisineCanonical
  region links → RegionCanonical
  dietary/allergen assertions with provenance
```

The exact Prisma relations and indexes must be finalized against the current schema before any migration is created.

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

The first code slice should be a pure deterministic normalization service plus fixtures/tests for:

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

### Explicit non-goals

- No Prisma migration has been created.
- No hard allergy/dietary filter is enabled from these services.
- No fuzzy matching or machine-learned guessing is used for canonical safety decisions.
- No attempt is made to claim full global ingredient coverage.

### Next checkpoint

Expand the canonical seed registry from verified data, then perform the required two-pass Prisma relation/index review before introducing durable canonical IDs into `FoodItem`, `RecipeIngredient`, `Recipe`, inventory or recipe metadata. The existing Recommendation Intelligence slice remains the canonical recommendation execution path and must not be duplicated here.

## Current status

**Foundation implemented; schema migration intentionally deferred until the canonical data contract and persistence relations pass two explicit reviews.**
