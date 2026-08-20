import assert from 'node:assert/strict';
import { resolveFoodEntity, resolverIntegrity } from './food-entity-resolver-final.mjs';
import { resolveLocalizedFoodEntity, localePackIntegrity } from './localized-food-entity-resolver-final.mjs';
import { normalizeQuantity } from './food-quantity-normalizer.mjs';
import { sourcePartDecomposerSelfTest, splitSourcePart } from './food-source-part-decomposer.mjs';
const integrity = resolverIntegrity();
assert.equal(integrity.valid, true);
assert.ok(integrity.knowledge_entries >= 8);
assert.equal(resolveFoodEntity('450 g chicken breasts, boneless, skinless').canonical_id, 'chicken_breast');
assert.equal(resolveFoodEntity('1 1/2 cups cherry tomatoes').canonical_id, 'tomato_cherry');
assert.equal(resolveFoodEntity('1 1/2 cups cherry tomatoes').quantity, 1.5);
assert.equal(resolveFoodEntity('1 1/2 cups cherry tomatoes').unit, 'cup');
assert.equal(resolveFoodEntity('EVOO').canonical_id, 'olive_oil_extra_virgin');
assert.equal(resolveFoodEntity('aceite de oliva').canonical_id, 'olive_oil');
assert.equal(resolveFoodEntity('روغن زیتون فرابکر').canonical_id, 'olive_oil_extra_virgin');
assert.equal(resolveFoodEntity('olive pomace oil').canonical_id, 'olive_pomace_oil');
assert.deepEqual(resolveFoodEntity('olive pomace oil').relations, [{ type: 'related_but_distinct', target: 'olive_oil' }]);
assert.equal(resolveFoodEntity('dragon fruit protein concentrate').canonical_id, null);
assert.equal(resolveFoodEntity('dragon fruit protein concentrate').review_required, true);
assert.equal(resolveLocalizedFoodEntity('aceite de oliva', 'es').canonical_id, 'olive_oil');
assert.equal(normalizeQuantity('1 1/2 cups').quantity, 1.5);
assert.equal(normalizeQuantity('1/2 cup').quantity, 0.5);
assert.equal(normalizeQuantity('1⁄2 tsp').quantity, 0.5);
assert.equal(normalizeQuantity('1/2-inch pieces').quantity, null);
assert.equal(normalizeQuantity('1 1/2-inch-thick').quantity, null);
assert.equal(normalizeQuantity('10–12 curry leaves').quantity_min, 10);
assert.equal(normalizeQuantity('10–12 curry leaves').quantity_max, 12);
assert.equal(normalizeQuantity('1 to 2 jalapeño peppers').quantity_min, 1);
assert.equal(normalizeQuantity('1 to 2 jalapeño peppers').quantity_max, 2);
assert.equal(normalizeQuantity('6-8 tablespoons jam').quantity_min, 6);
assert.equal(normalizeQuantity('6-8 tablespoons jam').quantity_max, 8);
assert.equal(resolveFoodEntity('10–12 curry leaves').canonical_id, 'curry_leaf');
assert.equal(resolveFoodEntity('1 to 2 jalapeño peppers').canonical_id, 'jalapeno_pepper');
assert.equal(resolveFoodEntity('2 cups 3/4-inch cubes peeled jicama').canonical_id, 'jicama');
assert.equal(resolveFoodEntity('1/3 cup 1% buttermilk').canonical_id, 'buttermilk');

const decomposer = sourcePartDecomposerSelfTest();
assert.equal(decomposer.status, 'pass');
assert.equal(splitSourcePart('chilled, 1 1/2 teaspoons agave syrup or honey, 1 1/2 tablespoons lemon juice, citrus wedges').length, 4);
assert.equal(splitSourcePart('Accompaniments: butter lettuce; thinly sliced garlic; packaged kimchi; steamed white rice').length, 4);
assert.equal(splitSourcePart('450 g chicken breasts, boneless, skinless').length, 1);

const additive = normalizeQuantity('1/4 cup plus 2 tablespoons Sambuca');
assert.equal(additive.quantity, 0.25);
assert.equal(additive.unit, 'cup');
assert.equal(additive.additional_quantity, 2);
assert.equal(additive.additional_unit, 'tbsp');
assert.equal(additive.remainder, 'Sambuca');

const additiveEntity = resolveFoodEntity('1/4 cup plus 2 tablespoons Sambuca');
assert.equal(additiveEntity.canonical_id, 'sambuca');
assert.equal(additiveEntity.additional_quantity, 2);
assert.equal(additiveEntity.additional_unit, 'tbsp');

const packageSizeCases = [
  ['2 3-ounce packages soft ladyfingers', 2, null, 'soft ladyfingers'],
  ['1 28-ounces dry-aged rib-eye steak', 1, null, 'dry-aged rib-eye steak'],
  ['2 5-pound whole Peking ducks', 2, null, 'whole Peking ducks'],
  ['3 6 1/2-ounce cans chopped clams in juice', 3, null, 'chopped clams in juice'],
  ['6 6-ounce Arctic char steaks', 6, null, 'Arctic char steaks'],
  ['1 750-ml chilled bottle Prosecco', 1, null, 'Prosecco'],
];
for (const [input, quantity, unit, remainder] of packageSizeCases) {
  const parsed = normalizeQuantity(input);
  assert.equal(parsed.quantity, quantity, input);
  assert.equal(parsed.unit, unit, input);
  assert.equal(parsed.remainder, remainder, input);
}
assert.equal(normalizeQuantity('1 750-ml chilled bottle Prosecco').package_modifier, 'chilled');
assert.equal(normalizeQuantity('1 750-ml chilled Prosecco').remainder, 'chilled Prosecco');
