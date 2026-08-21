# Canonical Ingredient Intelligence

## Purpose

Create one stable ingredient identity layer shared by recipes, inventory, shopping, nutrition, dietary filtering and recommendation scoring.

## Contract

Every source ingredient line receives:

- `canonical_id`
- `canonical_name`
- `category`
- `flags`
- `dietary` candidate signals
- `confidence`
- `review_required`
- stable unknown fallback when taxonomy coverage is incomplete

Unknown ingredients are never silently discarded. They become `unknown:<stable-slug>` entries with low confidence and an explicit review flag.

## Current implementation

- Base taxonomy: `apps/backend/data/ingredient-taxonomy-v1.json`
- Versioned supplements: `ingredient-taxonomy-supplement-v1.json` through `ingredient-taxonomy-supplement-v9.json`
- Canonical resolver: `apps/backend/scripts/food-entity-resolver-final.mjs`
- Current resolver version: `food-entity-resolver-final-v12`
- Locale knowledge: `apps/backend/data/food-entity-locale-pack-v1.json`
- Food knowledge: `apps/backend/data/food-entity-knowledge-v1.json`
- Quantity intelligence: `apps/backend/scripts/food-quantity-normalizer.mjs`
- Source-part decomposition: `apps/backend/scripts/food-source-part-decomposer.mjs`
- Corpus runner: `apps/backend/scripts/recipe-food-entity-intelligence-final.mjs`
- Resolver self-test: `apps/backend/scripts/food-intelligence-final-self-test.mjs`
- Audit: `apps/backend/scripts/food-entity-unresolved-audit.mjs`

The resolver intentionally separates **identity** from **quantity**. A source line such as `1 cup extra virgin olive oil` must resolve to the same canonical ingredient identity as `olive oil`, while retaining quantity information separately.

Aliases may contain multilingual names, spelling variants and domain synonyms. Canonical redirects are supported when two IDs converge, e.g. `simple_syrup -> syrup_simple`.

## Food decision layer

Canonical ingredient intelligence is now consumed by the dedicated recommendation/decision layer rather than reimplemented there.

The decision path is:

```text
user intent
  -> personalization/context
  -> hard dietary/allergy candidate filters
  -> recipe + canonical ingredient state
  -> serving-scaled inventory coverage
  -> nutrition fit
  -> explicit preferences
  -> novelty
  -> cuisine/country routing
  -> verification
  -> diversified ranking
  -> explainable recommendation
```

`FoodOperatingLoopService` remains the domain integration point for serving scaling, inventory matching, shopping handoff, country context and nutrition constraints. `RecommendationIntelligenceModule` owns the higher-level decision policy and ranking.

The recommendation layer must not create a second ingredient taxonomy. It consumes the canonical resolver/domain outputs.

## Global routing principle

Country context must not mean "only recommend local food". It is a routing and relevance signal. A user in Iran can explicitly ask for Indian food; a user in Spain can ask for seafood; global recipes remain eligible when they match the request. Country data supplies local availability/culture guidance and helps rank, not a hard geographic cuisine lock.

## Safety boundary

Dietary and allergen outputs are candidate signals, not medical clearance. Missing or unresolved ingredients keep `review_required=true` so downstream systems can fail conservatively.

## Completion gate

This slice is considered fully green only after:

1. taxonomy integrity passes;
2. self-test passes;
3. backend build/unit/E2E remain green;
4. dry-run over the full recipe corpus reports coverage and unresolved counts;
5. the apply run updates all recipe profiles without changing recipe/country classification fields;
6. post-apply SQL verification confirms profile count, version and duplicate-free canonical IDs;
7. recommendation decision tests cover hard constraints, inventory, nutrition, cuisine/country routing, novelty and ranking diversity.
