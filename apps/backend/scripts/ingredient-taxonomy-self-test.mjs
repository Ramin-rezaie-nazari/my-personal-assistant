import assert from 'node:assert/strict';
import { analyzeIngredientLine, analyzeRecipeIngredients, taxonomyIntegrity } from './ingredient-taxonomy-engine.mjs';

const integrity = taxonomyIntegrity();
assert.equal(integrity.valid, true, JSON.stringify(integrity));
assert.ok(integrity.entries >= 70);
assert.equal(integrity.conflictingIds.length, 0);

const oliveOil = analyzeIngredientLine('2 tbsp extra virgin olive oil');
assert.equal(oliveOil.canonical_id, 'olive_oil');
assert.equal(oliveOil.review_required, false);

const chicken = analyzeIngredientLine('450 g chicken breasts, boneless, skinless');
assert.equal(chicken.canonical_id, 'chicken_breast');
assert.equal(chicken.flags.meat, true);
assert.equal(chicken.dietary.vegetarian_compatible_candidate, false);

const milk = analyzeIngredientLine('1 cup whole milk');
assert.equal(milk.canonical_id, 'milk');
assert.equal(milk.flags.dairy, true);

const ambiguousStock = analyzeIngredientLine('1 cup chicken stock');
assert.equal(ambiguousStock.canonical_id, 'stock');
assert.equal(ambiguousStock.review_required, true);
assert.equal(ambiguousStock.reason, 'composition_ambiguous');

const unknown = analyzeIngredientLine('1 cup dragon fruit powder concentrate');
assert.equal(unknown.category, 'unknown');
assert.equal(unknown.review_required, true);
assert.match(unknown.canonical_id, /^unknown:/);

const recipe = analyzeRecipeIngredients(['2 tbsp olive oil', '1 cup whole milk', '2 eggs', '1/2 cup all-purpose flour', '1 tbsp tahini']);
assert.equal(recipe.raw_count, 5);
assert.equal(recipe.coverage, 1);
assert.equal(recipe.flags.contains_dairy, true);
assert.equal(recipe.flags.contains_egg, true);
assert.equal(recipe.flags.contains_sesame, true);
assert.equal(recipe.flags.contains_gluten_candidate, true);
assert.equal(recipe.dietary.vegan_candidate, false);
assert.equal(recipe.dietary.vegetarian_candidate, true);

console.log(JSON.stringify({ status: 'pass', taxonomyEntries: integrity.entries, cases: 6 }, null, 2));
