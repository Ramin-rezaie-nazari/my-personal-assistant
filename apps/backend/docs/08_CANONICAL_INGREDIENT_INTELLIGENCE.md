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

- Versioned taxonomy: `apps/backend/data/ingredient-taxonomy-v1.json`
- Deterministic engine: `apps/backend/scripts/ingredient-taxonomy-engine.mjs`
- Corpus runner: `apps/backend/scripts/recipe-ingredient-intelligence.mjs`
- Self-test: `apps/backend/scripts/ingredient-taxonomy-self-test.mjs`
- Backend CI runs the self-test before the full Jest/E2E suite.

## Safety boundary

Dietary and allergen outputs are candidate signals, not medical clearance. Missing or unresolved ingredients keep `review_required=true` so downstream systems can fail conservatively.

## Completion gate

This slice is considered fully green only after:

1. taxonomy integrity passes;
2. self-test passes;
3. backend build/unit/E2E remain green;
4. dry-run over the full recipe corpus reports coverage and unresolved counts;
5. the apply run updates all recipe profiles without changing recipe/country classification fields;
6. post-apply SQL verification confirms profile count, version and duplicate-free canonical IDs.
